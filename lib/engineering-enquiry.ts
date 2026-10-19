import { engineeringInterests, type EngineeringInterest } from "./engineering-demo.ts";
import { handleBusinessEnquirySubmission, type EnquirySubmissionDependencies } from "./business-enquiry-service.ts";
import { isSubmissionToken, validateBusinessEnquiry, type BusinessEnquiryState } from "./business-enquiry-validation.ts";

export const ENGINEERING_DESCRIPTION_LIMIT = 2800;
export type EngineeringEnquiryState = BusinessEnquiryState & { interestError?: string };

export async function handleEngineeringEnquirySubmission(
  form: FormData, dependencies: EnquirySubmissionDependencies,
): Promise<EngineeringEnquiryState> {
  const validation = validateBusinessEnquiry(form);
  const interests = form.getAll("interest");
  const selected = interests.length === 0 ? "unsure" : interests[0];
  const validInterest = interests.length <= 1 && typeof selected === "string" && Object.hasOwn(engineeringInterests, selected);
  const fieldErrors = { ...validation.fieldErrors };
  if (!validation.values.goal) fieldErrors.goal = "Describe the task or application you want to improve.";
  if (typeof form.get("goal") === "string" && String(form.get("goal")).replace(/\r\n?/g, "\n").trim().length > ENGINEERING_DESCRIPTION_LIMIT) {
    fieldErrors.goal = `Use ${ENGINEERING_DESCRIPTION_LIMIT} characters or fewer.`;
  }
  if (!validation.valid || !validInterest || Object.keys(fieldErrors).length) {
    const token = form.getAll("submissionToken");
    return {
      status: "error", message: validation.blocked ? "We could not accept this enquiry. Please email hello@sciencedojo.co.uk instead." : "Please check the highlighted fields.",
      values: { ...validation.values, goal: validation.values.goal.slice(0, ENGINEERING_DESCRIPTION_LIMIT) }, fieldErrors,
      submissionToken: token.length === 1 && typeof token[0] === "string" && isSubmissionToken(token[0].trim()) ? token[0].trim() : dependencies.generateToken(),
      interestError: validInterest ? undefined : "Choose one of the listed interests.",
    };
  }
  // Retain token and honeypot multiplicity; the shared service still validates them.
  const prepared = new FormData();
  for (const [key, value] of form.entries()) prepared.append(key, value);
  const interest = selected as EngineeringInterest;
  prepared.set("goal", `Service: Software & Product Engineering\nInterest: ${engineeringInterests[interest]}\n\n${validation.values.goal}`);
  const state = await handleBusinessEnquirySubmission(prepared, dependencies);
  // Browser recovery receives the visitor's description, never our storage prefix.
  return { ...state, values: validation.values };
}
