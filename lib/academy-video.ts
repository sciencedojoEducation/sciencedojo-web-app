export type AcademyVideoScene = { startSeconds?: number; endSeconds?: number };

export function isAcademyDwVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "hlsvod.dw.com" &&
      /^\/i\/(?:Events\/mp4\/nicosweg|dwtv_video\/flv\/nicosweg)\/.+\/master\.m3u8$/.test(url.pathname);
  } catch { return false; }
}

export function academyVideoSceneError(scene: AcademyVideoScene): string | null {
  const { startSeconds, endSeconds } = scene;
  if (startSeconds !== undefined && (!Number.isSafeInteger(startSeconds) || startSeconds < 0))
    return "Scene start must be a non-negative whole number of seconds.";
  if (endSeconds !== undefined && (!Number.isSafeInteger(endSeconds) || endSeconds <= (startSeconds ?? 0)))
    return "Scene end must be a whole number of seconds after the scene start.";
  return null;
}

function timestamp(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return match && match.slice(1).some(Boolean)
    ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
    : undefined;
}

export function academyVideoEmbedUrl(value: string, scene: AcademyVideoScene = {}): string | null {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "");
    if (["youtube.com", "youtu.be"].includes(host)) {
      const id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      const boundaries = {
        startSeconds: scene.startSeconds ?? timestamp(url.searchParams.get("start") || url.searchParams.get("t")),
        endSeconds: scene.endSeconds ?? timestamp(url.searchParams.get("end")),
      };
      if (academyVideoSceneError(boundaries)) return null;
      const embed = new URL(`https://www.youtube.com/embed/${id}`);
      embed.searchParams.set("playsinline", "1");
      if (boundaries.startSeconds !== undefined) embed.searchParams.set("start", String(boundaries.startSeconds));
      if (boundaries.endSeconds !== undefined) embed.searchParams.set("end", String(boundaries.endSeconds));
      return embed.toString();
    }
    if (["vimeo.com", "player.vimeo.com"].includes(host)) {
      // Scene endpoints are supported by the YouTube player only.
      if (scene.startSeconds !== undefined || scene.endSeconds !== undefined) return null;
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { return null; }
  return null;
}
