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
          question: `${topicPrefix} question 1: Solve 3x + 7 = 31.`,
          answer: "x = 8",
          working: "Subtract 7 from both sides to get 3x = 24. Divide by 3 to get x = 8.",
          skill: topicPrefix,
          difficulty: level,
        },
        {
          question: `${topicPrefix} question 2: Expand and simplify 4(2x - 3) + 5x.`,
          answer: "13x - 12",
          working: "Expand the bracket to get 8x - 12, then add 5x to get 13x - 12.",
          skill: topicPrefix,
          difficulty: level,
        },
        {
          question: `${topicPrefix} question 3: Factorise x^2 + 7x + 12.`,
          answer: "(x + 3)(x + 4)",
          working: "Find two numbers that multiply to 12 and add to 7: 3 and 4.",
          skill: clean,
          difficulty: level,
        },
        {
          question: `${topicPrefix} question 4: A rectangle has length 2x + 5 and width x. Its perimeter is 34 cm. Find x.`,
          answer: "x = 4",
          working: "Perimeter = 2(length + width), so 2((2x + 5) + x) = 34. This gives 6x + 10 = 34, so 6x = 24 and x = 4.",
          skill: topicPrefix,
          difficulty: level,
        },
      ]
    : isPhysics
      ? [
          {
            question: `${topicPrefix} question 1: A car travels 150 m in 12 s. Calculate its average speed.`,
            answer: "12.5 m/s",
            working: "Speed = distance / time = 150 / 12 = 12.5 m/s.",
            skill: clean,
            difficulty: level,
          },
          {
            question: `${topicPrefix} question 2: A force of 20 N acts on a 5 kg object. Calculate the acceleration.`,
            answer: "4 m/s^2",
            working: "Use F = ma. Acceleration = F / m = 20 / 5 = 4 m/s^2.",
            skill: topicPrefix,
            difficulty: level,
          },
        ]
      : isChemistry
        ? [
            {
              question: `${topicPrefix} question 1: Balance the equation: H2 + O2 -> H2O.`,
              answer: "2H2 + O2 -> 2H2O",
              working: "Balance oxygen first by making 2H2O, then balance hydrogen with 2H2.",
              skill: clean,
              difficulty: level,
            },
            {
              question: `${topicPrefix} question 2: Calculate the relative formula mass of CO2. Use C = 12 and O = 16.`,
              answer: "44",
              working: "CO2 has one carbon and two oxygens, so 12 + 16 + 16 = 44.",
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
                  question: `${topicPrefix} question 1: A program stores the numbers 4, 7, and 9 in a list. Write pseudocode to print each number doubled.`,
                  answer: "FOR each number in list: PRINT number * 2",
                  working: "Use a loop to visit each value once, multiply it by 2, then output the result.",
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

  return Array.from({ length: count }, (_, index) => bank[index % bank.length]).map((question, index) => ({
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
      message: "The AI service is not configured in this environment, so ScienceDojo generated fallback practice questions instead.",
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
Every item must include a concise answer and working/marking guidance.
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

Make the questions specific to the selected subject and suitable for independent revision.`
        : `Generate ${count} practice questions for ${stage}, ${curriculum}, ${level}, ${subject}, topic: ${topic}.

Educational stage: ${stage}
Curriculum / qualification: ${curriculum}
Level: ${level}
Subject: ${subject}
Topic: ${topic}

Make the questions specific to the topic and suitable for independent revision.`,
    );
    const parsed = JSON.parse(result.response.text()) as { questions?: GeneratedQuestion[] };
    const questions = (parsed.questions || []).slice(0, count).filter((question) => question.question && question.answer);

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
      message: "The AI service was unavailable, so ScienceDojo generated fallback practice questions instead.",
      questions: buildFallbackQuestions(subject, level, topic, count),
    };
  }
}
