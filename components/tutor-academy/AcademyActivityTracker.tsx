"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, CheckCircle2 } from "lucide-react";
import { saveAcademyResumePosition } from "@/app/dashboard/tutor/academy/actions";
import { academyActivityProgress } from "@/lib/academy-resume-position";

export default function AcademyActivityTracker({ courseKey, lessonId, activities, completedIds, german }: {
  courseKey?: string; lessonId?: string;
  activities: { id: string; label: string; required: boolean }[];
  completedIds: string[]; german: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const candidate = useRef("");
  const savedId = useRef("");
  const queue = useRef(Promise.resolve());
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const progress = academyActivityProgress(activities.filter((item) => item.required).map((item) => item.id), completedIds);
  const canSave = !!courseKey && !!lessonId;
  const save = (id: string, force = false) => {
    if (!canSave || !id || (!force && savedId.current === id)) return;
    queue.current = queue.current.then(async () => {
      if (!force && candidate.current !== id) return;
      setBusy(true);
      try {
        const result = await saveAcademyResumePosition(courseKey!, lessonId!, id);
        if (result.error) { setStatus(german ? "Position nicht gespeichert. Bitte erneut versuchen." : "Position not saved. Please retry."); return; }
        savedId.current = id;
        setStatus(german ? "Position im Konto gespeichert · Sie können hier später fortsetzen." : "Position saved to your account · Resume here next time.");
      } catch {
        setStatus(german ? "Position nicht gespeichert. Bitte erneut versuchen." : "Position not saved. Please retry.");
      } finally { setBusy(false); }
    });
  };
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const root = element.current?.closest("[data-academy-lesson]");
    if (!root) return;
    let timeout: ReturnType<typeof setTimeout>;
    const select = (id: string) => {
      if (candidate.current === id) return;
      candidate.current = id;
      setCurrent(id);
      setStatus("");
      clearTimeout(timeout);
      timeout = setTimeout(() => saveRef.current(id), 1200);
    };
    const update = () => {
      const visible = activities.flatMap((activity) => {
        const node = document.getElementById(`academy-block-${activity.id}`);
        if (!node?.getClientRects().length || !root.contains(node)) return [];
        const rect = node.getBoundingClientRect();
        return rect.bottom > 240 && rect.top < window.innerHeight ? [{ id: activity.id, top: rect.top }] : [];
      });
      const target = visible.filter((item) => item.top <= 260).at(-1) || visible[0];
      if (target) select(target.id);
    };
    const interact = (event: Event) => {
      const node = event.target instanceof Element ? event.target.closest('[id^="academy-block-"]') : null;
      const id = node?.id.replace(/^academy-block-/, "");
      if (id && root.contains(node!) && activities.some((item) => item.id === id)) select(id);
    };
    const observer = new MutationObserver(update);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    update();
    window.addEventListener("scroll", update, { passive: true });
    root.addEventListener("focusin", interact);
    root.addEventListener("pointerdown", interact);
    return () => {
      clearTimeout(timeout); observer.disconnect();
      window.removeEventListener("scroll", update);
      root.removeEventListener("focusin", interact); root.removeEventListener("pointerdown", interact);
    };
  }, [activities]);
  return <section ref={element} className="mb-6 rounded-2xl border border-[#BFDCD0] bg-[#F2F9F5] p-5" aria-label={german ? "Aktivitätsfortschritt" : "Activity progress"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-[#245444]"><CheckCircle2 size={21} aria-hidden="true" />{german ? "Ihr Fortschritt" : "Your progress"}</h2>
      <span className="text-sm font-bold text-[#245444]">{progress.completed}/{progress.total} {german ? "Pflichtaktivitäten" : "required activities"}</span>
    </div>
    {progress.total ? <progress value={progress.completed} max={progress.total} className="mt-3 h-3 w-full accent-[#39766C]" aria-label={german ? "Gespeicherte Pflichtaktivitäten" : "Saved required activities"} /> : null}
    <p className="mt-2 text-sm text-[#344B60]">{german ? "Die Position merkt Ihren letzten Besuch. Sie schließt keine Aufgabe ab und speichert keine ungesendeten Antworten." : "Your position remembers the last visit. It does not complete tasks or save unsent answers."}</p>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-[#344B60]">{activities.find((item) => item.id === current)?.label || (german ? "Wählen Sie eine Aktivität." : "Choose an activity.")}</span>
      <button type="button" disabled={!canSave || !current || busy} onClick={() => save(candidate.current, true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#A7CDB9] bg-white px-4 text-sm font-bold text-[#245444] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#39766C]"><Bookmark size={17} aria-hidden="true" />{busy ? german ? "Speichert …" : "Saving …" : german ? "Position speichern" : "Save my place"}</button>
    </div>
    <p role="status" className="mt-3 text-sm text-[#344B60]">{canSave ? status || (german ? "Die aktuelle Aktivität wird automatisch gespeichert, sobald Sie dort bleiben." : "Your current activity is saved automatically after you pause there.") : german ? "Vorschau · Positionen und Fortschritt werden nicht gespeichert." : "Preview · Positions and progress are not saved."}</p>
  </section>;
}
