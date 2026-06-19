"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import {
  type GeneratedQuestion,
  type QuestionGeneratorResult,
} from "@/lib/question-generator";
import { validateQuizSelection } from "@/lib/educationTaxonomy";

const initialError: QuestionGeneratorResult = {
  status: "error",
  questions: [],
};

function cleanCount(value: FormDataEntryValue | null) {
  const count = Number(value || 6);
  if (!Number.isFinite(count)) return 6;
  return Math.round(count);
}

const unitLatexByText: Record<string, string> = {
  A: "A",
  C: "C",
  Hz: "Hz",
  J: "J",
  K: "K",
  N: "N",
  Pa: "Pa",
  V: "V",
  W: "W",
  cm: "cm",
  g: "g",
  kg: "kg",
  kJ: "kJ",
  km: "km",
  m: "m",
  "m/s": "\\mathrm{m}\\,\\mathrm{s}^{-1}",
  "m/s^2": "\\mathrm{m}\\,\\mathrm{s}^{-2}",
  min: "min",
  mol: "mol",
  ohm: "\\Omega",
  ohms: "\\Omega",
  s: "s",
};

function transformOutsideMathDelimiters(text: string, transform: (segment: string) => string) {
  let cursor = 0;
  let output = "";

  while (cursor < text.length) {
    const inlineIndex = text.indexOf("\\(", cursor);
    const displayIndex = text.indexOf("\\[", cursor);
    const mathStart = inlineIndex === -1
      ? displayIndex
      : displayIndex === -1
        ? inlineIndex
        : Math.min(inlineIndex, displayIndex);

    if (mathStart === -1) {
      output += transform(text.slice(cursor));
      break;
    }

    const isDisplay = text.startsWith("\\[", mathStart);
    const closeDelimiter = isDisplay ? "\\]" : "\\)";
    const mathEnd = text.indexOf(closeDelimiter, mathStart + 2);

    if (mathEnd === -1) {
      output += transform(text.slice(cursor));
      break;
    }

    output += transform(text.slice(cursor, mathStart));
    output += text.slice(mathStart, mathEnd + 2);
    cursor = mathEnd + 2;
  }

  return output;
}

function normalizeMathDelimiters(text: string) {
  return text
    .replace(/\$begin:math:text\$/g, "\\(")
    .replace(/\$end:math:text\$/g, "\\)")
    .replace(/\$begin:math:display\$/g, "\\[")
    .replace(/\$end:math:display\$/g, "\\]")
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, source: string) => `\\[${source.trim()}\\]`)
    .replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_match, prefix: string, source: string) => `${prefix}\\(${source.trim()}\\)`);
}

function readBracedGroupEnd(text: string, startIndex: number) {
  if (text[startIndex] !== "{") return startIndex;

  let depth = 0;
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === "{") depth += 1;
    if (text[index] === "}") depth -= 1;
    if (depth === 0) return index + 1;
  }

  return startIndex;
}

function readScriptEnd(text: string, startIndex: number) {
  let cursor = startIndex;

  while (text[cursor] === "^" || text[cursor] === "_") {
    cursor += 1;

    if (text[cursor] === "{") {
      const groupEnd = readBracedGroupEnd(text, cursor);
      if (groupEnd === cursor) break;
      cursor = groupEnd;
    } else {
      cursor += 1;
    }
  }

  return cursor;
}

