import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCommunityCategories, COMMUNITY_RULES } from "@/lib/community";
import { createCommunityProfile, createTopic } from "../actions";

export const metadata: Metadata = { title: "Ask an Exam Question | ScienceDojo", robots: { index: false, follow: false } };

export default async function NewTopicPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/community/new${params.category ? `?category=${params.category}` : ""}`)}`);
  const admin = createAdminClient();
  const [{ data: profile }, categories] = await Promise.all([
    admin.from("community_profiles").select("pseudonym, is_restricted").eq("user_id", user.id).maybeSingle(),
    getCommunityCategories(),
  ]);

  return <main className="min-h-screen bg-[#f7fbff] px-4 py-12 text-secondary"><div className="mx-auto max-w-3xl">
    <p className="text-xs font-black uppercase tracking-widest text-primary">Moderated contribution</p>
    <h1 className="mt-3 text-4xl font-black">{profile ? "Ask the community" : "Choose your public pseudonym"}</h1>
    <p className="mt-4 font-semibold leading-7 text-secondary/55">Your legal name and email are never displayed. New questions are reviewed before publication.</p>
    {!profile ? <form action={createCommunityProfile} className="mt-8 rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
      <label className="text-sm font-black">Public pseudonym</label>
      <input name="pseudonym" required minLength={3} maxLength={30} placeholder="e.g. CuriousQuark24" className="mt-2 w-full rounded-2xl border border-secondary/10 px-4 py-3 font-bold outline-none focus:border-primary"/>
      <p className="mt-2 text-xs font-semibold text-secondary/40">Do not use your real name, school, location, or birth year.</p>
      <button className="mt-5 rounded-full bg-primary px-6 py-3 text-sm font-black text-white">Create community profile</button>
    </form> : <form action={createTopic} className="mt-8 space-y-5 rounded-3xl border border-secondary/10 bg-white p-6 shadow-sm">
      <div><label className="text-sm font-black">Space</label><select name="category_id" required defaultValue={categories.find(category => category.slug === params.category)?.id} className="mt-2 w-full rounded-2xl border border-secondary/10 px-4 py-3 font-bold">{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      <div><label className="text-sm font-black">Question title</label><input name="title" required minLength={10} maxLength={140} className="mt-2 w-full rounded-2xl border border-secondary/10 px-4 py-3 font-bold" placeholder="Be specific about the subject and difficulty"/></div>
      <div><label className="text-sm font-black">What have you tried?</label><textarea name="body" required minLength={20} maxLength={8000} rows={9} className="mt-2 w-full rounded-2xl border border-secondary/10 px-4 py-3 font-semibold leading-7" placeholder="Include the qualification, exam board when relevant, and the exact point of confusion. Do not paste copyrighted papers."/></div>
      <label className="flex items-start gap-3 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold"><input type="checkbox" required className="mt-1"/>I am 13 or older and agree to the community guidelines.</label>
      <button disabled={profile.is_restricted} className="rounded-full bg-primary px-7 py-3 text-sm font-black text-white disabled:opacity-40">Submit for review</button>
    </form>}
    <div className="mt-8 rounded-3xl bg-secondary p-6 text-white"><h2 className="font-black">Before you post</h2><ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-white/65">{COMMUNITY_RULES.map(rule => <li key={rule}>• {rule}</li>)}</ul></div>
  </div></main>;
}
