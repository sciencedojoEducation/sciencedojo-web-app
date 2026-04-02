"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a secure, short-lived room on Daily.co for a ScienceDojo session.
 */
export async function createDailyRoom(bookingId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Daily.co credentials from the vault
  const { data: config } = await supabaseAdmin
    .from("platform_integrations")
    .select("key_1, key_2, is_active")
    .eq("provider", "daily")
    .single();

  if (!config || !config.is_active || !config.key_1) {
    throw new Error("Daily.co integration is not configured or active.");
  }

  const apiKey = config.key_1;
  const domain = config.key_2 || "sciencedojo.daily.co";

  // 2. Generate Deterministic room name (Stable for both participants) 🛡️
  const roomName = `sd-${bookingId}`.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 60);

  try {
    // 3. Attempt Room Creation via Daily REST API
    const exp = Math.floor(Date.now() / 1000) + 7200; 

    let response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: true,
          enable_hand_raising: true, // ScienceDojo Interactivity Pulse 🧬
          exp: exp,
          max_participants: 10,
          lang: "en"
        }
      })
    });

    let roomData;
    if (response.status === 400) {
      // Room already exists, update its properties to ensure hand-raising is enabled 🕵️‍♂️
      console.log(`[Daily.co] Room ${roomName} exists. Synchronizing interactive properties... 🧬`);
      
      const updateRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          properties: {
            enable_hand_raising: true,
            enable_chat: true,
            enable_screenshare: true,
            enable_knocking: true,
            exp: exp
          }
        })
      });

      if (updateRes.ok) {
        roomData = await updateRes.json();
      } else {
        const checkRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
        if (checkRes.ok) {
          roomData = await checkRes.json();
        } else {
          const errorData = await response.json();
          throw new Error(`Daily.co Room Conflict: ${errorData.error || response.statusText}`);
        }
      }
    } else if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Daily.co Room Creation Failed: ${errorData.error || response.statusText}`);
    } else {
      roomData = await response.json();
      console.log(`[Daily.co] Room Created/Verified: ${roomData.url}`);
    }
    
    return {
      url: roomData.url,
      name: roomData.name,
      domain: domain
    };

  } catch (err: any) {
    console.error("[Daily.co] Critical failure in room factory:", err.message);
    throw err;
  }
}
