import fs from 'node:fs/promises';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const ROOT = '/Users/piumalmahawasala/Documents/Codex/sciencedojo-web-app';
const OUT = `${ROOT}/deliverables/sciencedojo_triathlon_pack/ScienceDojo_Pitch_Deck.pptx`;
const RENDER = `${ROOT}/tmp/artifacts_sciencedojo/deck_render`;

const C = {
  navy: '#11243E',
  blue: '#3973E6',
  cyan: '#2FC4C9',
  ink: '#182233',
  muted: '#637086',
  pale: '#EEF4FF',
  paleCyan: '#EAFBFB',
  panel: '#F3F5F8',
  line: '#C8D3E2',
  white: '#FFFFFF',
  black: '#000000',
};

const FONT = 'Helvetica Neue';
const pres = Presentation.create({ slideSize: { width: 1280, height: 720 } });

async function imageBytes(path) {
  const bytes = await fs.readFile(path);
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

const educationBg = await imageBytes(`${ROOT}/public/images/education-bg-minimal.png`);
const tutorStudent = await imageBytes(`${ROOT}/public/images/hero-tutor-student.png`);
const cosmicNebula = await imageBytes(`${ROOT}/public/images/cosmic-nebula.png`);

function addText(slide, text, position, style = {}, name = 'text') {
  const shape = slide.shapes.add({
    geometry: 'textbox',
    name,
    position,
    fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: style.fontSize ?? 18,
    typeface: FONT,
    color: style.color ?? C.ink,
    bold: style.bold ?? false,
    alignment: style.alignment ?? 'left',
    verticalAlignment: style.verticalAlignment ?? 'top',
    autoFit: style.autoFit ?? 'shrinkText',
    wrap: 'square',
    lineSpacing: style.lineSpacing ?? 1.0,
    insets: style.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function addRichText(slide, paragraphs, position, style = {}, name = 'rich-text') {
  const shape = slide.shapes.add({
    geometry: 'textbox',
    name,
    position,
    fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text.set(paragraphs);
  shape.text.style = {
    fontSize: style.fontSize ?? 18,
    typeface: FONT,
    color: style.color ?? C.ink,
    autoFit: style.autoFit ?? 'shrinkText',
    wrap: 'square',
    lineSpacing: style.lineSpacing ?? 1.05,
    insets: style.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function addRect(slide, position, fill, line = 'none', name = 'panel') {
  return slide.shapes.add({
    geometry: 'rect',
    name,
    position,
    fill,
    line: line === 'none' ? { style: 'solid', fill: 'none', width: 0 } : { style: 'solid', fill: line, width: 1 },
  });
}

function addRule(slide, left, top, width, color = C.blue, height = 4) {
  return addRect(slide, { left, top, width, height }, color, 'none', 'accent-rule');
}

function addSlideTitle(slide, title, number, eyebrow = 'SCIENCEDOJO') {
  addText(slide, eyebrow, { left: 56, top: 34, width: 500, height: 22 }, { fontSize: 13, bold: true, color: C.blue }, 'eyebrow');
  addText(slide, title, { left: 56, top: 72, width: 1130, height: 110 }, { fontSize: 35, bold: true, color: C.navy, autoFit: 'none', lineSpacing: 0.95 }, 'slide-title');
  addRule(slide, 56, 186, 72, C.cyan, 5);
  addText(slide, String(number).padStart(2, '0'), { left: 1170, top: 666, width: 54, height: 18 }, { fontSize: 13, color: C.muted, alignment: 'right' }, 'slide-number');
}

function addNotes(slide, sources, note = '') {
  const sourceBlock = sources.map((s) => `- ${s}`).join('\n');
  slide.speakerNotes.textFrame.setText(`${note}${note ? '\n\n' : ''}[Sources]\n${sourceBlock}`);
}

function addLabelBody(slide, label, body, x, y, w, h, fill = null) {
  if (fill) addRect(slide, { left: x, top: y, width: w, height: h }, fill, C.line, `${label}-panel`);
  addText(slide, label, { left: x + (fill ? 20 : 0), top: y + (fill ? 18 : 0), width: w - (fill ? 40 : 0), height: 30 }, { fontSize: 24, bold: true, color: C.navy }, `${label}-label`);
  addText(slide, body, { left: x + (fill ? 20 : 0), top: y + (fill ? 62 : 46), width: w - (fill ? 40 : 0), height: h - (fill ? 78 : 52) }, { fontSize: 18, color: C.ink, lineSpacing: 1.12 }, `${label}-body`);
}

// 1 — Cover (Codex Grid slide-08 silhouette)
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addText(s, 'SCIENCEDOJO', { left: 56, top: 48, width: 360, height: 26 }, { fontSize: 14, bold: true, color: C.blue }, 'cover-eyebrow');
  addText(s, 'Human-first STEM tutoring that continues between lessons', { left: 56, top: 148, width: 545, height: 238 }, { fontSize: 54, bold: true, color: C.navy, lineSpacing: 0.92 }, 'cover-title');
  addText(s, 'A structured learning system for students, parents, tutors, and education partners.', { left: 56, top: 420, width: 510, height: 94 }, { fontSize: 24, color: C.muted, lineSpacing: 1.12 }, 'cover-subtitle');
  addRule(s, 56, 552, 110, C.cyan, 6);
  addText(s, 'General pitch deck  |  September 2026', { left: 56, top: 582, width: 440, height: 24 }, { fontSize: 16, color: C.muted }, 'cover-date');
  s.images.add({
    blob: educationBg,
    contentType: 'image/png',
    alt: 'Stylised STEM formulas and scientific symbols on a dark background',
    fit: 'cover',
    geometry: 'roundRect',
    borderRadius: 14,
    position: { left: 650, top: 42, width: 574, height: 596 },
  });
  addNotes(s, [`${ROOT}/public/images/education-bg-minimal.png`]);
}

// 2 — Problem (two-column)
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'Tutoring often stops exactly when learning needs continuity', 2);
  addLabelBody(s, 'The student experience', 'A capable learner may leave a lesson with better understanding, then lose momentum because the next practice step is unclear or disconnected.', 56, 222, 540, 330);
  addLabelBody(s, 'The parent experience', 'Families pay for individual sessions but may still lack a simple answer to three questions: what was covered, what comes next, and whether confidence is improving.', 664, 222, 540, 330);
  addRect(s, { left: 56, top: 584, width: 1148, height: 56 }, C.navy, 'none', 'problem-callout');
  addText(s, 'The gap is not access to another tool. It is an organised learning relationship.', { left: 82, top: 600, width: 1096, height: 28 }, { fontSize: 22, bold: true, color: C.white, alignment: 'center' }, 'problem-callout-text');
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`]);
}

// 3 — Solution with image split
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'ScienceDojo connects the human tutor to a structured learning loop', 3);
  addRichText(s, [
    { runs: [{ run: '1  Assess', textStyle: { bold: true, color: C.blue } }, ' the learner and identify the right starting point.'], spaceAfter: 16 },
    { runs: [{ run: '2  Teach', textStyle: { bold: true, color: C.blue } }, ' through verified, relationship-led STEM tutoring.'], spaceAfter: 16 },
    { runs: [{ run: '3  Continue', textStyle: { bold: true, color: C.blue } }, ' with lesson notes, homework, messaging, and personalised Missions.'], spaceAfter: 16 },
    { runs: [{ run: '4  Show progress', textStyle: { bold: true, color: C.blue } }, ' so students and parents know the next step.'] },
  ], { left: 56, top: 224, width: 540, height: 352 }, { fontSize: 21, lineSpacing: 1.1 }, 'solution-loop');
  s.images.add({
    blob: tutorStudent,
    contentType: 'image/png',
    alt: 'Tutor supporting a student with science learning',
    fit: 'cover',
    geometry: 'roundRect',
    borderRadius: 14,
    position: { left: 664, top: 210, width: 540, height: 410 },
  });
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`, `${ROOT}/public/images/hero-tutor-student.png`]);
}

// 4 — Learning workflow (process)
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'One journey links discovery, delivery, and follow-through', 4);
  const labels = [
    ['01', 'Free assessment', 'Understand needs and route the learner.'],
    ['02', 'Tutor match', 'Select, book, and confirm the right support.'],
    ['03', 'Live lesson', 'Teach with class tools and structured records.'],
    ['04', 'Between lessons', 'Homework, Practice Dojo, and Missions.'],
    ['05', 'Visible progress', 'Tutor feedback, parent clarity, and the next step.'],
  ];
  const start = 56, gap = 18, w = 216;
  labels.forEach((item, i) => {
    const x = start + i * (w + gap);
    addText(s, item[0], { left: x, top: 230, width: w, height: 36 }, { fontSize: 24, bold: true, color: C.cyan }, `step-${i + 1}-number`);
    addText(s, item[1], { left: x, top: 284, width: w, height: 68 }, { fontSize: 24, bold: true, color: C.navy }, `step-${i + 1}-title`);
    addRule(s, x, 370, 48, C.blue, 4);
    addText(s, item[2], { left: x, top: 398, width: w, height: 120 }, { fontSize: 17, color: C.ink, lineSpacing: 1.1 }, `step-${i + 1}-body`);
  });
  addText(s, 'Every completed lesson creates context for the next learning action.', { left: 56, top: 572, width: 1148, height: 44 }, { fontSize: 24, bold: true, color: C.blue, alignment: 'center' }, 'workflow-callout');
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`]);
}

// 5 — Product evidence (three columns)
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'The product foundation is already broader than a booking marketplace', 5);
  addLabelBody(s, 'Learning', 'Class spaces\nLesson notes and homework\nProgress views\nPractice Dojo\nPersonalised Missions', 56, 230, 340, 330, C.paleCyan);
  addLabelBody(s, 'Operations', 'Tutor onboarding and verification\nAvailability and recurring bookings\nPayments and payouts\nReviews and disputes\nSafeguarding workflows', 470, 230, 340, 330, C.pale);
  addLabelBody(s, 'Experience', 'Student, parent, tutor, and admin dashboards\nMessaging and announcements\nLive classroom and whiteboard\nSupport and guided onboarding', 884, 230, 320, 330, C.panel);
  addText(s, 'Repository evidence describes implemented product surfaces; live usage and production behaviour still require validation.', { left: 56, top: 590, width: 1148, height: 34 }, { fontSize: 15, color: C.muted, alignment: 'center' }, 'evidence-caveat');
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`], 'This slide describes product capabilities observed in the repository, not traction or live-production usage.');
}

