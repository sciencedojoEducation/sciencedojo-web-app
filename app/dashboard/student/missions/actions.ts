"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

export async function generateWeeklyMission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Fetch latest lesson summary for the student
  const { data: latestBooking, error: bookingErr } = await supabase
    .from("bookings")
    .select(`
      id,
      lesson_notes ( summary )
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (bookingErr || !latestBooking) {
    return { error: "No recent lessons found to generate a mission from." };
  }

  // Handle case where notes array might be empty or missing
  // Note: Since lesson_notes is 1-to-1 or 1-to-many, we handle mapping safely
  const notesArray = Array.isArray(latestBooking.lesson_notes) ? latestBooking.lesson_notes : [latestBooking.lesson_notes];
  const latestSummary = notesArray[0]?.summary;

  if (!latestSummary) {
    return { error: "Your tutor hasn't written a summary for your latest lesson yet." };
  }

  // 2. Setup Gemini
  if (!process.env.GEMINI_API_KEY) {
    return { error: "Google Gemini API key missing. Please check .env.local" };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const missionSchema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      topic: { type: SchemaType.STRING, description: "The overarching topic pulled from the summary." },
      stage1: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                correctIndex: { type: SchemaType.INTEGER, description: "0-based index of the correct option" }
              },
              required: ["question", "options", "correctIndex"]
            }
          }
        },
        required: ["title", "questions"]
      },
      stage2: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          missionPrompt: { type: SchemaType.STRING }
        },
        required: ["title", "missionPrompt"]
      },
      stage3: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          scenarioContext: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING }
        },
        required: ["title", "scenarioContext", "question"]
      },
      stage4: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          missionPrompt: { type: SchemaType.STRING },
          corruptedText: { type: SchemaType.STRING, description: "A paragraph containing exactly 3 incorrect terms." },
          errors: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                wrongWord: { type: SchemaType.STRING },
                correctWord: { type: SchemaType.STRING }
              },
              required: ["wrongWord", "correctWord"]
            }
          }
        },
        required: ["title", "missionPrompt", "corruptedText", "errors"]
      }
    },
    required: ["topic", "stage1", "stage2", "stage3", "stage4"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: missionSchema,
    },
    systemInstruction: `You are an Educational Mission Architect. Your task is to transform a raw lesson summary into a progressive, 4-stage practice mission. 

The 4-Stage Logic:
- Stage 1: The Scout (Recall). Focus: Recognition of key terms. Format: 3 Multiple Choice Questions. Difficulty: 2/10.
- Stage 2: The Specialist (Logic). Focus: Understanding "Why" and "How". Format: 1 Short Answer logic challenge connecting two ideas. Difficulty: 5/10.
- Stage 3: The Architect (Application). Focus: Using knowledge in a new context. Format: A "What If?" Scenario. Difficulty: 7/10.
- Stage 4: The Master (Evaluation). Focus: Critical thinking. Format: "Corrupted Data" (Write a paragraph mixing 3 scientific/topical errors). Output the paragraph and list the specific wrong & correct words. Difficulty: 9/10.`
  });

  try {
    const prompt = `Generate a 4-stage mission based on this lesson summary:\n\n${latestSummary}`;
    const result = await model.generateContent(prompt);
    const missionData = JSON.parse(result.response.text());

    return { mission: missionData };
  } catch (err: any) {
    console.error("Gemini Error:", err);
    return { error: "Failed to generate mission from AI." };
  }
}