function consumeRawLatexCommand(text: string, startIndex: number) {
  const commandMatch = text.slice(startIndex).match(/^\\([A-Za-z]+)/);
  const command = commandMatch?.[1];
  if (!command) return null;

  const requiredGroups: Record<string, number> = {
    frac: 2,
  };
  const optionalGroupCommands = new Set([
    "bar",
    "hat",
    "mathrm",
    "overline",
    "sqrt",
    "text",
    "vec",
  ]);
  const simpleCommands = new Set([
    "alpha",
    "beta",
    "cdot",
    "cos",
    "Delta",
    "gamma",
    "ge",
    "le",
    "ln",
    "log",
    "ne",
    "Omega",
    "pi",
    "pm",
    "sin",
    "tan",
    "theta",
    "times",
  ]);

  if (!(command in requiredGroups) && !optionalGroupCommands.has(command) && !simpleCommands.has(command)) {
    return null;
  }

  let cursor = startIndex + command.length + 1;
  const groupsToRead = requiredGroups[command] || 0;

  for (let groupIndex = 0; groupIndex < groupsToRead; groupIndex += 1) {
    const groupEnd = readBracedGroupEnd(text, cursor);
    if (groupEnd === cursor) return null;
    cursor = groupEnd;
  }

  if (optionalGroupCommands.has(command) && groupsToRead === 0 && text[cursor] === "{") {
    const groupEnd = readBracedGroupEnd(text, cursor);
    if (groupEnd !== cursor) cursor = groupEnd;
  }

  cursor = readScriptEnd(text, cursor);
  return { end: cursor, source: text.slice(startIndex, cursor) };
}

function wrapRawLatexCommands(text: string) {
  return transformOutsideMathDelimiters(text, (segment) => {
    let output = "";
    let cursor = 0;

    while (cursor < segment.length) {
      if (segment[cursor] !== "\\") {
        output += segment[cursor];
        cursor += 1;
        continue;
      }

      const latexCommand = consumeRawLatexCommand(segment, cursor);
      if (!latexCommand || latexCommand.end <= cursor) {
        output += segment[cursor];
        cursor += 1;
        continue;
      }

      output += `\\(${latexCommand.source}\\)`;
      cursor = latexCommand.end;
    }

    return output;
  });
}

function addMathNotation(text: string) {
  const normalizedText = wrapRawLatexCommands(normalizeMathDelimiters(text));

  return transformOutsideMathDelimiters(normalizedText, (segment) => segment
    .replace(/\b(\d+(?:\.\d+)?)\s*(m\/s\^2|m\/s|kg|kJ|km|cm|Hz|mol|min|ohms?|Pa|[ACJKNVWKmsg])\b/g, (_match, value: string, unit: string) => {
      const latexUnit = unitLatexByText[unit] || unit;
      const formattedUnit = latexUnit.startsWith("\\") ? latexUnit : `\\mathrm{${latexUnit}}`;
      return `\\(${value}\\,${formattedUnit}\\)`;
    })
    .replace(/\b([a-zA-Z])\^(\d+)\b/g, "\\($1^{$2}\\)")
    .replace(/\bsqrt\(([^)]+)\)/g, "\\(\\sqrt{$1}\\)")
    .replace(/\bsin\(theta\)/gi, "\\(\\sin(\\theta)\\)")
    .replace(/\bpi\b/g, "\\(\\pi\\)")
    .replace(/<=/g, "\\(\\le\\)")
    .replace(/>=/g, "\\(\\ge\\)")
    .replace(/!=/g, "\\(\\ne\\)"));
}

function formatQuestionNotation(question: GeneratedQuestion): GeneratedQuestion {
  return {
    ...question,
    question: addMathNotation(question.question),
    answer: addMathNotation(question.answer),
    working: addMathNotation(question.working),
  };
}

