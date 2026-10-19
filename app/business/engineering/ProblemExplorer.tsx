"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CornerDownRight, FileCheck2, Link2, RotateCcw, ShieldCheck } from "lucide-react";
import { engineeringDemoReducer, engineeringScenarios, initialEngineeringDemo, type DemoChoice, type DemoScenario, type EngineeringDemoState } from "@/lib/engineering-demo";
import { useEngineeringInterest } from "./EngineeringExperience";
import s from "./engineering.module.css";

export default function ProblemExplorer() {
  const [state, dispatch] = useReducer(engineeringDemoReducer, initialEngineeringDemo);
  const { choose } = useEngineeringInterest();
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const scenario = engineeringScenarios[state.scenario];

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(motion.matches);
    updateMotion(); motion.addEventListener("change", updateMotion);
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener("visibilitychange", update); update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); motion.removeEventListener("change", updateMotion); };
  }, []);

  useEffect(() => {
    if (state.phase !== "checking" || !visible) return;
    const timer = window.setTimeout(() => dispatch({ type: "resolve", attempt: state.attempt }), reduced ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.attempt, visible, reduced]);

  function select(key: DemoScenario) { dispatch({ type: "select", scenario: key }); choose(key); }
  const status = state.phase === "blocked" && !state.recover ? scenario.inputError : scenario[state.phase];
  return <section ref={root} id="problems" className={s.section} aria-labelledby="problems-heading" data-engineering-explorer data-phase={state.phase}>
    <div className={s.container}>
      <div className={s.sectionIntro}><p className={s.eyebrow}>01 / Services & starting points</p><div><h2 id="problems-heading">What would make<br /><span>your work easier?</span></h2><p className={s.sectionDescription}>Choose the change you have in mind. See a small example, then explore a possible first project.</p></div></div>
      <div className={s.explorerBody}>
        <div className={s.explorerCopy}>
      <div className={s.scenarioChoices} role="group" aria-label="Choose a problem">{(Object.keys(engineeringScenarios) as DemoScenario[]).map((key) => <button key={key} type="button" aria-pressed={state.scenario === key} aria-label={`${engineeringScenarios[key].prompt} — ${engineeringScenarios[key].service}: ${engineeringScenarios[key].label}`} onClick={() => select(key)}><span className={s.choiceNumber}>{engineeringScenarios[key].number}</span><span>{engineeringScenarios[key].prompt}<small>{engineeringScenarios[key].service}</small></span>{state.scenario === key ? <Check className={s.choiceCheck} size={18} aria-hidden="true" /> : <ArrowRight className={s.choiceArrow} size={18} aria-hidden="true" />}</button>)}</div>
      <div className={s.scenarioBrief}><p className={s.label}>The situation</p><p className={s.problemText}>{scenario.problem}</p><p className={s.firstProject}><span>A possible first project</span>{scenario.deliverable}</p><details className={s.scopeDetail}><summary>Explore a possible first step <CornerDownRight size={16} aria-hidden="true" /></summary><p>{scenario.solution}</p></details><a href="#contact" className={s.textLink} onClick={() => choose(state.scenario)}>Discuss something like this <ArrowUpRight size={17} aria-hidden="true" /></a></div></div>
        <div className={s.demoSurface}>
          <div className={s.demoToolbar}><span><span className={s.statusDot} />What the work could look like</span><span>Synthetic example</span></div>
          <div className={s.demoCanvas} data-running={state.phase === "checking" && visible && !reduced}>
            <div className={s.demoTitle}><span className={s.demoIcon}>{state.scenario === "integration" ? <Link2 size={22} aria-hidden="true" /> : <FileCheck2 size={22} aria-hidden="true" />}</span><div><p>{scenario.title}</p><small>Example / {scenario.reference}</small></div></div>
            <div className={s.request}><div><span className={s.label}>{scenario.record}</span><span className={s.requestTag}>{state.phase === "blocked" ? "Needs attention" : state.phase === "complete" ? "Complete" : "Illustrative"}</span></div><ScenarioVisual state={state} /></div>
          </div>
          <details key={state.scenario} className={s.demoTry} data-demo-disclosure onToggle={event => { if (!event.currentTarget.open) dispatch({ type: "reset" }); }}>
            <summary>Try this example <ArrowRight size={17} aria-hidden="true" /></summary>
            <div className={s.demoCanvas}>
              <div className={s.demoChoice} data-engineering-choice><label htmlFor="engineering-demo-decision">{scenario.field}</label><select id="engineering-demo-decision" value={state.choice} onChange={event => dispatch({ type: "choice", choice: event.target.value as DemoChoice })}><option value="ready">{scenario.validOption}</option><option value="incomplete">{scenario.invalidOption}</option></select></div>
              <ol className={s.flowSteps} aria-label="Example workflow">{scenario.steps.map((step, index) => <li key={step} data-done={state.phase === "complete" || index === 0} data-blocked={state.phase === "blocked" && index === 1}><span>{state.phase === "complete" || index === 0 ? <Check size={13} aria-hidden="true" /> : `0${index + 1}`}</span>{step}</li>)}</ol>
              <div className={s.demoStatus} data-error={state.phase === "blocked"} role="status" aria-live="polite"><ShieldCheck size={17} aria-hidden="true" /><p>{status}</p></div>
            </div>
            <div className={s.demoActions}>{state.phase === "blocked" ? <button type="button" className={s.smallButton} onClick={() => dispatch({ type: "retry" })}>{scenario.retry} <ArrowRight size={15} aria-hidden="true" /></button> : <button type="button" className={s.smallButton} disabled={state.phase === "checking"} onClick={() => dispatch({ type: "run", recover: false })}>{state.phase === "checking" ? "Checking…" : state.phase === "complete" ? "Run again" : "Run example"}<ArrowRight size={15} aria-hidden="true" /></button>}<button type="button" className={s.quietButton} disabled={state.phase === "checking"} onClick={() => dispatch({ type: "run", recover: true })}>Show recovery</button><button type="button" className={s.resetButton} aria-label="Reset example" onClick={() => dispatch({ type: "reset" })}><RotateCcw size={16} aria-hidden="true" /></button></div>
            <p className={s.demoLesson}><span>The principle</span>{scenario.lesson}</p>
          </details>
          <p className={s.demoCaption}>Illustrative only. Nothing is sent or stored. <a href="#work">See our actual product work</a>.</p>
        </div>
      </div>
      <noscript><div className={s.noScript}><p>Other starting points: help learners return to saved work, or connect your tools so an enquiry can be recovered if its notification fails.</p><a href="#contact">Tell us about your task</a></div></noscript>
    </div>
  </section>;
}