// 6 — Business model
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'Tutoring drives the core model; software expands lifetime value', 6);
  addLabelBody(s, 'Core: tutoring', 'Commission on completed tutoring bookings. The current platform setting defaults to 25%, with tutors setting their hourly rates.', 56, 226, 350, 334, C.pale);
  addLabelBody(s, 'Adjacent: FocusDojo', 'Free and included access support acquisition and retention. FocusDojo Pro is listed at €4.99/month or €39/year.', 465, 226, 350, 334, C.paleCyan);
  addLabelBody(s, 'Future: partnerships', 'Potential school, university, or regional programme pilots can package tutoring, structured practice, and measurable support.', 874, 226, 330, 334, C.panel);
  addText(s, 'Commercial principle: keep the trusted tutor relationship central and layer recurring software revenue around it.', { left: 84, top: 592, width: 1092, height: 34 }, { fontSize: 20, bold: true, color: C.navy, alignment: 'center' }, 'business-principle');
  addNotes(s, [`${ROOT}/sql/012_platform_settings.sql`, `${ROOT}/app/focus-dojo/pricing/page.tsx`, `${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`]);
}

// 7 — Go-to-market
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'A focused entry strategy turns trust into repeat learning relationships', 7);
  addLabelBody(s, 'Acquire', 'SEO learning content, free assessments, tutor referrals, Practice Dojo, and community entry points.', 56, 222, 540, 156);
  addLabelBody(s, 'Convert', 'Route a clear learning need into the first paid lesson with the right verified tutor.', 664, 222, 540, 156);
  addLabelBody(s, 'Retain', 'Use recurring bookings, lesson continuity, Missions, and parent visibility to sustain momentum.', 56, 430, 540, 156);
  addLabelBody(s, 'Partner', 'Test university and regional channels that can supply tutors, pilot learners, and institutional credibility.', 664, 430, 540, 156);
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`]);
}

// 8 — Moat with image field
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'The moat is the connected learning record around a trusted tutor', 8);
  addRichText(s, [
    { runs: [{ run: 'Relationship context', textStyle: { bold: true, color: C.navy } }, '\nTutor knowledge accumulates across sessions instead of resetting.'], spaceAfter: 18 },
    { runs: [{ run: 'Structured learning data', textStyle: { bold: true, color: C.navy } }, '\nAssessment, lesson, homework, practice, and progress signals can inform the next action.'], spaceAfter: 18 },
    { runs: [{ run: 'Operational trust', textStyle: { bold: true, color: C.navy } }, '\nVerification, safeguarding, payments, and support create a stronger service layer.'], spaceAfter: 18 },
    { runs: [{ run: 'Human-first AI', textStyle: { bold: true, color: C.navy } }, '\nAI supports practice and follow-through without becoming the brand or replacing the tutor.'] },
  ], { left: 56, top: 214, width: 610, height: 402 }, { fontSize: 20, lineSpacing: 1.08 }, 'moat-points');
  s.images.add({
    blob: cosmicNebula,
    contentType: 'image/png',
    alt: 'Abstract blue and teal nebula suggesting a connected learning system',
    fit: 'cover',
    geometry: 'roundRect',
    borderRadius: 14,
    position: { left: 730, top: 214, width: 474, height: 402 },
  });
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`, `${ROOT}/public/images/cosmic-nebula.png`]);
}

