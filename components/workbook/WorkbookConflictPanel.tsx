"use client";
import type { WorkbookDraft, WorkbookLearningState } from "@/lib/workbook-study";

type Conflict = { remote: WorkbookLearningState; local: WorkbookDraft; keys: string[] };
function title(key: string) {
  const [kind, page, exercise, field] = key.split(":");
  if (kind === "run") return `Chapter ${page} · fresh attempt`;
  if (kind === "exercise-run") return `Page ${page} · Exercise ${exercise} · fresh attempt`;
  if (kind === "notes") return `Page ${page} · Notes`;
  return `Page ${page} · Exercise ${exercise} · Answer ${field}`;
}
export default function WorkbookConflictPanel({ conflict, choices, onChoice, onResolve, onExport }: {
  conflict: Conflict; choices: Record<string, "local" | "remote">;
  onChoice: (key: string, choice: "local" | "remote") => void;
  onResolve: () => void; onExport: () => void;
}) {
  return <section className="wb-conflict" role="alert"><h2>Choose which changes to keep</h2>
    <p>Both devices changed the same work. Your device version will be retained as a separate recovery copy when you save your choices.</p>
    {conflict.keys.map(key => {
      const [kind, ...parts] = key.split(":"); const id = parts.join(":");
      if (kind === "run" || kind === "exercise-run") return <p key={key}><strong>{title(key)}</strong><br />A fresh attempt was started elsewhere. Only device answers you explicitly choose will be carried into it.</p>;
      const group = kind === "notes" ? "notes" : "answers";
      const local = conflict.local[group][id] || "", remote = conflict.remote.draft[group][id] || "";
      return <div className="wb-conflict-entry" key={key}><label>{title(key)}<select aria-label={`Choose response for ${title(key)}`} value={choices[key] || "remote"} onChange={e => onChoice(key, e.target.value as "local" | "remote")}>
        <option value="remote">Other device: {(remote || "(empty)").slice(0, 160)}</option><option value="local">This device: {(local || "(empty)").slice(0, 160)}</option>
      </select></label><details><summary>Compare full responses</summary><strong>This device</strong><pre tabIndex={0} aria-label="Full response from this device">{local || "(empty)"}</pre><strong>Other device</strong><pre tabIndex={0} aria-label="Full response from the other device">{remote || "(empty)"}</pre></details></div>;
    })}
    <div className="wb-button-row"><button type="button" className="wb-button" onClick={onExport}>Export these device changes</button><button type="button" className="wb-primary-button" onClick={onResolve}>Save my choices</button></div>
  </section>;
}
