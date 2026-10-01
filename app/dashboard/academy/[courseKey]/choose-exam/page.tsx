import { renderChooseAcademyExamPage } from "@/lib/academy-choose-exam-page";

export default async function AcademyChooseExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseKey: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ courseKey }, query] = await Promise.all([params, searchParams]);
  return renderChooseAcademyExamPage(
    courseKey,
    query,
    `/dashboard/academy/${courseKey}`,
  );
}