function buildFallbackQuestions(subject: string, level: string, topic: string, count: number): GeneratedQuestion[] {
  const clean = topic || subject;
  const topicPrefix = topic === "Mixed Topics" ? subject : topic;
  const isMath = subject.includes("Mathematics");
  const isPhysics = subject === "Physics";
  const isChemistry = subject === "Chemistry";
  const isBiology = subject === "Biology" || subject === "Science" || subject === "Combined Science";
  const isComputing = subject === "Computer Science" || subject === "Computing" || subject === "Computing Science";

  const bank: GeneratedQuestion[] = isMath
    ? [
        {
          question: `${topicPrefix} question 1: Solve \\(3x + 7 = 31\\).`,
          answer: "\\(x = 8\\)",
          working: "Subtract \\(7\\) from both sides to get \\(3x = 24\\). Divide by \\(3\\) to get \\(x = 8\\).",
          skill: topicPrefix,
          difficulty: level,
        },
        {
          question: `${topicPrefix} question 2: Expand and simplify \\(4(2x - 3) + 5x\\).`,
          answer: "\\(13x - 12\\)",
          working: "Expand the bracket to get \\(8x - 12\\), then add \\(5x\\) to get \\(13x - 12\\).",
          skill: topicPrefix,
          difficulty: level,
        },
        {
          question: `${topicPrefix} question 3: Factorise \\(x^2 + 7x + 12\\).`,
          answer: "\\((x + 3)(x + 4)\\)",
          working: "Find two numbers that multiply to \\(12\\) and add to \\(7\\): \\(3\\) and \\(4\\).",
          skill: clean,
          difficulty: level,
        },
        {
          question: `${topicPrefix} question 4: The table shows the heights of students in a class.\n\n| Height, \\(h\\) cm | Frequency |\n|---|---:|\n| \\(140 < h \\le 150\\) | 15 |\n| \\(150 < h \\le 160\\) | 30 |\n| \\(160 < h \\le 170\\) | 40 |\n| \\(170 < h \\le 180\\) | 15 |\n\nEstimate the mean height of the students.`,
          answer: "\\(160.5\\,\\mathrm{cm}\\)",
          working: "Use class midpoints.\n\\(145 \\times 15 = 2175\\)\n\\(155 \\times 30 = 4650\\)\n\\(165 \\times 40 = 6600\\)\n\\(175 \\times 15 = 2625\\)\nTotal frequency \\(= 100\\).\nEstimated mean \\(= \\frac{16050}{100} = 160.5\\,\\mathrm{cm}\\).",
          skill: topicPrefix,
          difficulty: level,
        },
      ]
    : isPhysics
      ? [
          {
            question: `${topicPrefix} question 1: A car travels \\(150\\,\\mathrm{m}\\) in \\(12\\,\\mathrm{s}\\). Calculate its average speed.`,
            answer: "\\(12.5\\,\\mathrm{m\\,s^{-1}}\\)",
            working: "\\(\\text{speed} = \\frac{\\text{distance}}{\\text{time}} = \\frac{150}{12} = 12.5\\,\\mathrm{m\\,s^{-1}}\\).",
            skill: clean,
            difficulty: level,
          },
          {
            question: `${topicPrefix} question 2: A force of \\(20\\,\\mathrm{N}\\) acts on a \\(5\\,\\mathrm{kg}\\) object. Calculate the acceleration.`,
            answer: "\\(4\\,\\mathrm{m\\,s^{-2}}\\)",
            working: "Use \\(F = ma\\). Acceleration is \\(a = \\frac{F}{m} = \\frac{20}{5} = 4\\,\\mathrm{m\\,s^{-2}}\\).",
            skill: topicPrefix,
            difficulty: level,
          },
          {
            question: `${topicPrefix} question 3: A trolley is pulled with different resultant forces. The table shows the data collected.\n\n| Resultant force, \\(F\\) N | Acceleration, \\(a\\) \\(\\mathrm{m\\,s^{-2}}\\) |\n|---:|---:|\n| 2 | 0.5 |\n| 4 | 1.0 |\n| 6 | 1.5 |\n| 8 | 2.0 |\n\nUse the table to calculate the mass of the trolley.`,
            answer: "\\(4\\,\\mathrm{kg}\\)",
            working: "Use \\(F = ma\\).\nChoose any row from the table, for example \\(F = 4\\,\\mathrm{N}\\) and \\(a = 1.0\\,\\mathrm{m\\,s^{-2}}\\).\n\\(m = \\frac{F}{a} = \\frac{4}{1.0} = 4\\,\\mathrm{kg}\\).",
            skill: topicPrefix,
            difficulty: level,
          },
        ]
      : isChemistry
        ? [
            {
              question: `${topicPrefix} question 1: Balance the equation \\(\\mathrm{H_2 + O_2 \\rightarrow H_2O}\\).`,
              answer: "\\(\\mathrm{2H_2 + O_2 \\rightarrow 2H_2O}\\)",
              working: "Balance oxygen first by making \\(\\mathrm{2H_2O}\\), then balance hydrogen with \\(\\mathrm{2H_2}\\).",
              skill: clean,
              difficulty: level,
            },
            {
              question: `${topicPrefix} question 2: Calculate the relative formula mass of \\(\\mathrm{CO_2}\\). Use \\(\\mathrm{C} = 12\\) and \\(\\mathrm{O} = 16\\).`,
              answer: "\\(44\\)",
              working: "\\(\\mathrm{CO_2}\\) has one carbon and two oxygens, so \\(12 + 16 + 16 = 44\\).",
              skill: topicPrefix,
              difficulty: level,
            },
          ]
        : isBiology
          ? [
              {
                question: `${topicPrefix} question 1: Name the process plants use to make glucose from carbon dioxide and water.`,
                answer: "Photosynthesis",
                working: "Photosynthesis uses light energy to convert carbon dioxide and water into glucose and oxygen.",
                skill: clean,
                difficulty: level,
              },
              {
                question: `${topicPrefix} question 2: Explain why red blood cells contain haemoglobin.`,
                answer: "To carry oxygen around the body.",
                working: "Haemoglobin binds oxygen in the lungs and releases it to body cells where respiration occurs.",
                skill: topicPrefix,
                difficulty: level,
              },
            ]
          : isComputing
            ? [
                {
                  question: `${topicPrefix} question 1: A program stores the numbers \\(4\\), \\(7\\), and \\(9\\) in a list. Write pseudocode to print each number doubled.`,
                  answer: "FOR each number in list: PRINT number * 2",
                  working: "Use a loop to visit each value once, multiply it by \\(2\\), then output the result.",
                  skill: clean,
                  difficulty: level,
                },
                {
                  question: `${topicPrefix} question 2: Explain the difference between a variable and a constant.`,
                  answer: "A variable can change while a constant should stay the same during the program.",
                  working: "A variable stores data that may be updated. A constant stores a fixed value such as pi or a maximum score.",
                  skill: topicPrefix,
                  difficulty: level,
                },
              ]
            : [
              {
                question: `${topicPrefix} question 1: Write a focused answer to this ${subject} question: how does ${clean} affect the main idea or outcome?`,
                answer: "A strong answer should define the key idea, apply it to the topic, and support it with evidence.",
                working: "Identify the command word, define the concept, apply it to the topic, and include one precise example.",
                skill: clean,
                difficulty: level,
              },
            ];

  return Array.from({ length: count }, (_, index) => bank[index % bank.length]).map((question, index) => formatQuestionNotation({
    ...question,
    question: index < bank.length ? question.question : `${question.question} Use a different example for attempt ${index + 1}.`,
  }));
}

const questionSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING },
          working: { type: SchemaType.STRING },
          skill: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING },
        },
        required: ["question", "answer", "working", "skill", "difficulty"],
      },
    },
  },
  required: ["questions"],
};

export async function generatePracticeQuestions(
  _previousState: QuestionGeneratorResult,
  formData: FormData,
): Promise<QuestionGeneratorResult> {
  const stage = String(formData.get("stage") || "");
  const curriculum = String(formData.get("curriculum") || "");
  const level = String(formData.get("level") || "");
  const subject = String(formData.get("subject") || "");
  const topic = String(formData.get("topic") || "");
  const count = cleanCount(formData.get("count"));
  const validation = validateQuizSelection({ stage, curriculum, level, subject, topic, count });

  if (!validation.valid) {
    return {
      ...initialError,
      message: validation.error || "Please choose a valid stage, curriculum, level, subject, and topic combination.",
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      status: "success",
      source: "fallback",
      message: "Practice Dojo is using a built-in question set in this environment.",
      questions: buildFallbackQuestions(subject, level, topic, count),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.45,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
      },
      systemInstruction: `You are ScienceDojo's academic question generator.
Create real, answerable practice questions for students.
Do not create meta-study prompts such as "explain a key idea", "make a plan", or "how could AI help".
For Math/Further Math, include actual numbers, equations, diagrams described in words, or functions where appropriate.
For sciences, include calculations, data, definitions, explanations, required practical style questions, or application questions.
For humanities/English, include extract-style, short-answer, essay-planning, evidence, or analysis questions.
Use professional mathematical notation with KaTeX-compatible LaTeX delimiters. Wrap inline maths in \\(...\\) and display maths in \\[...\\].
Use LaTeX for powers, roots, fractions, inequalities, Greek letters, logs, trigonometry, integrals, chemical formulae, and units where appropriate. For example: \\(3^2\\), \\(x^2 - 4x + 5\\), \\(\\sin(\\theta)\\), \\(\\sqrt{2x - 5}\\), \\(\\int x^2\\,dx\\), \\(\\log_2(x)\\), \\(\\pi\\), \\(\\le\\), \\(\\ge\\), and \\(\\ne\\).
Do not use dollar math delimiters. Never output $...$, $$...$$, $begin:math:text$, or $end:math:text$.
Do not output raw LaTeX commands outside math delimiters. For example, output \\(\\frac{3 + \\sqrt{2}}{5 - \\sqrt{2}}\\), not $\\frac{3 + \\sqrt{2}}{5 - \\sqrt{2}}$ and not \\frac{3 + \\sqrt{2}}{5 - \\sqrt{2}}.
Do not output programming-style notation such as x^2, sqrt(...), sin(theta), <=, >=, or != when the content is mathematical.
When a question, answer, or working uses tabular data, output it as a markdown table with one row per line. Keep maths inside table cells wrapped in \\(...\\), for example \\(140 < h \\le 150\\). Do not describe a table unless an actual markdown table is included. Do not output HTML tables.
Keep working guidance readable. Use line breaks between calculation steps, and keep numbered steps on separate lines.
Every item must include a concise answer and working/marking guidance.
Every question must be mathematically coherent, unambiguous, and solvable from the information given. Avoid malformed symbolic names such as "S" appended to variables, unexplained vector notation, missing diagrams, or table labels that do not match the question.
Keep questions age-appropriate for the selected level and curriculum.`,
    });

    const result = await model.generateContent(
      topic === "Mixed Topics"
        ? `Generate ${count} mixed-topic practice questions for ${stage}, ${curriculum}, ${level}, ${subject}.

Educational stage: ${stage}
Curriculum / qualification: ${curriculum}
Level: ${level}
Subject: ${subject}
Topic: Mixed Topics

Make the questions specific to the selected subject and suitable for independent revision.
If any question needs data in rows or columns, include a markdown table with one row per line before the question prompt.`
        : `Generate ${count} practice questions for ${stage}, ${curriculum}, ${level}, ${subject}, topic: ${topic}.

Educational stage: ${stage}
Curriculum / qualification: ${curriculum}
Level: ${level}
Subject: ${subject}
Topic: ${topic}

Make the questions specific to the topic and suitable for independent revision.
If any question needs data in rows or columns, include a markdown table with one row per line before the question prompt.`,
    );
    const parsed = JSON.parse(result.response.text()) as { questions?: GeneratedQuestion[] };
    const questions = (parsed.questions || [])
      .slice(0, count)
      .filter((question) => question.question && question.answer)
      .map(formatQuestionNotation);

    if (questions.length === 0) {
      throw new Error("No valid questions returned.");
    }

    return {
      status: "success",
      source: "llm",
      questions,
    };
  } catch (error) {
    console.error("AI question generation failed:", error);
    return {
      status: "success",
      source: "fallback",
      message: "Practice Dojo could not prepare a fresh set, so it used built-in practice questions instead.",
      questions: buildFallbackQuestions(subject, level, topic, count),
    };
  }
}
