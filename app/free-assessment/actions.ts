"use server";

import { sendEmail } from "@/lib/email";
import { getMentorAttributionFromCookies, isAttributionSchemaError, markMentorLeadConverted } from "@/lib/mentor-attribution";
import { createAdminClient } from "@/utils/supabase/server";
import { buildEducationSelectionSnapshot, getEducationLabel } from "@/lib/educationTaxonomy";

export type AssessmentFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fallbackText?: string;
  mailtoHref?: string;
  whatsappHref?: string;
  summary?: {
    confidenceAreas: string[];
    supportAreas: string[];
    recommendedDirection: string;
    nextSteps: string[];
  };
};

const recipientEmail = process.env.ASSESSMENT_RECIPIENT_EMAIL || "hello@sciencedojo.co.uk";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildFallbackMessage(fields: Record<string, string>) {
  return [
    "Free assessment request",
    `Parent name: ${fields.parentName}`,
    `Email: ${fields.email}`,
    `WhatsApp: ${fields.whatsapp}`,
    `Student name: ${fields.studentName}`,
    `Student year/grade: ${fields.studentYear}`,
    `Curriculum pathway: ${fields.curriculum}`,
    `Stage or qualification: ${fields.stageLabel}`,
    `Exam board / awarding body: ${fields.boardLabel}`,
    `Subject help needed: ${fields.subject}`,
    `Topic: ${fields.topic}`,
    `Subtopic: ${fields.subtopic}`,
    `Weak topics: ${fields.weakTopics}`,
    `Target grade or goal: ${fields.targetGrade}`,
    `Upcoming exams: ${fields.upcomingExams}`,
    `What feels hardest: ${fields.hardestAreas}`,
    `Support needed now: ${fields.challenge}`,
    `Study habits and concerns: ${fields.studyConcerns}`,
    `Successful next few months: ${fields.goalsTimeline}`,
    `Preferred support style: ${fields.supportStyle}`,
    `Preferred assessment time: ${fields.preferredTime}`,
    `Message: ${fields.message}`,
  ].join("\n");
}

function buildStructuredLeadNotes(fields: Record<string, string>) {
  return [
    "Premium assessment intake profile",
    "",
    "Student Profile",
    `Student: ${fields.studentName || "Not specified"} (${fields.studentYear || "Not specified"})`,
    `Curriculum pathway: ${fields.curriculum || "Not specified"}`,
    `Stage or qualification: ${fields.stageLabel || "Not specified"}`,
    `Exam board / awarding body: ${fields.boardLabel || "Not applicable"}`,
    "",
    "Subject & Goals",
    `Subject: ${fields.subject || "Not specified"}`,
    `Topic: ${fields.topic || "Not specified"}`,
    `Subtopic: ${fields.subtopic || "Not specified"}`,
    `Weak topics: ${fields.weakTopics || "Not specified"}`,
    `Target grade or goal: ${fields.targetGrade || "Not specified"}`,
    `Upcoming exams: ${fields.upcomingExams || "Not specified"}`,
    "",
    "Confidence & Gaps",
    `What feels hardest: ${fields.hardestAreas || "Not specified"}`,
    `Support needed now: ${fields.challenge || "Not specified"}`,
    "",
    "Study Habits & Concerns",
    `Study habits and concerns: ${fields.studyConcerns || "Not specified"}`,
    "",
    "Support Style",
    `Preferred support style: ${fields.supportStyle || "Not specified"}`,
    `Successful next few months: ${fields.goalsTimeline || "Not specified"}`,
    "",
    "Contact & Assessment Time",
    `Preferred assessment time: ${fields.preferredTime || "Not specified"}`,
    "",
    "Optional final note",
    fields.message || "No extra message provided.",
  ].join("\n");
}

function buildAssessmentSummary(fields: Record<string, string>): AssessmentFormState["summary"] {
  const subject = fields.subject || "STEM";
  const curriculum = fields.curriculum || "curriculum";
  const focus = (fields.hardestAreas || fields.challenge || "confidence and understanding")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0] || "confidence and understanding";
  const supportAreas = [
    fields.subject,
    fields.hardestAreas,
    fields.studyConcerns,
    fields.supportStyle,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
    .slice(0, 5);

  return {
    confidenceAreas: [fields.hardestAreas, fields.challenge].filter(Boolean),
    supportAreas: supportAreas.length > 0 ? supportAreas : ["Confidence", "Structured practice", "Tutor guidance"],
    recommendedDirection: `Structured ${curriculum} ${subject} support focused on ${focus.toLowerCase()}.`,
    nextSteps: [
      "Review the intake before the assessment call",
      "Discuss confidence, subject gaps, and exam timeline",
      "Recommend a suitable tutor and learning support rhythm",
    ],
  };
}

