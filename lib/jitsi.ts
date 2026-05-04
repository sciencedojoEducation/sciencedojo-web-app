const DEFAULT_JITSI_DOMAIN = "meet.jit.si";

export interface JitsiRoomDetails {
  roomName: string;
  roomUrl: string;
}

function sanitizeSessionId(sessionId: string) {
  return sessionId
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "session";
}

export function getJitsiDomain() {
  return process.env.NEXT_PUBLIC_JITSI_DOMAIN || DEFAULT_JITSI_DOMAIN;
}

export function createJitsiRoomUrl(sessionId: string): JitsiRoomDetails {
  const safeSessionId = sanitizeSessionId(sessionId);
  const randomString = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const roomName = `sciencedojo-${safeSessionId}-${randomString}`;
  const roomUrl = `https://${getJitsiDomain()}/${roomName}`;

  return {
    roomName,
    roomUrl,
  };
}

export function getJitsiRoomNameFromUrl(roomUrl: string) {
  try {
    const url = new URL(roomUrl);
    return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    return roomUrl.replace(/^https?:\/\/[^/]+\//, "").split(/[?#]/)[0];
  }
}
