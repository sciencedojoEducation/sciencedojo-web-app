export const BUSINESS_ENQUIRY_LIMITS = {
  name: 100,
  email: 254,
  organisation: 160,
  goal: 3000,
  timing: 160,
} as const;

export type BusinessEnquiryValues = Record<keyof typeof BUSINESS_ENQUIRY_LIMITS, string>;
export type BusinessEnquiryFieldErrors = Partial<Record<keyof BusinessEnquiryValues, string>>;
export type BusinessEnquiryState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: BusinessEnquiryFieldErrors;
  values: BusinessEnquiryValues;
  submissionToken: string;
};

export const EMPTY_BUSINESS_ENQUIRY_STATE: BusinessEnquiryState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: { name: "", email: "", organisation: "", goal: "", timing: "" },
  submissionToken: "",
};

export function isSubmissionToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isBusinessEmail(value: string) {
  // A practical mailbox format: no header injection, quoted local parts, or local-only domains.
  if (value.length > BUSINESS_ENQUIRY_LIMITS.email || /[\s\x00-\x1f\x7f]/.test(value)) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || !/^[a-z0-9.!#$%&'*+\-/=?^_`{|}~]+$/i.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every((label) =>
    label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
  ) && /^[a-z]{2,63}$/i.test(labels.at(-1) || "");
}

export function validateBusinessEnquiry(formData: FormData) {
  const values = { ...EMPTY_BUSINESS_ENQUIRY_STATE.values };
  const fieldErrors: BusinessEnquiryFieldErrors = {};
  const labels: Record<keyof BusinessEnquiryValues, string> = {
    name: "your name", email: "your email", organisation: "your organisation",
    goal: "what your people should be able to do", timing: "your timing",
  };
  for (const field of Object.keys(BUSINESS_ENQUIRY_LIMITS) as (keyof BusinessEnquiryValues)[]) {
    const entries = formData.getAll(field);
    const raw = entries.length === 1 && typeof entries[0] === "string" ? entries[0] : "";
    const normalized = raw.replace(/\r\n?/g, "\n").trim();
    // Retain bounded values when returning errors, including direct calls that bypass HTML attributes.
    values[field] = normalized.slice(0, BUSINESS_ENQUIRY_LIMITS[field]);
    if (entries.length !== 1 || typeof entries[0] !== "string") {
      if (field !== "timing" || entries.length > 0) fieldErrors[field] = `Enter ${labels[field]}.`;
    } else if (!normalized && field !== "timing") {
      fieldErrors[field] = `Enter ${labels[field]}.`;
    } else if (normalized.length > BUSINESS_ENQUIRY_LIMITS[field]) {
      fieldErrors[field] = `Use ${BUSINESS_ENQUIRY_LIMITS[field]} characters or fewer.`;
    } else if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(normalized) || (field !== "goal" && /[\n\t]/.test(normalized))) {
      fieldErrors[field] = `Check ${labels[field]} for unsupported characters.`;
    }
  }
  values.email = values.email.toLowerCase();
  if (!fieldErrors.email && !isBusinessEmail(values.email)) {
    fieldErrors.email = "Enter a valid email address, such as name@company.com.";
  }
  const honeypot = formData.getAll("website");
  const blocked = honeypot.length > 1 || honeypot.some((value) => typeof value !== "string" || value.trim() !== "");
  return { values, fieldErrors, blocked, valid: !blocked && Object.keys(fieldErrors).length === 0 };
}

export function escapeBusinessEnquiryHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function buildBusinessEnquiryNotification(id: string, values: BusinessEnquiryValues) {
  const safe = Object.fromEntries((Object.keys(BUSINESS_ENQUIRY_LIMITS) as (keyof BusinessEnquiryValues)[])
    .map((key) => [key, escapeBusinessEnquiryHtml(values[key])]));
  return {
    subject: "ScienceDojo for Business: new pilot enquiry",
    html: `<div style="font-family:Arial,sans-serif;color:#12243A;max-width:640px"><h1>New pilot enquiry</h1><p>Reference: ${escapeBusinessEnquiryHtml(id)}</p><dl><dt>Name</dt><dd>${safe.name}</dd><dt>Email</dt><dd>${safe.email}</dd><dt>Organisation</dt><dd>${safe.organisation}</dd><dt>What should their people be able to do?</dt><dd style="white-space:pre-wrap">${safe.goal}</dd><dt>Timing</dt><dd>${safe.timing || "Not specified"}</dd></dl><p>Reply to this message to contact the prospect.</p></div>`,
  };
}
