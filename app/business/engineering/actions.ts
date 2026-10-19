"use server";

import { headers } from "next/headers";
import { submitEngineeringEnquiryRecord } from "@/lib/business-enquiries";
import type { EngineeringEnquiryState } from "@/lib/engineering-enquiry";

export async function submitEngineeringEnquiry(_previous: EngineeringEnquiryState, form: FormData): Promise<EngineeringEnquiryState> {
  return submitEngineeringEnquiryRecord(form, await headers());
}
