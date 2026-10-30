import { trainerAsset } from "@/lib/intensivtrainer-assets";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return trainerAsset(request, (await context.params).id);
}
