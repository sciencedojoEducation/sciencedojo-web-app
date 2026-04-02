"use server";

import { createClient } from "@supabase/supabase-js"; // Using a direct client for service role access
import { KJUR } from "jsrsasign";

/**
 * Generates a signature for the Zoom Meeting SDK.
 * This is done on the server using the Service Role to keep the SDK Secret secure.
 */
export async function generateZoomSignature(meetingNumber: string, role: number) {
  // Use Service Role to get keys (these are sensitive and not readable by normal users)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // 1. Fetch SDK Key and Secret from DB
  const { data: zoomConfig } = await supabaseAdmin
    .from("platform_integrations")
    .select("key_4, key_5, is_active")
    .eq("provider", "zoom")
    .single();

  if (!zoomConfig || !zoomConfig.is_active || !zoomConfig.key_4 || !zoomConfig.key_5) {
    throw new Error("Zoom Meeting SDK is not configured or active.");
  }

  const sdkKey = zoomConfig.key_4;
  const sdkSecret = zoomConfig.key_5;

  // 2. Generate JWT Signature
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hour expiration

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sdkKey: sdkKey,
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp,
  };

  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(payload);
  
  // Using jsrsasign to create the JWT
  // Note: In a production environment, you might prefer 'jsonwebtoken' package if accessible.
  const sdkSignature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);

  return {
    signature: sdkSignature,
    sdkKey: sdkKey
  };
}
