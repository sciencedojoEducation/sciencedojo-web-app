"use client";

import AcademyGermanText from "./AcademyGermanText";

const writingChecks = [
  ["I have answered every part of the task using my own details.", "මගේම තොරතුරු යොදා කාර්යයේ සියලු කොටස්වලට පිළිතුරු දී ඇත."],
  ["I have checked verb position, articles and spelling against the lesson.", "ක්‍රියා පදයේ ස්ථානය, articles සහ අක්ෂර වින්‍යාසය පාඩම සමඟ සසඳා ඇත."],
  ["I have compared my answer with the model; my details may be different.", "මගේ පිළිතුර ආදර්ශය සමඟ සසඳා ඇත. මගේ තොරතුරු වෙනස් විය හැකිය."],
];
const speakingChecks = [
  ["I have listened to my recording and can hear my words clearly.", "මගේ පටිගත කිරීම ඇසූ අතර මගේ වචන පැහැදිලිව ඇසෙයි."],
  ["I have answered the task and checked the lesson’s grammar and phrases.", "කාර්යයට පිළිතුරු දී පාඩමේ ව්‍යාකරණ සහ වාක්‍ය රටා පරීක්ෂා කර ඇත."],
  ["I have tried speaking without reading the model.", "ආදර්ශ පිළිතුර නොබලා කතා කිරීමට උත්සාහ කර ඇත."],
];

export default function AcademyGuidedSelfReview({ speaking = false, modelAnswer }: { speaking?: boolean; modelAnswer: string }) {
  return <div className="mt-5 rounded-xl border border-[#C9D5E2] bg-white p-4 sm:p-5">
    <h3 className="font-bold text-[#245444]">Self-review · Selbst überprüfen · ස්වයං පරීක්ෂාව</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">Use the checklist and model to review your own response. This is not an automatic correctness or pronunciation score.</p>
    <p lang="si" className="mt-2 text-sm leading-6 text-slate-600">ලැයිස්තුව සහ ආදර්ශය යොදා ඔබේ පිළිතුර පරීක්ෂා කරන්න. මෙය ස්වයංක්‍රීය නිවැරදිභාව හෝ උච්චාරණ ලකුණක් නොවේ.</p>
    <div className="mt-4 space-y-3">{(speaking ? speakingChecks : writingChecks).map(([english, sinhala]) => <label key={english} className="flex items-start gap-3 text-sm leading-6">
      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-emerald-700" />
      <span>{english}<span lang="si" className="block text-slate-600">{sinhala}</span></span>
    </label>)}</div>
    <details className="mt-4 rounded-lg border border-slate-200 p-3">
      <summary className="cursor-pointer font-semibold text-[#245444]">Compare with a model · Beispiel ansehen · ආදර්ශය බලන්න</summary>
      <p lang="de" className="mt-3 whitespace-pre-wrap text-lg leading-8"><AcademyGermanText text={modelAnswer}/></p>
    </details>
  </div>;
}