/** Synthetic UI fragments make the different decisions visible without service calls. */
function ScenarioVisual({ state }: { state: EngineeringDemoState }) {
  const correct = state.choice === "ready";
  const complete = state.phase === "complete";
  if (state.scenario === "workflow") return <div className={s.scenarioVisual} data-scenario-visual="workflow">
    <div className={s.courseTicket}><span>Example workshop</span><strong>Getting started</strong><span className={s.visualMeta}>Course reference · EXAMPLE–01</span></div>
    <div className={s.visualHandoff}><ArrowRight size={18} aria-hidden="true" /><span data-retained={correct}>{correct ? "Course attached" : "Course context missing"}</span></div>
    <p className={s.visualOutcome}>{complete ? "Ready for the next conversation" : "Website → focused enquiry"}</p>
  </div>;
  if (state.scenario === "application") return <div className={s.scenarioVisual} data-scenario-visual="application">
    <div className={s.resumeHeading}><span>Example learning activity</span><span>Saved at step 2</span></div>
    <ol className={s.learningSteps} aria-label="Illustrative saved learning steps">{[1,2,3].map(step => <li key={step} data-current={step === (correct ? 2 : 1)}><span>{step === 1 && correct ? <Check size={13} aria-hidden="true" /> : step}</span>{step === 1 ? (correct ? "Completed" : "Restart") : step === 2 ? "Saved work" : "Next"}</li>)}</ol>
    <p className={s.visualOutcome}>{correct ? "Continue from step 2. Keep the earlier work." : "Starting at step 1 ignores the saved work."}</p>
  </div>;
  return <div className={s.scenarioVisual} data-scenario-visual="integration">
    <div className={s.savedRecord}><ShieldCheck size={19} aria-hidden="true" /><div><strong>Example workshop enquiry</strong><span>{correct ? "Keep one saved record" : "No saved record to recover"}</span></div></div>
    <div className={s.visualHandoff}><ArrowRight size={18} aria-hidden="true" /><span data-retained={correct}>{state.phase === "blocked" && correct ? "Notification waiting for retry" : complete ? "Notification confirmed" : "Then notify the team"}</span></div>
    <p className={s.visualOutcome}>Illustrative sequence · no message is sent</p>
  </div>;
}
