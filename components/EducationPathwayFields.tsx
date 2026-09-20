"use client";

import {
  curriculumPathways,
  getAwardingBodiesForSelection,
  getDerivedAwardingBody,
  getEducationLabel,
  getLevelsForEducationSelection,
  getStagesForCurriculum,
  getSubjectVariants,
  getSubjectsForEducationSelection,
  getTopicsForSubject,
  otherEducationOption,
  uncertainEducationOption,
} from "@/lib/educationTaxonomy";

export type EducationPathwayValue = {
  curriculumKey: string;
  stage: string;
  awardingBodyKey: string;
  subject: string;
  subjectVariant: string;
  level: string;
  topic: string;
  specificationCode: string;
};

type Props = {
  value: EducationPathwayValue;
  onChange: (value: EducationPathwayValue) => void;
  allowedSubjects?: string[];
  showTopic?: boolean;
  topicRequired?: boolean;
  className?: string;
};

const uncertainOptions = [
  { key: otherEducationOption, label: "Other / not listed" },
  { key: uncertainEducationOption, label: "I’m not sure" },
];

const fieldClass = "mt-2 w-full rounded-xl border border-secondary/10 bg-white px-4 py-3 text-sm font-bold text-secondary outline-none focus:border-primary";

export default function EducationPathwayFields({ value, onChange, allowedSubjects, showTopic = true, topicRequired = false, className = "" }: Props) {
  const stages = getStagesForCurriculum(value.curriculumKey);
  const boardOptions = getAwardingBodiesForSelection(value.curriculumKey, value.stage);
  const derivedBoard = getDerivedAwardingBody(value.curriculumKey, value.stage);
  const effectiveBoard = value.awardingBodyKey || derivedBoard;
  const allSubjects = getSubjectsForEducationSelection(value.curriculumKey, value.stage, effectiveBoard);
  const subjects = allowedSubjects?.length ? allSubjects.filter((subject) => allowedSubjects.includes(subject)) : allSubjects;
  const variants = getSubjectVariants(value.subject, value.curriculumKey, value.stage);
  const levels = getLevelsForEducationSelection(value.curriculumKey, value.stage, value.subject);
  const topics = value.subject ? getTopicsForSubject(value.subject) : [];

  function update(patch: Partial<EducationPathwayValue>) {
    onChange({ ...value, ...patch });
  }

  function changeCurriculum(curriculumKey: string) {
    const nextStage = getStagesForCurriculum(curriculumKey)[0]?.key || uncertainEducationOption;
    const nextBoard = getDerivedAwardingBody(curriculumKey, nextStage);
    update({ curriculumKey, stage: nextStage, awardingBodyKey: nextBoard, subject: "", subjectVariant: "", level: "", topic: "", specificationCode: "" });
  }

  function changeStage(stage: string) {
    update({ stage, awardingBodyKey: getDerivedAwardingBody(value.curriculumKey, stage), subject: "", subjectVariant: "", level: "", topic: "", specificationCode: "" });
  }

  function changeBoard(awardingBodyKey: string) {
    update({ awardingBodyKey, subject: "", subjectVariant: "", level: "", topic: "", specificationCode: "" });
  }

  function changeSubject(subject: string) {
    const nextVariant = getSubjectVariants(subject, value.curriculumKey, value.stage)[0]?.key || "";
    const nextLevel = getLevelsForEducationSelection(value.curriculumKey, value.stage, subject)[0]?.key || "";
    update({ subject, subjectVariant: nextVariant, level: nextLevel, topic: getTopicsForSubject(subject)[0] || "", specificationCode: "" });
  }

  const needsClarification = [value.curriculumKey, value.stage, effectiveBoard, value.level].some((item) => [uncertainEducationOption, otherEducationOption].includes(item));

  return (
    <div className={`grid gap-4 ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
          Curriculum pathway
          <select name="curriculumKey" required value={value.curriculumKey} onChange={(event) => changeCurriculum(event.target.value)} className={fieldClass}>
            <option value="">Choose a curriculum</option>
            {curriculumPathways.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
          Stage or qualification
          <select name="stage" required value={value.stage} onChange={(event) => changeStage(event.target.value)} className={fieldClass}>
            <option value="">Choose a stage</option>
            {stages.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {boardOptions.length > 0 && (
        boardOptions.length === 1 ? (
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
            Exam board / awarding body
            <input type="hidden" name="awardingBodyKey" value={effectiveBoard} />
            <div className={`${fieldClass} bg-slate-50`}>{getEducationLabel("awardingBody", effectiveBoard)}</div>
          </label>
        ) : (
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
            Exam board / awarding body
            <select name="awardingBodyKey" required value={value.awardingBodyKey} onChange={(event) => changeBoard(event.target.value)} className={fieldClass}>
              <option value="">Choose an exam board</option>
              {boardOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              {uncertainOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
        )
      )}
      {boardOptions.length === 0 && <input type="hidden" name="awardingBodyKey" value="" />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
          Subject
          <select name="subject" required value={value.subject} onChange={(event) => changeSubject(event.target.value)} className={fieldClass}>
            <option value="">Choose a subject</option>
            {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {allowedSubjects?.length && value.stage && subjects.length === 0 ? <span className="mt-2 block normal-case tracking-normal text-amber-700">This tutor has no listed subject matching this route.</span> : null}
        </label>

        {variants.length > 0 ? (
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
            Subject route
            <select name="subjectVariant" required value={value.subjectVariant} onChange={(event) => update({ subjectVariant: event.target.value, specificationCode: "" })} className={fieldClass}>
              {variants.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
        ) : <input type="hidden" name="subjectVariant" value="" />}

        {levels.length > 0 ? (
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
            Tier or course level
            <select name="level" required value={value.level} onChange={(event) => update({ level: event.target.value })} className={fieldClass}>
              <option value="">Choose a level</option>
              {levels.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              {uncertainOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </label>
        ) : <input type="hidden" name="level" value="" />}

        {showTopic && (
          <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
            Topic
            <select name="topic" required={topicRequired} value={value.topic} onChange={(event) => update({ topic: event.target.value })} className={fieldClass}>
              <option value="">Choose a topic</option>
              {topics.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        )}
      </div>

      <label className="text-xs font-black uppercase tracking-widest text-secondary/60">
        Specification or syllabus code <span className="normal-case tracking-normal text-secondary/35">(optional)</span>
        <input name="specificationCode" value={value.specificationCode} onChange={(event) => update({ specificationCode: event.target.value })} placeholder="For example: 8463, 4MA1, 0625" className={fieldClass} />
      </label>

      {needsClarification && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">You can continue, but this request will be marked for clarification before an exact curriculum-aligned plan is generated.</p>}
    </div>
  );
}
