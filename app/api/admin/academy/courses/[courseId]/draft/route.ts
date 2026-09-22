import { NextResponse } from "next/server";
import {
  sanitizeAcademyCourse,
  requireAcademyAdmin,
} from "@/lib/academy-authoring";
import type { AcademyCourse } from "@/lib/tutor-academy";

const MAX_DRAFT_BYTES = 900_000;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await context.params;
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_DRAFT_BYTES) {
      return NextResponse.json(
        { message: "This course draft is too large to autosave." },
        { status: 413 },
      );
    }
    const body = JSON.parse(raw) as {
      baseRevision?: number;
      document?: AcademyCourse;
      reason?: "autosave" | "manual";
    };
    if (
      !Number.isInteger(body.baseRevision) ||
      body.baseRevision === undefined ||
      !body.document
    ) {
      return NextResponse.json(
        { message: "Invalid autosave request." },
        { status: 400 },
      );
    }
    const baseRevision = body.baseRevision;
    const { supabase } = await requireAcademyAdmin();
    const document = sanitizeAcademyCourse(body.document);
    const { data, error } = await supabase.rpc("save_academy_course_draft_v2", {
      target_course_id: courseId,
      expected_revision: baseRevision,
      next_content: document,
      next_title: document.title,
      next_audiences: document.audienceRoles || [],
      save_reason: body.reason || "autosave",
    });
    if (error) {
      const match = error.message.match(/ACADEMY_REVISION_CONFLICT:(\d+)/);
      if (match)
        return NextResponse.json(
          {
            message: "A newer draft exists.",
            serverRevision: Number(match[1]),
          },
          { status: 409 },
        );
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      revision: Number(result?.revision || baseRevision + 1),
      savedAt: result?.saved_at || new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Draft could not be saved.";
    const status = /administrator|sign in/i.test(message) ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}
