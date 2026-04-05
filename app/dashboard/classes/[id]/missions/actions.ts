"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";

export async function generateClassroomMission(classId: string, tier: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'improvement_drill', drillTopic?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Fetch Class Context to get student_id and tutor_id
  const { data: classRoom, error: classErr } = await supabase
     .from("classes")
     .select("student_id, tutor_id")
     .eq("id", classId)
     .single();

  if (classErr || !classRoom) {
     return { error: "Failed to locate classroom context." };
  }

  // 2. Determine Date Bounds based on Tier
  const now = new Date();
  let dateLimit = new Date();
  
  if (tier === 'daily' || tier === 'weekly') {
      // Just fetch the absolute latest lesson
      dateLimit = new Date(0); // Fetch all, we'll limit to 1
  } else if (tier === 'monthly') {
      dateLimit.setMonth(now.getMonth() - 1);
  } else if (tier === 'quarterly') {
      dateLimit.setMonth(now.getMonth() - 3);
  } else if (tier === 'annual') {
      dateLimit.setFullYear(now.getFullYear() - 1);
  } else if (tier === 'improvement_drill') {
      dateLimit.setMonth(now.getMonth() - 6); // Fetch last 6 months for context
  }

  // 3. Query bookings to get all relevant lesson notes
  let query = supabase
    .from("bookings")
    .select(`
      id,
      lesson_notes ( summary )
    `)
    .eq("student_id", classRoom.student_id)
    .eq("tutor_id", classRoom.tutor_id)
    .gte("created_at", dateLimit.toISOString())
    .order("created_at", { ascending: false });

  if (tier === 'daily' || tier === 'weekly') {
      query = query.limit(1);
  }

  const { data: recentBookings, error: bookingErr } = await query;

  if (bookingErr || !recentBookings || recentBookings.length === 0) {
    return { error: "No lesson history found to generate this mission scope." };
  }

  // Extract all summaries
  let combinedSummary = "";
  let bookingIds: string[] = [];

  recentBookings.forEach(booking => {
     const notesArray = Array.isArray(booking.lesson_notes) ? booking.lesson_notes : [booking.lesson_notes];
     if (notesArray[0]?.summary) {
         combinedSummary += `- ${notesArray[0].summary}\n\n`;
         bookingIds.push(booking.id);
     }
  });

  if (!combinedSummary.trim()) {
    return { error: "Your Sensei hasn't written any summaries for the specified timeframe." };
  }

  // 4. Setup Gemini
  if (!process.env.GEMINI_API_KEY) {
    return { error: "Google Gemini API key missing." };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const missionSchema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      topic: { type: SchemaType.STRING, description: "The overarching theme uniting these lessons." },
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
                correctIndex: { type: SchemaType.INTEGER }
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
          corruptedText: { type: SchemaType.STRING },
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

  const difficultyMod = tier === 'annual' ? "Level: VERY HARD. Deep synthesis required." : "Level: Moderate.";
  const drillDirective = tier === 'improvement_drill' ? `FOCUS HEAVILY ON THIS WEAK TOPIC: ${drillTopic}` : "";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: missionSchema,
    },
    systemInstruction: `You are an Educational Mission Architect. You are drafting a ${tier} exam. ${difficultyMod} ${drillDirective}
    
Transform the provided lesson summaries into a progressive 4-stage mission. Ensure the exam covers the breadth of the provided notes.`
  });

  try {
    const prompt = `Lesson Summaries:\n\n${combinedSummary}`;
    const result = await model.generateContent(prompt);
    const missionData = JSON.parse(result.response.text());

    // 5. Insert to Database
    const { data: newMission, error: insertErr } = await supabase.from('student_missions').insert({
        student_id: classRoom.student_id,
        tutor_id: classRoom.tutor_id,
        mission_tier: tier,
        booking_ids: bookingIds,
        mission_blueprint: missionData,
        status: 'pending_assessment'
    }).select().single();

    if (insertErr) {
       console.error(insertErr);
       return { error: "Mission built, but failed to log to database." };
    }

    return { mission: newMission };
  } catch (err: any) {
    console.error("Gemini Error:", err);
    return { error: "Failed to generate mission from AI." };
  }
}
