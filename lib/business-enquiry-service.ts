import {
  buildBusinessEnquiryNotification,
  isSubmissionToken,
  validateBusinessEnquiry,
  type BusinessEnquiryState,
  type BusinessEnquiryValues,
} from "./business-enquiry-validation.ts";

export type EnquiryReceipt = { id: string | null; outcome: "saved" | "duplicate" | "conflict" | "limited" };
export type EnquirySubmissionDependencies = {
  generateToken(): string;
  persist(id: string, values: BusinessEnquiryValues): Promise<EnquiryReceipt>;
  notify(id: string): Promise<unknown>;
};

export async function handleBusinessEnquirySubmission(
  formData: FormData,
  dependencies: EnquirySubmissionDependencies,
): Promise<BusinessEnquiryState> {
  const validation = validateBusinessEnquiry(formData);
  const tokens = formData.getAll("submissionToken");
  const candidate = tokens.length === 1 && typeof tokens[0] === "string" ? tokens[0].trim() : "";
  const submissionToken = isSubmissionToken(candidate) ? candidate : dependencies.generateToken();
  const state: BusinessEnquiryState = {
    status: "error", message: "Please check the highlighted fields.",
    fieldErrors: validation.fieldErrors, values: validation.values, submissionToken,
  };
  if (!validation.valid) {
    if (validation.blocked) state.message = "We could not accept this enquiry. Please email hello@sciencedojo.co.uk instead.";
    return state;
  }
  if (tokens.length > 1 || (tokens.length === 1 && typeof tokens[0] !== "string") || (candidate && !isSubmissionToken(candidate))) {
    return { ...state, message: "Please submit the form again, or email hello@sciencedojo.co.uk." };
  }
  let receipt: EnquiryReceipt;
  try {
    receipt = await dependencies.persist(submissionToken, validation.values);
  } catch {
    return { ...state, message: "We could not record your enquiry. Your details are still here. Please try again or email hello@sciencedojo.co.uk." };
  }
  if (receipt.outcome === "limited") {
    return { ...state, message: "Too many enquiries have been submitted recently. Please wait 10 minutes or email hello@sciencedojo.co.uk." };
  }
  if (receipt.outcome === "conflict" || !receipt.id) {
    return { ...state, submissionToken: dependencies.generateToken(), message: "This form was already used for another enquiry. Please review your details and submit again." };
  }
  // Notification delivery is separate from confirmed database receipt. A failed send stays retryable.
  try { await dependencies.notify(receipt.id); } catch { /* The durable queue will retry. */ }
  return {
    ...state, status: "success", fieldErrors: {},
    message: "Your enquiry has been recorded. Piumal will review it and reply by email.",
  };
}

export type ClaimedBusinessEnquiry = BusinessEnquiryValues & {
  id: string;
  notification_lease_token: string;
  notification_attempts: number;
};
export type NotificationResult = { accepted: true; messageId: string } | { accepted: false; errorCode: string };

export async function deliverBusinessEnquiryWithDeadline(
  send: (signal: AbortSignal) => Promise<NotificationResult>,
  timeoutMs = 8000,
): Promise<NotificationResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await send(controller.signal);
    if (controller.signal.aborted && !result.accepted) return { accepted: false, errorCode: "provider-timeout" };
    return result;
  } catch {
    return { accepted: false, errorCode: controller.signal.aborted ? "provider-timeout" : "provider-error" };
  } finally {
    clearTimeout(timer);
  }
}

export type BusinessEnquiryNotificationMessage = {
  subject: string;
  html: string;
  replyTo: string;
  idempotencyKey: string;
};
export type BusinessEnquiryNotificationDependencies = {
  claim(id?: string): Promise<ClaimedBusinessEnquiry[]>;
  send(record: ClaimedBusinessEnquiry, message: BusinessEnquiryNotificationMessage): Promise<NotificationResult>;
  finish(record: ClaimedBusinessEnquiry, result: NotificationResult): Promise<boolean>;
};

export async function processBusinessEnquiryNotifications(
  dependencies: BusinessEnquiryNotificationDependencies,
  id?: string,
) {
  const records = await dependencies.claim(id);
  const summary = { claimed: records.length, accepted: 0, retryQueued: 0, exhausted: 0, unresolved: 0 };
  for (const record of records) {
    let result: NotificationResult;
    try {
      result = await dependencies.send(record, {
        ...buildBusinessEnquiryNotification(record.id, record),
        replyTo: record.email,
        idempotencyKey: `business-enquiry/${record.id}`,
      });
      if (result.accepted && !result.messageId?.trim()) result = { accepted: false, errorCode: "provider-error" };
    } catch {
      result = { accepted: false, errorCode: "provider-error" };
    }
    try {
      const updated = await dependencies.finish(record, result);
      if (!updated) summary.unresolved++;
      else if (result.accepted) summary.accepted++;
      else if (record.notification_attempts >= 5) summary.exhausted++;
      else summary.retryQueued++;
    } catch {
      // Leave the lease untouched; a future worker can recover it with the same provider key.
      summary.unresolved++;
    }
  }
  return summary;
}
