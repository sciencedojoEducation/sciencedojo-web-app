"use server";

import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/utils/supabase/server";

export type AssessmentFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fallbackText?: string;
  mailtoHref?: string;
  whatsappHref?: string;
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
    `Curriculum: ${fields.curriculum}`,
    `Subject help needed: ${fields.subject}`,
    `Main learning challenge: ${fields.challenge}`,
    `Preferred lesson time: ${fields.preferredTime}`,
    `Message: ${fields.message}`,
  ].join("\n");
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
    curriculum: clean(formData.get("curriculum")),
    subject: clean(formData.get("subject")),
    challenge: clean(formData.get("challenge")),
    preferredTime: clean(formData.get("preferredTime")),
    message: clean(formData.get("message")),
  };

  const requiredFields = [
    fields.parentName,
    fields.email,
    fields.whatsapp,
    fields.studentName,
    fields.studentYear,
    fields.curriculum,
    fields.subject,
    fields.challenge,
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

  const fallbackText = buildFallbackMessage(fields);
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
          Curriculum: fields.curriculum,
          "Subject help needed": fields.subject,
          "Main learning challenge": fields.challenge,
          "Preferred lesson time": fields.preferredTime,
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
  let leadId: string | null = null;

  try {
    const adminClient = await createAdminClient();
    const { data: lead, error: leadError } = await adminClient
      .from("assessment_leads")
      .insert({
        parent_name: fields.parentName,
        email: fields.email.toLowerCase(),
        whatsapp_number: fields.whatsapp,
        student_name: fields.studentName,
        student_grade: fields.studentYear,
        curriculum: fields.curriculum,
        subject_needed: fields.subject,
        main_challenge: fields.challenge,
        preferred_time: fields.preferredTime,
        message: fields.message || null,
        status: "new",
        source: "free_assessment_page",
      })
      .select("id")
      .single();

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

    leadId = lead?.id || null;
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
    };
  }

  return {
    status: "success",
    message: `Thank you. Your free assessment request has been saved${leadId ? ` as lead ${leadId.slice(0, 8)}` : ""} and sent to ScienceDojo.`,
    fallbackText,
    mailtoHref,
    whatsappHref,
  };
}