// 9 — Validation roadmap
{
  const s = pres.slides.add();
  s.background.fill = C.white;
  addSlideTitle(s, 'Now validate conversion, retention, outcomes, and partner fit', 9);
  const stages = [
    ['NEXT 90 DAYS', 'Instrument the funnel', 'Measure assessment-to-first-lesson conversion, booking completion, and tutor activation.'],
    ['3-6 MONTHS', 'Prove learning continuity', 'Track repeat bookings, homework and Mission completion, and parent-reported confidence.'],
    ['6-12 MONTHS', 'Test a partner channel', 'Run a bounded university or regional pilot with clear learner, tutor, and operational success criteria.'],
  ];
  stages.forEach((st, i) => {
    const x = 56 + i * 391;
    addText(s, st[0], { left: x, top: 238, width: 340, height: 26 }, { fontSize: 14, bold: true, color: C.blue }, `roadmap-${i + 1}-time`);
    addText(s, st[1], { left: x, top: 290, width: 340, height: 76 }, { fontSize: 27, bold: true, color: C.navy }, `roadmap-${i + 1}-title`);
    addRule(s, x, 382, 58, i === 1 ? C.cyan : C.blue, 5);
    addText(s, st[2], { left: x, top: 416, width: 340, height: 144 }, { fontSize: 18, color: C.ink, lineSpacing: 1.12 }, `roadmap-${i + 1}-body`);
  });
  addText(s, 'No traction or outcome figures are claimed until they are measured and verified.', { left: 56, top: 600, width: 1148, height: 28 }, { fontSize: 16, color: C.muted, alignment: 'center' }, 'roadmap-caveat');
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`]);
}

// 10 — Closing ask
{
  const s = pres.slides.add();
  s.background.fill = C.navy;
  addText(s, 'SCIENCEDOJO', { left: 56, top: 48, width: 420, height: 24 }, { fontSize: 14, bold: true, color: C.cyan }, 'closing-eyebrow');
  addText(s, 'Help turn a strong product foundation into a validated learning business', { left: 56, top: 126, width: 1030, height: 150 }, { fontSize: 50, bold: true, color: C.white, lineSpacing: 0.94 }, 'closing-title');
  addRule(s, 56, 314, 110, C.cyan, 6);
  addText(s, 'We are looking for', { left: 56, top: 354, width: 320, height: 32 }, { fontSize: 24, bold: true, color: C.white }, 'closing-label');
  addRichText(s, [
    { bulletCharacter: '•', marginLeft: 24, indent: -12, runs: ['Strategic mentoring on focus, positioning, and validation.'], spaceAfter: 12 },
    { bulletCharacter: '•', marginLeft: 24, indent: -12, runs: ['Access to a bounded pilot environment and honest user feedback.'], spaceAfter: 12 },
    { bulletCharacter: '•', marginLeft: 24, indent: -12, runs: ['Introductions to education, tutoring, and regional ecosystem partners.'] },
  ], { left: 56, top: 406, width: 870, height: 162 }, { fontSize: 22, color: C.white, lineSpacing: 1.08 }, 'closing-asks');
  addText(s, 'Human expertise. Structured continuity. Visible progress.', { left: 56, top: 620, width: 760, height: 34 }, { fontSize: 22, bold: true, color: C.cyan }, 'closing-tagline');
  addText(s, 'science dojo.', { left: 970, top: 584, width: 250, height: 72 }, { fontSize: 34, bold: true, color: C.white, alignment: 'right' }, 'closing-wordmark');
  addNotes(s, [`${ROOT}/SCIENCEDOJO_PRODUCT_REPORT.md`]);
}

await fs.mkdir(RENDER, { recursive: true });
for (const [index, slide] of pres.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, '0')}`;
  const png = await pres.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(`${RENDER}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: 'layout' });
  await fs.writeFile(`${RENDER}/${stem}.layout.json`, await layout.text());
}
const montage = await pres.export({ format: 'webp', montage: true, scale: 1 });
await fs.writeFile(`${RENDER}/deck-montage.webp`, new Uint8Array(await montage.arrayBuffer()));
const pptx = await PresentationFile.exportPptx(pres);
await pptx.save(OUT);
console.log(OUT);
