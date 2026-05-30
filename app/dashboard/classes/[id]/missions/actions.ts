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
    return { error: "Your tutor has not added lesson summaries for this timeframe yet." };
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

  const difficultyMod = tier === 'annual' ? "Level: exam preparation. Include deeper synthesis where appropriate." : "Level: calm structured reinforcement.";
  const drillDirective = tier === 'improvement_drill' ? `FOCUS HEAVILY ON THIS WEAK TOPIC: ${drillTopic}` : "";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: missionSchema,
    },
    systemInstruction: `You are an educational practice designer. You are drafting a ${tier} guided learning Mission. ${difficultyMod} ${drillDirective}
    
Transform the provided lesson summaries into a progressive 4-stage learning journey. Keep the tone structured, calm, mentor-guided, and confidence-building.`
  });

  try {
    const prompt = `Lesson Summaries:\n\n${combinedSummary}`;
    const result = await model.generateContent(prompt);
    const missionData = JSON.parse(result.response.text());

    // 5. Insert to Database
    const { data: newMission, error: insertErr } = await supabase.from('student_missions').insert({
        student_id: classRoom.student_id,
        tutor_id: classRoom.tutor_id,
        class_id: classId,
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
    return { error: "Failed to prepare this guided Mission." };
  }
}

export async function evaluateMission(missionId: string, s1Answers: any, s2Answer: string, s3Answer: string, s4Answers: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: mission, error: err } = await supabase.from('student_missions').select('*').eq('id', missionId).single();
  if (err || !mission) return { error: "Mission not found." };
  
  if (mission.status !== 'pending_assessment') {
     return { error: "Mission already assessed." };
  }

  const blueprint = mission.mission_blueprint;
  
  // Calculate Stage 1 automatically (safe)
  let s1Score = 0;
  if (blueprint.stage1?.questions) {
      blueprint.stage1.questions.forEach((q: any, idx: number) => {
         if (s1Answers[idx] === q.correctIndex) s1Score++;
      });
  }

  // Evaluate stages 2/3/4
  if (!process.env.GEMINI_API_KEY) return { error: "Gemini API missing." };
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const evalSchema: ResponseSchema = {
      type: SchemaType.OBJECT,
      properties: {
          logicScoreOutOf10: { type: SchemaType.INTEGER },
          applicationScoreOutOf10: { type: SchemaType.INTEGER },
          correctionScoreOutOf10: { type: SchemaType.INTEGER },
          tutorFeedbackSummary: { type: SchemaType.STRING, description: "2 sentences of feedback grading their freeform answers." },
          weakTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      },
      required: ["logicScoreOutOf10", "applicationScoreOutOf10", "correctionScoreOutOf10", "tutorFeedbackSummary", "weakTopics"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2, // Be precise when grading
      responseMimeType: "application/json",
      responseSchema: evalSchema,
    },
    systemInstruction: "You are an educational reviewer. Given the guided Mission questions, read the student's text answers. Give a fair numerical score for Reasoning (Stage 2), Application (Stage 3), and Accuracy (Stage 4). Identify weak topics and phrase feedback in a calm, tutor-supportive way."
  });

  try {
      const prompt = `MISSION BLUEPRINT: ${JSON.stringify({ s2: blueprint.stage2, s3: blueprint.stage3, s4: blueprint.stage4 })}
      
STUDENT ANSWERS:
Stage 2: ${s2Answer}
Stage 3: ${s3Answer}
Stage 4 Corrections: ${JSON.stringify(s4Answers)}`;

      const result = await model.generateContent(prompt);
      const evalData = JSON.parse(result.response.text());

      // Create an overall progress score out of 100.
      const totalPossible = (blueprint.stage1.questions.length * 10) + 30; // 10 pts per s1 question + 30 for text stages
      const achieved = (s1Score * 10) + evalData.logicScoreOutOf10 + evalData.applicationScoreOutOf10 + evalData.correctionScoreOutOf10;
      const percentage = Math.round((achieved / totalPossible) * 100);

      // Save to database for tutor review.
      const studentAnswersJson = { s1: s1Answers, s2: s2Answer, s3: s3Answer, s4: s4Answers };
      
      const { error: updateErr } = await supabase.from('student_missions').update({
          status: 'pending_tutor_approval',
          student_answers: studentAnswersJson,
          ai_evaluation: evalData,
          score_percentage: percentage,
          completed_at: new Date().toISOString()
      }).eq('id', missionId);

      if (updateErr) return { error: "Failed to save Mission progress." };

      return { success: true, score: percentage };

  } catch (error) {
      console.error(error);
      return { error: "The Mission review could not be completed." };
  }
}
