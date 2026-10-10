// Builds an editable, offline example from the same pure content used on /business.
// This is a narrow browser-module handover, not an Academy or LMS export system.
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext, Script } from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/business/examples");
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

async function loadPureModule(file) {
  const source = await readFile(resolve(root, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length || 0, 0, `${file} must transpile without diagnostics`);
  const exports = {};
  runInNewContext(compiled.outputText, { exports }, { timeout: 1000, filename: file });
  return { exports, script: compiled.outputText };
}

const demo = await loadPureModule("app/business/onboarding-demo.ts");
const shared = await loadPureModule("app/business/handover-example.ts");

// The shared content is deliberately imported: the web page and handover sample
// must describe the same task and assessment, rather than two drifting examples.
const example = shared.exports;
const content = {
  title: example.handoverBrief?.title,
  brief: example.handoverBrief?.task,
  audience: example.handoverBrief?.audience,
  objectives: example.handoverBrief?.objectives,
  exercise: example.handoverExercise,
  response: example.handoverSampleResponse,
  rubric: example.handoverRubric,
  storyboard: example.handoverStoryboard,
  revision: example.handoverRevision,
  documents: example.handoverDocuments,
  evaluation: example.handoverEvaluationPlan,
};
assert.ok(content.brief && content.objectives?.length && content.exercise && content.response && content.rubric?.length && content.storyboard?.length, "The shared handover example must supply the complete design and assessment.");

// Keep the runtime content contract simple and explicit. No dependency imports
// or APIs can enter the browser package through these pure source modules.
const browserDemo = `(function () { const exports = {}; ${demo.script}\nreturn exports; })()`;

const stylesheet = `
:root{color-scheme:light;--navy:#12243a;--teal:#006b70;--muted:#526071;--line:#dce2e8;--soft:#f3f5f7}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--soft);color:var(--navy);font:1rem/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
a{color:var(--teal);text-underline-offset:.2em}a,button,input,textarea,summary{touch-action:manipulation}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--teal);outline-offset:4px}
button,input,textarea{font:inherit}button,summary{cursor:pointer}button{min-height:44px;border:0;border-radius:5px;padding:.6rem 1rem;background:var(--navy);color:#fff;font-weight:650}button:hover{background:#213f5a}button:disabled{cursor:not-allowed;opacity:.55}
header{background:var(--navy);color:white;padding:2.5rem 1.25rem}header>div,main,footer{width:min(100%,960px);margin:auto}header p{color:#d1dfec}h1,h2,h3{line-height:1.25;letter-spacing:-.02em}h1{font-size:clamp(1.9rem,5vw,3rem)}h2{font-size:clamp(1.5rem,4vw,2rem)}h3{font-size:1.1rem}
main{padding:1.5rem 1.25rem 3rem}section{margin-top:1.5rem;padding:1.5rem;border:1px solid var(--line);border-radius:8px;background:white;scroll-margin-top:1rem}nav{display:flex;flex-wrap:wrap;gap:1rem;padding:.75rem 0}p{margin:.75rem 0}.label{font-size:.78rem;text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:var(--teal)}.notice{border-left:3px solid var(--teal);background:#edf5f5;padding:.8rem 1rem}.muted{color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.25rem}.source{white-space:pre-wrap;overflow-wrap:anywhere}.stage{font-size:.85rem;font-weight:700;color:var(--teal)}.context{padding:1rem;background:var(--soft);border-radius:5px}.options{display:grid;gap:.7rem}fieldset{border:0;padding:0;margin:1.25rem 0}legend{font-weight:650;margin-bottom:.8rem}
.choice{display:flex;gap:.7rem;align-items:flex-start;min-height:44px;padding:.85rem;border:1px solid var(--line);border-radius:5px;cursor:pointer}.choice:has(input:checked){border-color:var(--teal);background:#edf5f5}.choice input{width:1rem;height:1rem;margin-top:.35rem;flex-shrink:0;accent-color:var(--teal)}.actions{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.75rem;margin-top:1rem}.secondary{color:var(--teal);background:transparent;border:1px solid var(--line)}.secondary:hover{background:#edf5f5}
textarea{display:block;width:100%;min-height:14rem;border:1px solid #8294a5;border-radius:5px;background:white;color:var(--navy);padding:.8rem;resize:vertical}label[for]{display:block;font-weight:650;margin:1rem 0 .5rem}small{display:block;color:var(--muted)}details{margin:1.25rem 0;border-top:1px solid var(--line);padding-top:1rem}summary{min-height:44px;font-weight:650;color:var(--teal)}.rubric-item{padding:1rem 0;border-top:1px solid var(--line)}.rubric-item:first-child{border-top:0}.rubric-item dl{margin:0}.rubric-item dt{font-weight:650}.rubric-item dd{margin:0 0 .6rem;color:var(--muted)}footer{padding:0 1.25rem 2rem;font-size:.85rem;color:var(--muted)}.skip{position:absolute;left:1rem;top:-8rem;background:white;padding:.75rem}.skip:focus{top:1rem}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}[hidden]{display:none!important}
@media(max-width:600px){.grid{grid-template-columns:1fr}section{padding:1.1rem}main{padding:1rem}header{padding:1.75rem 1rem}.actions button{flex:1}h1{font-size:1.9rem}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{body{background:white}header{background:white;color:var(--navy)}header p{color:var(--muted)}nav,.skip,button,#decision-form{display:none}section{break-inside:avoid}details>*{display:block}textarea{height:16rem}}
`;

const runtime = `
"use strict";
const demo = ${browserDemo};
let state = demo.createDemoState();
const stage = document.getElementById("demo-stage");
const heading = document.getElementById("demo-heading");
const context = document.getElementById("demo-context");
const form = document.getElementById("decision-form");
const fieldset = document.getElementById("decision-options");
const legend = document.getElementById("decision-question");
const choices = document.getElementById("choices");
const feedback = document.getElementById("feedback");
const next = document.getElementById("next");
const review = document.getElementById("decision-review");

function paragraph(text, className) { const element = document.createElement("p"); element.textContent = text; if (className) element.className = className; return element; }
function render(focusHeading) {
  const scenario = demo.getDemoScenario(state);
  stage.textContent = state.complete ? "Three decisions completed" : "Decision " + (state.step + 1) + " of 3 · " + demo.demoSteps[state.step];
  heading.textContent = state.complete ? "Your handover review" : scenario.title;
  form.hidden = state.complete;
  context.hidden = state.complete;
  review.hidden = !state.complete;
  if (state.complete) {
    const outcome = demo.getDemoReview(state.decisions);
    review.replaceChildren(paragraph(outcome.outcome));
    const list = document.createElement("ol");
    for (const item of state.decisions) { const row = document.createElement("li"); row.textContent = item.label; list.append(row); }
    review.append(list, paragraph("What to practise next", "label"));
    const practice = document.createElement("ul");
    for (const item of outcome.practice) { const row = document.createElement("li"); row.textContent = item; practice.append(row); }
    review.append(practice, paragraph("This review describes the choices made in a fictional scenario. It is not a measure of workplace performance.", "muted"));
    const link = document.createElement("a"); link.href = "#application"; link.textContent = "Continue to the practical exercise"; review.append(link);
  } else {
    context.textContent = scenario.context;
    legend.textContent = scenario.question;
    fieldset.disabled = state.checked;
    choices.replaceChildren();
    for (const option of scenario.options) {
      const label = document.createElement("label"); label.className = "choice";
      const input = document.createElement("input"); input.type = "radio"; input.name = "decision"; input.value = option.choice; input.checked = state.selected === option.choice;
      input.addEventListener("change", () => { state = demo.demoReducer(state, { type: "select", choice: option.choice }); next.disabled = state.selected === null; });
      const text = document.createElement("span"); text.textContent = option.label; label.append(input, text); choices.append(label);
    }
    feedback.replaceChildren();
    if (state.checked) { feedback.append(paragraph("What happens next", "label"), paragraph(state.decisions[state.step].feedback)); }
    next.disabled = state.selected === null;
    next.textContent = state.checked ? (state.step === 2 ? "Review decisions" : "Continue") : "Check decision";
  }
  if (focusHeading) heading.focus({ preventScroll: true });
}
form.addEventListener("submit", (event) => { event.preventDefault(); const previous = state.step; state = demo.demoReducer(state, { type: state.checked ? "continue" : "check" }); render(previous !== state.step || state.complete); });
document.getElementById("restart").addEventListener("click", () => { state = demo.createDemoState(); render(true); });
const answer = document.getElementById("application-answer");
const status = document.getElementById("answer-status");
answer.value = "";
answer.addEventListener("input", () => { status.textContent = answer.value.trim() ? "Your draft stays in this open page only. It is not sent or automatically scored." : "No answer entered yet."; });
document.getElementById("clear-answer").addEventListener("click", () => { answer.value = ""; status.textContent = "Your draft has been cleared."; answer.focus(); });
render(false);
`;

// Markup generated below uses only escaped data; user answers are handled with
// textContent in the runtime, never interpolated into HTML.
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Fictional ScienceDojo workplace learning example: decisions, a practical handover exercise, and a scoring guide."><title>Client handover — ScienceDojo learning example</title><style>${stylesheet}</style></head>
<body><a class="skip" href="#main">Skip to the module</a><header><div><p class="label" style="color:#b9e0df">ScienceDojo for Business · Downloadable example</p><h1>${escape(content.title)}</h1><p>Practise clarifying a request, agreeing a realistic scope, and preparing an actionable handover.</p><p><strong>Fictional studio concept · Not evaluated with a client team</strong></p></div></header>
<main id="main"><nav aria-label="Module sections"><a href="#brief">The task</a><a href="#practice">Decision practice</a><a href="#application">Apply it</a><a href="#assessment">Example and scoring guide</a><a href="#use">Files and use</a></nav>
<section id="brief" aria-labelledby="brief-heading"><p class="label">1 · Understand the task</p><h2 id="brief-heading">A clear request before work begins</h2><p>${escape(content.brief)}</p><p><strong>Audience:</strong> ${escape(content.audience)}</p><h3>After this practice, you should be able to:</h3><ul>${content.objectives.map((item) => `<li>${escape(item)}</li>`).join("")}</ul><p class="notice">Allow around 5–10 minutes for the decisions, writing, and review, depending on your pace. The three decisions alone are a quick excerpt of about two minutes. Your pace may vary.</p></section>
<section id="practice" aria-labelledby="practice-heading"><p class="label">2 · Practise the decisions</p><h2 id="practice-heading">Try, check, understand</h2><p>Choose a response and read the feedback before continuing. Earlier choices change the next situation.</p><p id="demo-stage" class="stage"></p><h3 id="demo-heading" tabindex="-1"></h3><p id="demo-context" class="context"></p>
<form id="decision-form"><fieldset id="decision-options"><legend id="decision-question"></legend><div id="choices" class="options"></div></fieldset><div id="feedback" class="notice" role="status" aria-live="polite" aria-atomic="true"></div><div class="actions"><button id="next" type="submit" disabled>Check decision</button></div></form><div id="decision-review" hidden></div><button id="restart" class="secondary" type="button" style="margin-top:1rem">Start the decisions again</button><noscript><p class="notice">Enable JavaScript to use the decision practice. The exercise and scoring guide below remain readable without it.</p></noscript></section>
<section id="application" aria-labelledby="application-heading"><p class="label">3 · Apply the approach</p><h2 id="application-heading">Prepare the handover</h2>${exerciseMarkup(content.exercise)}<label for="application-answer">Your handover response</label><textarea id="application-answer" aria-describedby="answer-guidance answer-status" autocomplete="off" maxlength="8000" placeholder="${escape(content.exercise.responseHint)}"></textarea><small id="answer-guidance">Use only this fictional scenario. Do not enter confidential or personal information. Nothing you write is transmitted or saved after the page closes or reloads.</small><p id="answer-status" class="muted" role="status" aria-live="polite">No answer entered yet.</p><button id="clear-answer" class="secondary" type="button">Clear my response</button><p>Compare your response with the scoring guide below. A team reviewer would assess the work sample; this example does not automatically grade your answer.</p></section>
<section id="assessment" aria-labelledby="assessment-heading"><p class="label">4 · Inspect the assessment</p><h2 id="assessment-heading">An example response and completed scoring guide</h2><details><summary>Reveal a sample learner response</summary><div class="source">${responseMarkup(content.response)}</div></details><h3>The criteria</h3><p>Use the same guide to review a learner response. Ratings describe the evidence present; they are not a validated pass threshold.</p>${rubricMarkup(content.rubric)}<details><summary>Inspect a suggested revision</summary><p>${escape(content.revision)}</p></details><p class="notice">This is an illustrative response and assessor judgement, not a real learner result. A client subject expert would approve the task and criteria before they were used.</p></section>
<section id="use" aria-labelledby="use-heading"><p class="label">5 · Keep and inspect the package</p><h2 id="use-heading">A module you can run independently</h2><p>This HTML file contains its own readable styles, content and JavaScript. Open it in a supported browser or place it on a static web server. It requires no account, API, external font, installation or ScienceDojo subscription.</p><p>The sample is provided for your organisation’s internal evaluation and learning. You may keep and adapt it for that internal use. It grants no exclusive intellectual-property assignment or right to resell or redistribute ScienceDojo materials.</p><p>Responses and decision progress exist only in this open page. There is no reporting to an LMS, central tracking, certificate, learner dashboard or data collection.</p><p>Companion editable documents: <a href="learning-design.md" download>learning design and storyboard</a>, <a href="assessment-guide.md" download>exercise and scoring guide</a>, <a href="client-review-checklist.md" download>client review and handover checklist</a>, and <a href="setup-and-use.md" download>setup and usage notes</a>. Keep them beside this HTML file to use these local links.</p></section>
</main><footer>ScienceDojo for Business · Fictional learning sample. The editable files demonstrate one possible browser handover, not a complete onboarding curriculum.</footer><script>${runtime.replace(/<\/script/gi, "<\\/script")}</script></body></html>\n`;

function exerciseMarkup(exercise) {
  return `<p>${escape(exercise.prompt)}</p><dl>${exercise.notes.map(({ source, fact }) => `<dt><strong>${escape(source)}</strong></dt><dd style="margin:.3rem 0 1rem">${escape(fact)}</dd>`).join("")}</dl>`;
}
function responseMarkup(response) {
  if (typeof response === "string") return escape(response);
  if (Array.isArray(response)) return response.map((item) => `<p>${escape(typeof item === "string" ? item : Object.values(item).join(": "))}</p>`).join("");
  return Object.entries(response).map(([key, value]) => `<p><strong>${escape(key)}:</strong> ${escape(value)}</p>`).join("");
}
function rubricMarkup(rubric) {
  return rubric.map((row) => `<article class="rubric-item"><h3>${escape(row.criterion)}</h3><p>${escape(row.description)}</p><dl>${row.levels.map(({ rating, description }) => `<dt>${escape(rating)}</dt><dd>${escape(description)}</dd>`).join("")}</dl><p class="notice"><strong>Illustrative review: ${escape(row.sampleRating)}.</strong><br>${escape(row.sampleEvidence)}</p></article>`).join("");
}
function markdown(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? `- ${item}` : Object.entries(item).map(([key, text]) => `**${key}:** ${typeof text === "string" ? text : JSON.stringify(text)}`).join("\n\n")).join("\n\n");
  return Object.entries(value).map(([key, text]) => `**${key}:** ${typeof text === "string" ? text : JSON.stringify(text)}`).join("\n\n");
}

const files = {
  "client-handover-module.html": html,
  "learning-design.md": `# Client request → clear handover\n\nScienceDojo for Business · Fictional studio concept, not evaluated with a client team.\n\n## Workplace task\n\n${markdown(content.brief)}\n\n**Audience:** ${content.audience}\n\n## Observable learning objective\n\n${markdown(content.objectives)}\n\n## Storyboard\n\n${markdown(content.storyboard)}\n\n## Delivery and duration\n\nOne self-contained browser module. The three decisions take approximately two minutes; reading the task, making decisions, writing the application response, and comparing it with the guide are intended to take about 5–10 minutes. This is an estimate, not a tested completion-time result.\n\n## Evaluation plan\n\n${markdown(content.evaluation)}\n\nDo not infer improved workplace performance from module completion or from this fictional sample.\n`,
  "assessment-guide.md": `# Practical exercise and scoring guide\n\nScienceDojo for Business · Fictional example. The sample response and completed ratings are illustrative, not collected learner results.\n\n## Application exercise\n\n${content.exercise.prompt}\n\n${content.exercise.notes.map(({ source, fact }) => `**${source}:** ${fact}`).join("\n\n")}\n\nSuggested response structure:\n\n${content.exercise.responseHint}\n\n## Sample learner response\n\n${markdown(content.response)}\n\n## Criteria and completed example\n\n${content.rubric.map((row) => `### ${row.criterion}\n\n${row.description}\n\n${row.levels.map(({ rating, description }) => `- **${rating}:** ${description}`).join("\n")}\n\n**Illustrative review: ${row.sampleRating}.** ${row.sampleEvidence}`).join("\n\n")}\n\n## Suggested revision\n\n${content.revision}\n\n## Reviewer instructions\n\nReview the actual work sample, quote the evidence supporting each rating, and identify what needs clarification. The guide is not an automatically scored test or a validated pass threshold. A client subject expert must approve the task and criteria before use with real learners.\n`,
  "client-review-checklist.md": `# Client review and handover checklist\n\nScienceDojo for Business · Editable example. These are planning checks, not a claim that a client has approved this fictional module.\n\n${content.documents.map(({ title, items }) => `## ${title}\n\n${items.map((item) => `- [ ] ${item}`).join("\n")}`).join("\n\n")}\n\n## Final delivery record\n\n- Module version: [record]\n- Client approver and sign-off date: [record]\n- Agreed supported browsers and devices: [record]\n- Hosting and launch steps: [record]\n- Files supplied and usage terms: [record]\n- Known limitations: [record]\n- Changes requested or follow-up scope: [record]\n`,
  "setup-and-use.md": `# Setup and usage notes\n\n## Files\n\n- client-handover-module.html: the complete module, with readable/editable HTML, CSS and JavaScript in one file.\n- learning-design.md: task, objectives, storyboard and evaluation plan.\n- assessment-guide.md: practical exercise, sample response and scoring guide.\n- client-review-checklist.md: editable review and handover checklist.\n- setup-and-use.md: these instructions.\n\n## Run the module\n\nDownload the files and keep them in one folder. Open client-handover-module.html in a browser with JavaScript enabled. Alternatively, upload the folder to an ordinary static web server you control. No ScienceDojo account, application server, API, external font or runtime service is required. Your organisation supplies and pays for any hosting it chooses.\n\nThe companion document links are relative: they work when the documents remain beside the HTML file. JavaScript is needed for the decision practice; the task, application prompt, example response and rubric remain readable without it.\n\n## Responses and privacy\n\nDecisions and typed responses exist only in the current page. Nothing is sent, stored centrally or saved after a reload or close. There are no analytics, network calls, learner accounts, automated marking, certificates, LMS reporting or resumption between sessions. Use the fictional scenario and avoid personal or confidential information. For a real workshop, agree a separate process for collecting work samples.\n\n## Editing\n\nOpen the HTML or Markdown files in a text editor. The HTML includes the styles and decision runtime rather than an authoring-app project. Retest interactions, links, and layouts after changing code.\n\n## Use and rights\n\nScienceDojo permits your organisation to keep and adapt this sample for internal evaluation and learning, without a per-learner fee or ScienceDojo subscription. This permission does not assign exclusive intellectual property or permit resale or redistribution of ScienceDojo materials. For a commissioned client module, the signed proposal records usage rights and any third-party asset licences. Ongoing updates, managed hosting and integrations are separately scoped.\n\n## Checks and limits\n\nThe sample is intended for modern browsers. Browser, mobile, keyboard and zoom checks must be recorded separately before production claims are made. It is a static browser example, not a SCORM package, LMS compatibility certification or accessibility certification.\n`,
};

new Script(runtime, { filename: "client-handover-module.js" });
assert.doesNotMatch(html, /<(?:script|link|img|iframe)\b[^>]*(?:src|href)=["']https?:/i, "The module must not load remote assets");
assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\s*(?:\(|\.)/, "The runtime must not transmit or persist answers");
assert.equal((html.match(/<script>/g) || []).length, 1);
await mkdir(output, { recursive: true });
for (const [name, value] of Object.entries(files)) await writeFile(resolve(output, name), value, "utf8");
console.log(`Built ${Object.keys(files).length} editable example files in public/business/examples; standalone script parses and has no remote runtime assets or response persistence.`);
