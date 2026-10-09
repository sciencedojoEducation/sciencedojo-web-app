import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import { getEmailProviderStatus, sendEmail } from "@/lib/email";
import {
  handleBusinessEnquirySubmission,
  deliverBusinessEnquiryWithDeadline,
  processBusinessEnquiryNotifications,
  type ClaimedBusinessEnquiry,
  type EnquiryReceipt,
  type NotificationResult,
} from "./business-enquiry-service";
import { isBusinessEmail, type BusinessEnquiryValues } from "./business-enquiry-validation";
import { businessEnquiryHash, getBusinessEnquiryRequestIp } from "./business-enquiry-security";

type RequestHeaders = { get(name: string): string | null };

export async function submitBusinessEnquiryRecord(formData: FormData, requestHeaders: RequestHeaders) {
  return handleBusinessEnquirySubmission(formData, {
    generateToken: randomUUID,
    async persist(id, values) {
      // A dedicated key is preferable; the existing private service key is a strong server-only fallback.
      const secret = process.env.BUSINESS_ENQUIRY_RATE_LIMIT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!secret || secret.trim().length < 32) throw new Error("Business enquiry rate limits are not configured.");
      const ip = getBusinessEnquiryRequestIp(requestHeaders);
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("receive_business_enquiry", {
        p_id: id, p_name: values.name, p_email: values.email, p_organisation: values.organisation,
        p_goal: values.goal, p_timing: values.timing,
        p_ip_hash: businessEnquiryHash(secret, "ip", ip),
        p_email_hash: businessEnquiryHash(secret, "email", values.email),
        p_payload_hash: businessEnquiryHash(secret, "payload", JSON.stringify(values)),
      });
      if (error || !Array.isArray(data) || data.length !== 1) throw new Error("Business enquiry storage failed.");
      const receipt = data[0] as { enquiry_id: string | null; outcome: string };
      if (!["saved", "duplicate", "conflict", "limited"].includes(receipt.outcome)) throw new Error("Invalid business enquiry receipt.");
      return { id: receipt.enquiry_id, outcome: receipt.outcome } as EnquiryReceipt;
    },
    notify: runBusinessEnquiryNotifications,
  });
}

function isClaimedRecord(value: unknown): value is ClaimedBusinessEnquiry {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ClaimedBusinessEnquiry>;
  return typeof record.id === "string" && typeof record.notification_lease_token === "string"
    && typeof record.notification_attempts === "number"
    && (["name", "email", "organisation", "goal", "timing"] as (keyof BusinessEnquiryValues)[]).every((key) => typeof record[key] === "string");
}

export async function runBusinessEnquiryNotifications(id?: string) {
  const admin = createAdminClient();
  return processBusinessEnquiryNotifications({
    async claim(targetId) {
      const { data, error } = await admin.rpc("claim_business_enquiry_notifications", {
        p_enquiry_id: targetId || null, p_limit: targetId ? 1 : 5,
      });
      if (error || !Array.isArray(data) || !data.every(isClaimedRecord)) throw new Error("Business notification queue unavailable.");
      return data as ClaimedBusinessEnquiry[];
    },
    async send(record, message): Promise<NotificationResult> {
      const recipient = (process.env.BUSINESS_ENQUIRY_RECIPIENT_EMAIL || "hello@sciencedojo.co.uk").trim();
      if (!isBusinessEmail(recipient)) return { accepted: false, errorCode: "invalid-recipient" };
      if (!isBusinessEmail(record.email)) return { accepted: false, errorCode: "invalid-record" };
      // Mock success must never mark a real enquiry as delivered or expose its content in logs.
      if (!getEmailProviderStatus().configured) return { accepted: false, errorCode: "provider-unconfigured" };
      return deliverBusinessEnquiryWithDeadline(async (signal) => {
        const result = await sendEmail({
          to: recipient, replyTo: message.replyTo, subject: message.subject, html: message.html,
          idempotencyKey: message.idempotencyKey, signal,
        });
        if (!result.success || result.mock) return { accepted: false, errorCode: "provider-error" };
        const messageId = result.data.data?.id;
        return messageId ? { accepted: true, messageId } : { accepted: false, errorCode: "provider-error" };
      });
    },
    async finish(record, result) {
      const { data, error } = await admin.rpc("finish_business_enquiry_notification", {
        p_id: record.id, p_lease_token: record.notification_lease_token, p_success: result.accepted,
        p_provider_message_id: result.accepted ? result.messageId : null,
        p_error_code: result.accepted ? null : result.errorCode,
      });
      if (error) throw new Error("Business notification state could not be recorded.");
      return data === true;
    },
  }, id);
}
