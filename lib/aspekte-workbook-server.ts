import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { studyPage, type WorkbookManifest, type WorkbookPage } from "./aspekte-workbook";
import { workbookFeatureEnabled } from "./workbook-access";
import { createAdminClient } from "@/utils/supabase/admin";

export const workbookRoot = join(process.cwd(), "private-materials/aspekte-neu-b2/derived");
export const workbookEnabled = workbookFeatureEnabled;
export const workbookCloudStorage = () => process.env.WORKBOOK_STORAGE === "supabase" || process.env.NODE_ENV === "production";
const contentCache = new Map<string, { expires: number; data: string }>();
async function sourceJson(path: string) {
  if (!workbookCloudStorage()) return JSON.parse(await readFile(join(workbookRoot, path), "utf8"));
  const cached = contentCache.get(path);
  if (cached && cached.expires > Date.now()) return JSON.parse(cached.data);
  const { data, error } = await createAdminClient().storage.from("private-workbooks").download(`aspekte-neu-b2/${path}`);
  if (error || !data) throw new Error("Private workbook source unavailable");
  const text = await data.text(); contentCache.set(path, { data: text, expires: Date.now() + 60_000 });
  return JSON.parse(text);
}

export async function readWorkbookPage(number: number): Promise<WorkbookPage | null> {
  if (!Number.isInteger(number) || number < 6 || number > 145) return null;
  try {
    const page = await sourceJson(`content/${String(number).padStart(3, "0")}.json`);
    if (page.bookPage !== number || !Array.isArray(page.exercises)) throw new Error("Invalid workbook content");
    return page;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readWorkbookChapter(chapter: number) {
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 10) return [];
  return (await Promise.all(Array.from({ length: 14 }, (_, i) => readWorkbookPage(6 + (chapter - 1) * 14 + i)))).filter((page): page is WorkbookPage => !!page);
}

export async function readWorkbookManifest(): Promise<WorkbookManifest | null> {
  try {
    const source = await sourceJson("manifest.json");
    const chapters = await Promise.all(source.chapters.map(async (chapter: WorkbookManifest["chapters"][number]) => {
      if (source.runtimePreparedVersion === 2 && chapter.readyPages === 14 && chapter.nativePages === 14 && Number.isInteger(chapter.totalFields)) return chapter;
      const pages = await readWorkbookChapter(chapter.number);
      return { ...chapter, readyPages: pages.length, nativePages: pages.filter(page => !!page.nativeContentVersion).length, totalFields: pages.reduce((sum, page) => sum + page.exercises.reduce((n, e) => n + e.fields.length, 0), 0) };
    }));
    return { title: source.title, subtitle: source.subtitle, editionIsbn: source.editionIsbn, pdfPages: source.pdfPages,
      chapters, tracks: source.tracks.map(({ number, available, seconds, bytes }: WorkbookManifest["tracks"][number]) => ({ number, available, seconds, bytes })), feedbackAvailable: !!process.env.GEMINI_API_KEY };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readStudyChapter(chapter: number) {
  const pages = await readWorkbookChapter(chapter);
  return Array.from({ length: 14 }, (_, i) => {
    const number = 6 + (chapter - 1) * 14 + i;
    const page = pages.find(p => p.bookPage === number);
    return page ? studyPage(page) : { bookPage: number, section: "Arbeitsbuch", kind: "exercises" as const, tracks: [], exercises: [], warnings: [], ready: false, nativeReady: false };
  });
}
