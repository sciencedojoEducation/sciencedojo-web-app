import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

export async function resolveGermanA2Images(db, course) {
  const refs = new Map();
  if (course.heroImage?.startsWith("/images/academy/german-a2/")) refs.set(course.heroImage, "Erwachsene treffen sich mit Notizbuch auf einem Stadtplatz.");
  for (const lesson of course.lessons) for (const block of lesson.blocks)
    if (block.type === "image" && block.src.startsWith("/images/academy/german-a2/")) refs.set(block.src, block.alt);
  const mapped = new Map();
  for (const [url, alt] of refs) {
    const bytes = readFileSync(resolve(import.meta.dirname, "..", "public", url.slice(1)));
    if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP")
      throw new Error(`Invalid WebP image: ${url}`);
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const storagePath = `courses/${course.key}/images/${digest}/${basename(url)}`;
    const { data: asset, error } = await db.from("academy_assets").select("public_url").eq("storage_path", storagePath).maybeSingle();
    if (error) throw error;
    let publicUrl = asset?.public_url;
    if (!publicUrl) {
      const { error: uploadError } = await db.storage.from("academy-media").upload(storagePath, bytes, { contentType: "image/webp", upsert: false });
      if (uploadError && String(uploadError.statusCode) !== "409") throw uploadError;
      publicUrl = db.storage.from("academy-media").getPublicUrl(storagePath).data.publicUrl;
      const { error: registerError } = await db.from("academy_assets").upsert({
        storage_path: storagePath, public_url: publicUrl, media_type: "image",
        mime_type: "image/webp", original_name: basename(url), byte_size: bytes.length, alt_text: alt,
      }, { onConflict: "storage_path" });
      if (registerError) throw registerError;
    }
    mapped.set(url, publicUrl);
  }
  course.heroImage = mapped.get(course.heroImage) || course.heroImage;
  for (const lesson of course.lessons) for (const block of lesson.blocks)
    if (block.type === "image") block.src = mapped.get(block.src) || block.src;
  return mapped.size;
}