export async function requestFreeAssessment(
  _previousState: AssessmentFormState,
  formData: FormData,
): Promise<AssessmentFormState> {
  const fields = {
    parentName: clean(formData.get("parentName")),
    email: clean(formData.get("email")),
    whatsapp: clean(formData.get("whatsapp")),
    studentName: clean(formData.get("studentName")),
    studentYear: clean(formData.get("studentYear")),
    curriculumKey: clean(formData.get("curriculumKey")),
    stage: clean(formData.get("stage")),
    awardingBodyKey: clean(formData.get("awardingBodyKey")),
    level: clean(formData.get("level")),
    subject: clean(formData.get("subject")),
    subjectVariant: clean(formData.get("subjectVariant")),
    specificationCode: clean(formData.get("specificationCode")),
    topic: clean(formData.get("topic")),
    subtopic: clean(formData.get("subtopic")),
    weakTopics: clean(formData.get("weakTopics")),
    targetGrade: clean(formData.get("targetGrade")),
    upcomingExams: clean(formData.get("upcomingExams")),
    hardestAreas: clean(formData.get("hardestAreas")),
    challenge: clean(formData.get("challenge")),
    studyConcerns: clean(formData.get("studyConcerns")),
    goalsTimeline: clean(formData.get("goalsTimeline")),
    supportStyle: clean(formData.get("supportStyle")),
    preferredTime: clean(formData.get("preferredTime")),
    message: clean(formData.get("message")),
  };

  const educationResult = buildEducationSelectionSnapshot({
    curriculumKey: fields.curriculumKey,
    stage: fields.stage,
    awardingBodyKey: fields.awardingBodyKey,
    level: fields.level,
    subject: fields.subject,
    subjectVariant: fields.subjectVariant,
    specificationCode: fields.specificationCode,
    topic: fields.topic,
    subtopic: fields.subtopic,
    assessmentDate: fields.upcomingExams,
  }, { topicRequired: true });
  if (!educationResult.snapshot) return { status: "error", message: educationResult.error || "Choose a valid education route." };

  const curriculum = getEducationLabel("curriculum", fields.curriculumKey);
  const stageLabel = getEducationLabel("stage", fields.stage, { curriculumKey: fields.curriculumKey });
  const boardLabel = fields.awardingBodyKey ? getEducationLabel("awardingBody", fields.awardingBodyKey) : "Not applicable";
  const displayFields: Record<string, string> = { ...fields, curriculum, stageLabel, boardLabel };

  const requiredFields = [
    fields.parentName,
    fields.email,
    fields.whatsapp,
    fields.studentName,
    fields.studentYear,
    fields.curriculumKey,
    fields.stage,
    fields.subject,
    fields.topic,
    fields.preferredTime,
  ];

  if (requiredFields.some((field) => !field)) {
    return {
      status: "error",
      message: "Please complete the required fields so we can recommend the right tutoring plan.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  const fallbackText = buildFallbackMessage(displayFields);
  const structuredLeadNotes = buildStructuredLeadNotes(displayFields);
  const assessmentSummary = buildAssessmentSummary(displayFields);
  const mailtoHref = `mailto:${recipientEmail}?subject=${encodeURIComponent("Free assessment request")}&body=${encodeURIComponent(fallbackText)}`;
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+94773850821").replace(/[^\d]/g, "");
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fallbackText)}` : undefined;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color: #0f172a;">
      <h1 style="color: #1E5AA8;">New Free Assessment Request</h1>
      <p>A parent has requested a free 30-minute ScienceDojo learning assessment.</p>
      <table style="width: 100%; border-collapse: collapse;">
        ${Object.entries({
          "Parent name": fields.parentName,
          Email: fields.email,
          "WhatsApp number": fields.whatsapp,
          "Student name": fields.studentName,
          "Student year/grade": fields.studentYear,
          "Curriculum pathway": curriculum,
          "Stage or qualification": stageLabel,
          "Exam board / awarding body": boardLabel,
          "Subject help needed": fields.subject,
          Topic: fields.topic,
          Subtopic: fields.subtopic || "Not specified.",
          "Weak topics": fields.weakTopics || "Not specified.",
          "Target grade or goal": fields.targetGrade || "Not specified.",
          "Upcoming exams": fields.upcomingExams || "Not specified.",
          "What feels hardest": fields.hardestAreas || "Not specified.",
          "Support needed now": fields.challenge || "Not specified.",
          "Study habits and concerns": fields.studyConcerns || "Not specified.",
          "Successful next few months": fields.goalsTimeline || "Not specified.",
          "Preferred support style": fields.supportStyle || "Not specified.",
          "Preferred assessment time": fields.preferredTime,
          Message: fields.message || "No extra message provided.",
        })
          .map(
            ([label, value]) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 700; background: #f8fafc;">${escapeHtml(label)}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${escapeHtml(value)}</td>
              </tr>
            `,
          )
          .join("")}
      </table>
    </div>
  `;

  // TODO: Track an analytics conversion event here after server-side analytics is configured.
  try {
    const adminClient = await createAdminClient();
    const attribution = await getMentorAttributionFromCookies();
    const leadPayload = {
      parent_name: fields.parentName,
      email: fields.email.toLowerCase(),
      whatsapp_number: fields.whatsapp,
      student_name: fields.studentName,
      student_grade: fields.studentYear,
      curriculum,
      subject_needed: fields.subject,
      learning_context: educationResult.snapshot,
      main_challenge: fields.challenge || fields.hardestAreas || "Assessment intake completed",
      preferred_time: fields.preferredTime,
      message: structuredLeadNotes,
      status: "new_inquiry",
      source: attribution.acquisitionSource === "mentor_profile" ? "mentor_profile_learning_check" : "free_assessment_page",
      acquisition_source: attribution.acquisitionSource,
      referrer_tutor_id: attribution.referrerTutorId,
      landing_tutor_id: attribution.landingTutorId,
      lead_source_id: attribution.leadSourceId,
    };

    let { data: insertedLead, error: leadError } = await adminClient
      .from("assessment_leads")
      .insert(leadPayload)
      .select("id")
      .single();

    if (leadError && isAttributionSchemaError(leadError)) {
      const {
        acquisition_source: _acquisitionSource,
        referrer_tutor_id: _referrerTutorId,
        landing_tutor_id: _landingTutorId,
        lead_source_id: _leadSourceId,
        ...baseLeadPayload
      } = leadPayload;
      void _acquisitionSource;
      void _referrerTutorId;
      void _landingTutorId;
      void _leadSourceId;

      const fallbackResult = await adminClient
        .from("assessment_leads")
        .insert(baseLeadPayload)
        .select("id")
        .single();

      insertedLead = fallbackResult.data;
      leadError = fallbackResult.error;
    }

    if (leadError) {
      console.error("Assessment lead insert error:", leadError.message);
      return {
        status: "error",
        message: "We could not save your request automatically. Please use one of the fallback contact options below.",
        fallbackText,
        mailtoHref,
        whatsappHref,
      };
    }

    await markMentorLeadConverted({
      assessmentId: insertedLead?.id || null,
    });

  } catch (error) {
    console.error("Assessment lead storage failed:", error);
    return {
      status: "error",
      message: "We could not save your request automatically. Please use one of the fallback contact options below.",
      fallbackText,
      mailtoHref,
      whatsappHref,
    };
  }

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Free assessment request from ${fields.parentName}`,
    html,
  });

  if (!result.success) {
    return {
      status: "success",
      message: "Thank you. ScienceDojo received your request. The email notification did not send, but your lead was saved for follow-up.",
      fallbackText,
      mailtoHref,
      whatsappHref,
      summary: assessmentSummary,
    };
  }

  return {
    status: "success",
    message: "Thank you. Your assessment intake has been received. We will review it before the call so the conversation can focus on the right support for your child.",
    fallbackText,
    mailtoHref,
    whatsappHref,
    summary: assessmentSummary,
  };
}
