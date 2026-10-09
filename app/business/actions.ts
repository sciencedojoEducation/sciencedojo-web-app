"use server";

import { headers } from "next/headers";
import { submitBusinessEnquiryRecord } from "@/lib/business-enquiries";
import type { BusinessEnquiryState } from "@/lib/business-enquiry-validation";

export async function submitBusinessEnquiry(
  _previousState: BusinessEnquiryState,
  formData: FormData,
): Promise<BusinessEnquiryState> {
  return submitBusinessEnquiryRecord(formData, await headers());
}
