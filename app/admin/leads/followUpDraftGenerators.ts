export type AssessmentLeadForFollowUp = {
  parent_name?: string | null;
  student_name?: string | null;
  curriculum?: string | null;
  subject_needed?: string | null;
  main_challenge?: string | null;
  preferred_time?: string | null;
  message?: string | null;
};

export type WhatsAppFollowUpDraft = {
  message: string;
};

export type EmailFollowUpDraft = {
  subject: string;
  body: string;
};

function clean(value?: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed && trimmed !== "Not specified" ? trimmed : "";
}

export function getLeadNoteValue(message: string | null | undefined, label: string) {
  if (!message) return "";
  const line = message
    .split("\n")
    .find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return clean(line?.split(":").slice(1).join(":"));
}

function getLeadContext(lead: AssessmentLeadForFollowUp) {
  const parentName = clean(lead.parent_name);
  const studentName = clean(lead.student_name) || "your child";
  const subject = clean(lead.subject_needed);
  const curriculum = clean(lead.curriculum);
  const subjectContext = [subject, curriculum].filter(Boolean).join(" / ") || "their learning";
  const hardestRightNow = getLeadNoteValue(lead.message, "What feels hardest") || clean(lead.main_challenge);
  const studyConcerns = getLeadNoteValue(lead.message, "Study habits and concerns");
  const weakTopics = getLeadNoteValue(lead.message, "Weak topics");
  const upcomingExams = getLeadNoteValue(lead.message, "Upcoming exams");
  const goal = getLeadNoteValue(lead.message, "Successful next few months")
    || getLeadNoteValue(lead.message, "Target grade or goal")
    || upcomingExams
    || "their next learning goals";
  const preferredSupport = getLeadNoteValue(lead.message, "Preferred support style");
  const preferredTime = clean(lead.preferred_time);
  const priority = hardestRightNow || weakTopics || studyConcerns || "building confidence and a clearer study structure";
  const timeQuestion = preferredTime
    ? `Would ${preferredTime} still work for you?`
    : "What time would work best for a short free learning assessment?";

  return {
    greeting: parentName ? `Hi ${parentName},` : "Hi,",
    studentName,
    subjectContext,
    priority,
    goal,
    preferredSupport,
    timeQuestion,
  };
}

export function generateWhatsAppFollowUp(lead: AssessmentLeadForFollowUp): WhatsAppFollowUpDraft {
  const context = getLeadContext(lead);

  return {
    message: [
      `${context.greeting} thank you for completing the ScienceDojo learning assessment form.`,
      "",
      `I had a look at ${context.studentName}'s details, especially around ${context.subjectContext} and the concern about ${context.priority}.`,
      "",
      `It sounds like the main priority is to help ${context.studentName} build clearer understanding, reduce stress, and create a structured plan for ${context.goal}.`,
      "",
      "The next best step is a short free learning assessment where we can identify the key gaps and recommend the right support pathway.",
      "",
      context.timeQuestion,
    ].join("\n"),
  };
}

export function generateEmailFollowUp(lead: AssessmentLeadForFollowUp): EmailFollowUpDraft {
  const context = getLeadContext(lead);
  const studentPossessive = context.studentName === "your child" ? "your child's" : `${context.studentName}'s`;
  const supportDetail = context.preferredSupport
    ? ` I also noticed the preferred support style: ${context.preferredSupport.toLowerCase()}.`
    : "";

  return {
    subject: `Next steps for ${studentPossessive} ScienceDojo assessment`,
    body: [
      context.greeting,
      "",
      "Thank you for completing the ScienceDojo learning assessment form.",
      "",
      `I've reviewed the details you shared about ${context.studentName}, especially around ${context.subjectContext} and ${context.priority}.${supportDetail}`,
      "",
      `From what you shared, it sounds like the main priority is to help ${context.studentName} build clearer understanding, reduce stress, and create a more structured path toward ${context.goal}.`,
      "",
      "The next step is a short free learning assessment. In this session, we can:",
      "",
      "- identify the key learning gaps",
      "- understand what is affecting confidence",
      "- recommend the most suitable support pathway",
      "- explain how ScienceDojo tutoring, PracticeDojo, and personalized Missions can support progress",
      "",
      context.timeQuestion,
      "",
      "Kind regards,",
      "ScienceDojo",
    ].join("\n"),
  };
}
