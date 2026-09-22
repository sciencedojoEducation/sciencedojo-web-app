from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path("/Users/piumalmahawasala/Documents/Codex/sciencedojo-web-app")
OUTPUT = ROOT / "output/pdf/ScienceDojo_Lesson_Plan_Builder_Developer_Guide.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#071B33")
BLUE = colors.HexColor("#1E5AA8")
CYAN = colors.HexColor("#20B8D8")
PALE_BLUE = colors.HexColor("#EEF7FC")
PALE_CYAN = colors.HexColor("#E7F9FC")
INK = colors.HexColor("#14263D")
MUTED = colors.HexColor("#5B6C7F")
LINE = colors.HexColor("#D9E4EE")
AMBER = colors.HexColor("#A46000")
PALE_AMBER = colors.HexColor("#FFF5DB")
GREEN = colors.HexColor("#147D64")
PALE_GREEN = colors.HexColor("#EAF7F2")
WHITE = colors.white


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="DocTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=29, leading=34, textColor=WHITE, alignment=TA_LEFT, spaceAfter=10))
styles.add(ParagraphStyle(name="DocSubtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=18, textColor=colors.HexColor("#C8EAF5"), spaceAfter=18))
styles.add(ParagraphStyle(name="Eyebrow", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=CYAN, spaceAfter=8, uppercase=True))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=21, leading=26, textColor=NAVY, spaceBefore=2, spaceAfter=12))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13.5, leading=18, textColor=BLUE, spaceBefore=12, spaceAfter=7))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14.5, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.8, leading=11, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name="Bulletx", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.2, leading=13.8, textColor=INK, leftIndent=12, firstLineIndent=-8, spaceAfter=4))
styles.add(ParagraphStyle(name="CalloutTitle", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=NAVY, spaceAfter=4))
styles.add(ParagraphStyle(name="CodeX", parent=styles["Code"], fontName="Courier", fontSize=6.8, leading=9.2, textColor=INK, leftIndent=0, rightIndent=0))
styles.add(ParagraphStyle(name="TableHead", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=7.2, leading=9.2, textColor=WHITE))
styles.add(ParagraphStyle(name="TableCell", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.1, leading=9.5, textColor=INK))
styles.add(ParagraphStyle(name="TableCellBold", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=7.1, leading=9.5, textColor=INK))
styles.add(ParagraphStyle(name="Footer", parent=styles["Normal"], fontName="Helvetica", fontSize=7, leading=9, textColor=MUTED))


def p(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def bullet(text):
    return p(f"- {text}", "Bulletx")


def section(number, title, subtitle=None):
    items = [p(f"SECTION {number}", "Eyebrow"), p(title, "H1x")]
    if subtitle:
        items.append(p(subtitle, "Bodyx"))
    return items


def callout(title, body, tone="blue"):
    bg = {"blue": PALE_BLUE, "amber": PALE_AMBER, "green": PALE_GREEN}[tone]
    edge = {"blue": BLUE, "amber": AMBER, "green": GREEN}[tone]
    table = Table([[p(title, "CalloutTitle")], [p(body, "Bodyx")]], colWidths=[166 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.8, edge),
        ("LINEBEFORE", (0, 0), (0, -1), 4, edge),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (0, 0), 9),
        ("BOTTOMPADDING", (0, -1), (0, -1), 8),
    ]))
    return table


def data_table(headers, rows, widths, repeat=1):
    content = [[p(h, "TableHead") for h in headers]]
    for row in rows:
        content.append([p(str(cell), "TableCellBold" if idx == 0 else "TableCell") for idx, cell in enumerate(row)])
    table = Table(content, colWidths=widths, repeatRows=repeat, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F7FAFC")]),
    ]))
    return table


def code_block(text):
    table = Table([[Preformatted(text.strip(), styles["CodeX"])]], colWidths=[166 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F2F5F8")),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return table


def flow_row(number, title, body):
    badge = Table([[p(number, "CalloutTitle")]], colWidths=[11 * mm], rowHeights=[11 * mm])
    badge.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), BLUE), ("TEXTCOLOR", (0, 0), (-1, -1), WHITE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    text = [p(title, "CalloutTitle"), p(body, "Smallx")]
    row = Table([[badge, text]], colWidths=[15 * mm, 151 * mm])
    row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    return row


def page_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(22 * mm, PAGE_H - 16 * mm, PAGE_W - 22 * mm, PAGE_H - 16 * mm)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(BLUE)
    canvas.drawString(22 * mm, PAGE_H - 12 * mm, "SCIENCEDOJO  |  PRODUCT ENGINEERING")
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - 22 * mm, PAGE_H - 12 * mm, "Lesson Plan Builder Developer Guide")
    canvas.line(22 * mm, 15 * mm, PAGE_W - 22 * mm, 15 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(22 * mm, 10.5 * mm, "Internal developer handoff  |  21 September 2026")
    canvas.drawRightString(PAGE_W - 22 * mm, 10.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.circle(PAGE_W - 20 * mm, PAGE_H - 27 * mm, 55 * mm, fill=1, stroke=0)
    canvas.setFillColor(CYAN)
    canvas.circle(PAGE_W - 8 * mm, PAGE_H - 12 * mm, 24 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#0D2D50"))
    canvas.roundRect(18 * mm, 21 * mm, PAGE_W - 36 * mm, 39 * mm, 4 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#8FE6F5"))
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(25 * mm, 48 * mm, "IMPLEMENTATION STATUS")
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(25 * mm, 38 * mm, "Curriculum-aware intake implemented")
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(colors.HexColor("#C8EAF5"))
    canvas.drawString(25 * mm, 29 * mm, "Next component: lesson-plan generation, validation, and tutor review")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=22 * mm,
    rightMargin=22 * mm,
    topMargin=22 * mm,
    bottomMargin=21 * mm,
    title="ScienceDojo Lesson Plan Builder Developer Guide",
    author="ScienceDojo Product Engineering",
    subject="Developer handoff for curriculum-aware lesson plan generation",
)
cover_frame = Frame(22 * mm, 68 * mm, PAGE_W - 44 * mm, PAGE_H - 102 * mm, id="cover", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
body_frame = Frame(22 * mm, 20 * mm, PAGE_W - 44 * mm, PAGE_H - 40 * mm, id="body", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_page),
    PageTemplate(id="Body", frames=[body_frame], onPage=page_header_footer),
])

story = []

# Cover
story += [
    Spacer(1, 35 * mm),
    p("SCIENCEDOJO PRODUCT DOCUMENTATION", "Eyebrow"),
    p("Lesson Plan Builder", "DocTitle"),
    p("How curriculum-aware client intake becomes an accurate, reviewable lesson plan", "DocSubtitle"),
    Spacer(1, 14 * mm),
    p("Developer guide", "DocSubtitle"),
    p("Version 1.0  |  21 September 2026", "DocSubtitle"),
    NextPageTemplate("Body"),
    PageBreak(),
]

# 1
story += section("01", "Purpose and product boundary", "This document explains how the existing intake implementation should feed a separate automatic lesson-plan builder. It is the handoff contract between booking intake and lesson generation.")
story += [
    callout("Core rule", "The generator must consume normalized, server-validated fields. It must not reverse-engineer curriculum, exam board, tier, topic, or learner baseline from the parent's free-text message.", "blue"),
    Spacer(1, 8),
    p("The intake feature is already responsible for collecting and storing the educational facts needed to ground a lesson. The lesson-plan builder is responsible for turning a complete snapshot into a structured plan, validating that output, and presenting it to the assigned tutor for review."),
    p("In scope for the builder", "H2x"),
    bullet("Read the immutable learning-context snapshot stored on a booking."),
    bullet("Resolve curriculum and specification context from stable keys."),
    bullet("Use uploaded materials as private supporting evidence."),
    bullet("Generate a structured lesson plan that fits the booked duration and learner baseline."),
    bullet("Explain which intake fields and source materials influenced the plan."),
    bullet("Require tutor review before the plan is treated as teaching-ready."),
    p("Out of scope", "H2x"),
    bullet("Inferring missing curriculum details with confidence when the intake is marked needs_clarification."),
    bullet("Replacing tutor judgement, safeguarding decisions, assessment diagnosis, or special educational needs assessment."),
    bullet("Publishing or exposing private homework, teacher feedback, assessment papers, or learner data outside the booking participants."),
    Spacer(1, 8),
    callout("Definition of done", "A generator can produce a useful draft without parsing UI labels or free text, and a tutor can see the assumptions, sources, objectives, sequence, checks for understanding, and adaptations before accepting the plan.", "green"),
    PageBreak(),
]

# 2
story += section("02", "Current intake architecture", "One education taxonomy and one controlled selector now serve tutor booking, free assessment, and Practice Dojo.")
story += [
    flow_row("1", "Learner identity and baseline", "Learner profile supplies name, school year or grade, pathway defaults, support preferences, and accommodations."),
    flow_row("2", "Curriculum hierarchy", "Client selects curriculum pathway, stage or qualification, exam board where applicable, subject, subject route, tier, topic, and optional specification code."),
    flow_row("3", "Lesson intent", "Client supplies purpose, desired outcome, confidence, exact difficulty, attainment, assessment context, and longer-term goals."),
    flow_row("4", "Server validation", "Server validates the combination independently of the browser and normalizes it to schemaVersion 2."),
    flow_row("5", "Immutable storage", "The booking receives an immutable learning_context JSON snapshot. Free-assessment leads store the same education selection without creating an account."),
    flow_row("6", "Tutor visibility", "The assigned tutor sees the route, subject, topic, goal, confidence, missing fields, and private materials before accepting."),
    Spacer(1, 8),
    p("Implemented surfaces", "H2x"),
    data_table(
        ["Surface", "Purpose", "Implementation"],
        [
            ("Tutor booking", "Authenticated lesson request plus reusable learner profile", "components/CalendlyBookingWizard.tsx"),
            ("Free assessment", "Accountless lead capture using the same education hierarchy", "app/free-assessment/FreeAssessmentForm.tsx"),
            ("Practice Dojo", "Curriculum-aligned practice selection", "app/ai-practice-studio/QuestionGenerator.tsx"),
            ("Shared selector", "Controlled dependent dropdowns and clarification messaging", "components/EducationPathwayFields.tsx"),
            ("Validation", "Taxonomy, normalization, compatible combinations", "lib/educationTaxonomy.ts"),
            ("Lesson context", "Booking-level contract and conditional intake rules", "lib/lesson-request-intake.ts"),
            ("Database", "Profiles, snapshots, specification registry, private materials", "sql/051_lesson_request_intake.sql"),
        ],
        [31 * mm, 66 * mm, 69 * mm],
    ),
    PageBreak(),
]

# 3
story += section("03", "Education hierarchy and terminology", "The field order prevents the common error of treating an exam board, qualification, curriculum, and tier as the same thing.")
story += [
    data_table(
        ["Field", "Meaning", "Examples"],
        [
            ("Curriculum pathway", "Education system or international programme family", "England, Wales, Northern Ireland, Scotland, Cambridge International, Pearson International, IB"),
            ("Stage or qualification", "The learner's programme or assessed qualification", "KS2, KS3, GCSE, A Level, National 5, IGCSE, IB DP"),
            ("Exam board / awarding body", "Organisation owning the specification and assessment", "AQA, Pearson Edexcel, OCR, Eduqas, WJEC, CCEA"),
            ("Subject", "Broad academic subject", "Mathematics, Physics, English, Geography"),
            ("Subject route", "A distinct course within a subject family", "Combined Science, English Literature, Further Mathematics, IB Mathematics AA"),
            ("Tier / course level", "Course depth or assessment tier when applicable", "Foundation, Higher, Core, Extended, SL, HL"),
            ("Specification", "Versioned syllabus used for retrieval and provenance", "A specification code supplied by the client or a resolved active version ID"),
            ("Topic / subtopic", "Immediate content focus", "Algebra / quadratic factorisation"),
        ],
        [33 * mm, 75 * mm, 58 * mm],
    ),
    Spacer(1, 10),
    callout("Why exam board is conditional", "KS1, KS2, and KS3 follow a curriculum rather than an exam-board specification. Exam board becomes mandatory only for examined routes where the provider affects content, terminology, paper structure, or required practicals.", "amber"),
    p("Supported pathway families", "H2x"),
    bullet("England National Curriculum: KS1, KS2, KS3, GCSE, AS Level, A Level."),
    bullet("Curriculum for Wales: Primary, Secondary, GCSE, AS Level, A Level."),
    bullet("Northern Ireland Curriculum: Foundation, KS1 to KS4, GCSE, AS Level, A Level."),
    bullet("Scotland Curriculum for Excellence: Primary, Broad General Education, National 4, National 5, Higher, Advanced Higher."),
    bullet("Cambridge International: Early Years, Primary Stages 1 to 6, Lower Secondary Stages 7 to 9, IGCSE, O Level, International AS and A Level."),
    bullet("Pearson Edexcel International: iPrimary, iLowerSecondary, International GCSE, International AS and A Level."),
    bullet("International Baccalaureate: PYP, MYP, DP, CP."),
    PageBreak(),
]

# 4
story += section("04", "Normalized input contract", "The generator should depend on stable keys and schema version, never display labels or raw FormData.")
contract = r'''
type EducationSelectionSnapshot = {
  schemaVersion: 2;
  curriculumKey: string | null;
  stage: string | null;
  awardingBodyKey: string | null;
  level: string | null;
  subject: string;
  subjectVariant?: string;
  specificationVersionId: string | null;
  specificationCode?: string;
  topic?: string;
  subtopic?: string;
  intakeStatus: "complete" | "needs_clarification";
  missingFields: string[];
};
'''
story += [
    code_block(contract),
    Spacer(1, 8),
    p("The booking's LessonRequestLearningContext adds learner and lesson fields", "H2x"),
    bullet("learnerId, learnerName, schoolYear"),
    bullet("lessonPurpose, lessonGoal, confidence, difficultyDetails"),
    bullet("currentAttainment, targetAttainment, assessmentDate, assessmentDetails"),
    bullet("homeworkInstructions, recentScore, teacherFeedback, lostMarksOn"),
    bullet("longerTermGoal, priorityTopics, importantDeadline"),
    bullet("supportPreferences, accommodations, previousApproaches, additionalContext"),
    bullet("materialIds, intakeStatus, missingFields"),
    p("Compatibility behavior", "H2x"),
    bullet("Existing booking description remains available and is copied to additionalContext."),
    bullet("Legacy assessment-lead curriculum and subject columns remain human-readable summaries."),
    bullet("New generator code should check schemaVersion before reading v2-specific properties."),
    bullet("Existing bookings without learning_context should remain visible but are not automatically plan-ready."),
    callout("Generator entry condition", "Only generate automatically when learning_context exists and intakeStatus is complete. A needs_clarification request should create a clarification task, not an invented curriculum assumption.", "green"),
    PageBreak(),
]

# 5
story += section("05", "How each input improves the lesson plan", "Every collected value should have an explicit generation purpose. Unused data should not be collected.")
rows = [
    ("School year / grade", "Controls language, examples, cognitive load, and safeguarding-appropriate presentation.", "Age mismatch and unsuitable explanations."),
    ("Curriculum pathway", "Selects the education system, terminology, progression model, and expected prior knowledge.", "Mixing national and international curricula."),
    ("Stage / qualification", "Sets expected depth, assessment style, and prerequisite range.", "Teaching GCSE depth to KS3 or vice versa."),
    ("Awarding body", "Targets provider-specific specification structure and assessment language.", "Using the wrong content coverage or paper conventions."),
    ("Subject route", "Distinguishes courses that share a broad subject name.", "Confusing Language with Literature, or Combined with Separate Science."),
    ("Tier / level", "Sets ceiling, complexity, and question style.", "Higher-tier content in a Foundation session, or SL/HL mismatch."),
    ("Specification version", "Anchors retrieval to the active syllabus and supports provenance.", "Outdated or silently guessed curriculum content."),
    ("Topic / subtopic", "Defines the content boundary for objectives and activity sequence.", "Generic lesson plans."),
    ("Lesson purpose", "Selects the lesson pattern: teach, catch up, review, revise, assess, or stretch.", "A revision lesson structured like first teaching."),
    ("Desired outcome", "Becomes the measurable success criterion.", "Activities without a clear end state."),
    ("Confidence", "Controls scaffolding, pacing, and amount of guided practice.", "Overwhelming or under-challenging the learner."),
    ("Difficulty details", "Targets the precise misconception or blocked step.", "Repeating content the learner already understands."),
    ("Current / target attainment", "Calibrates challenge and progression steps.", "Unrealistic or weak difficulty selection."),
    ("Assessment date", "Controls urgency, consolidation, and exam-series specification resolution.", "Poor pacing before a deadline."),
    ("Support preferences", "Adapts explanations, checks, visuals, pace, and practice style.", "A plan that is technically correct but unusable for the learner."),
    ("Materials", "Provides the actual question, feedback, worksheet, or syllabus evidence.", "Hallucinating what the assignment or feedback says."),
    ("Additional context", "Adds useful nuance after structured fields are fixed.", "Free text overriding validated facts."),
]
story += [data_table(["Input", "Use in generation", "Risk prevented"], rows, [34 * mm, 75 * mm, 57 * mm]), PageBreak()]

# 6
story += section("06", "Generation pipeline", "Recommended server-side sequence for the lesson-plan builder.")
pipeline = [
    ("1", "Load and authorize", "Fetch the booking, confirm requester or assigned tutor access, and reject unrelated users."),
    ("2", "Check readiness", "Require schemaVersion 2 and intakeStatus complete. Return explicit missingFields otherwise."),
    ("3", "Resolve specification", "Use specificationVersionId and optional specificationCode to load the active curriculum record and trusted source references."),
    ("4", "Retrieve materials", "Read only materialIds attached to the booking. Extract text from PDFs/images in a private processing context."),
    ("5", "Build evidence packet", "Combine normalized facts, specification context, material excerpts, booked duration, and lesson purpose. Keep structured fields authoritative."),
    ("6", "Generate structured JSON", "Ask the local LLM for the lesson-plan output contract, not prose-only text."),
    ("7", "Validate output", "Check schema, duration totals, objective alignment, age suitability, source references, and prohibited assumptions."),
    ("8", "Persist draft and provenance", "Save input snapshot ID/hash, model version, prompt version, source IDs, validation result, and generated plan."),
    ("9", "Tutor review", "Allow tutor edit, approve, regenerate with feedback, or request clarification. Record final approval."),
]
story += [flow_row(*item) for item in pipeline]
story += [
    Spacer(1, 6),
    callout("Precedence rule", "Structured snapshot > verified specification source > uploaded learner material > additionalContext. Never let a free-text note silently replace a validated curriculum key or exam board.", "blue"),
    PageBreak(),
]

# 7
story += section("07", "Recommended lesson-plan output contract", "A structured output makes plans editable, testable, and usable by the tutor dashboard.")
plan_contract = r'''
type GeneratedLessonPlan = {
  schemaVersion: 1;
  bookingId: string;
  status: "draft" | "needs_review" | "approved";
  title: string;
  curriculumAlignment: {
    specificationVersionId: string;
    specificationCode?: string;
    objectives: string[];
    sourceIds: string[];
  };
  learnerSummary: {
    startingPoint: string;
    misconceptionFocus: string[];
    adaptations: string[];
  };
  successCriteria: string[];
  requiredMaterials: string[];
  lessonSequence: Array<{
    phase: "diagnostic" | "explain" | "model" | "guided" |
      "independent" | "assess" | "review";
    minutes: number;
    tutorActions: string[];
    learnerActions: string[];
    checksForUnderstanding: string[];
  }>;
  differentiation: {
    support: string[];
    stretch: string[];
  };
  exitCheck: string[];
  followUp?: string[];
  assumptions: string[];
  warnings: string[];
  provenance: {
    intakeSchemaVersion: 2;
    promptVersion: string;
    modelVersion: string;
    generatedAt: string;
  };
};
'''
story += [
    code_block(plan_contract),
    Spacer(1, 8),
    p("Hard validation rules", "H2x"),
    bullet("Sum of lessonSequence.minutes must equal the booked duration."),
    bullet("Every success criterion must be observable during the lesson."),
    bullet("At least one diagnostic check and one exit check are required."),
    bullet("The plan must address difficultyDetails directly."),
    bullet("Any accommodation or support preference must appear as a concrete adaptation, not a label."),
    bullet("Claims tied to uploaded material or a specification must identify a sourceId."),
    bullet("Warnings must expose unresolved assumptions; hidden assumptions are validation failures."),
    PageBreak(),
]

# 8
story += section("08", "Prompt and retrieval assembly", "Keep the prompt modular so curriculum data, learner data, and lesson method can evolve independently.")
story += [
    p("Recommended prompt blocks", "H2x"),
    data_table(
        ["Block", "Contents", "Authority"],
        [
            ("System policy", "Role, output schema, safety, no-invention rule", "Highest"),
            ("Education route", "Pathway, qualification, board, route, tier, specification", "Validated snapshot"),
            ("Learner baseline", "Year, confidence, attainment, difficulty, accommodations", "Validated snapshot"),
            ("Lesson request", "Purpose, goal, topic, duration, recurrence, deadline", "Booking snapshot"),
            ("Curriculum evidence", "Retrieved objectives and specification excerpts", "Trusted registry/source"),
            ("Learner materials", "Homework, feedback, assessment excerpts", "Private uploaded evidence"),
            ("Additional context", "Parent/student free-text note", "Supplementary only"),
            ("Output instruction", "GeneratedLessonPlan JSON schema and validation constraints", "Required"),
        ],
        [33 * mm, 83 * mm, 50 * mm],
    ),
    Spacer(1, 10),
    p("Retrieval behavior", "H2x"),
    bullet("Query curriculum sources using stable keys, not display text."),
    bullet("Filter by specificationVersionId first; use specificationCode as a stronger discriminator when supplied."),
    bullet("Chunk source documents by section and retain page/section provenance."),
    bullet("Retrieve only the selected topic plus prerequisites needed for the learner's stage."),
    bullet("Do not blend objectives from another awarding body merely because the topic name matches."),
    bullet("Treat uploaded exam questions as learner-provided material, not as permission to reproduce copyrighted papers broadly."),
    callout("Local LLM guidance", "The model should receive a compact evidence packet with explicit labels and stable keys. Avoid passing the full booking database row or unrelated learner history.", "amber"),
    PageBreak(),
]

# 9
story += section("09", "Clarification and failure modes", "The product should fail usefully when the inputs cannot support an exact plan.")
story += [
    data_table(
        ["Condition", "System behavior", "User-facing result"],
        [
            ("intakeStatus = needs_clarification", "Do not call the generator", "Show missing fields and request clarification"),
            ("No learning_context", "Treat as legacy booking", "Tutor can use description; offer structured intake upgrade"),
            ("Invalid combination", "Reject server-side", "Explain which selection conflicts"),
            ("Specification unresolved", "Do not guess provider/version", "Ask for code, board, or exam year"),
            ("Material unreadable", "Continue only if material is non-essential", "Warn tutor and identify failed file"),
            ("Homework request without useful text/file", "Reject as incomplete", "Request assignment instructions or upload"),
            ("LLM output fails schema", "Retry once with validation feedback", "If still invalid, record failure for tutor"),
            ("Sequence duration mismatch", "Reject generated output", "Regenerate with exact remaining minutes"),
            ("Unsupported subject/specification", "Mark clarification or manual mode", "Do not label the output curriculum-aligned"),
        ],
        [44 * mm, 66 * mm, 56 * mm],
    ),
    Spacer(1, 10),
    p("Clarification questions should be specific", "H2x"),
    bullet("Good: 'Is this OCR GCSE Physics, and is the learner studying Higher tier?'"),
    bullet("Good: 'Which question numbers from the homework should the lesson cover?'"),
    bullet("Bad: 'Please provide more details.'"),
    bullet("Bad: asking the client for an internal specification version identifier."),
    PageBreak(),
]

# 10
story += section("10", "Privacy, access, and safety", "Learner context and uploaded materials are private educational records and must remain scoped to the booking.")
story += [
    p("Access model", "H2x"),
    bullet("Requester can view their own learner profiles, booking context, and uploaded materials."),
    bullet("Only the assigned tutor can view lesson-request materials for that booking."),
    bullet("Authorized admins can access records for support and safeguarding operations."),
    bullet("Unrelated tutors and users must receive no metadata, filenames, signed URLs, extracted text, or generated plan content."),
    p("Generation controls", "H2x"),
    bullet("Run authorization before loading any material or generating a plan."),
    bullet("Use short-lived access to private objects; do not make the storage bucket public."),
    bullet("Do not place learner names, diagnoses, contact details, or raw files in logs."),
    bullet("Persist model input hashes and source IDs rather than unnecessary duplicate raw text."),
    bullet("Allow admins to trace which booking, prompt version, model version, and sources produced a plan."),
    bullet("Tutor approval is mandatory before a generated draft is shown as final teaching content."),
    Spacer(1, 8),
    callout("Accommodation wording", "Collect teaching-relevant accommodations without requiring a diagnosis. Generate concrete delivery adaptations, but never infer a medical or learning diagnosis from behavior or parent notes.", "amber"),
    PageBreak(),
]

# 11
story += section("11", "Implementation sequence for the generator developer", "Build the next component without changing the intake contract.")
story += [
    p("Phase 1 - Contracts and readiness", "H2x"),
    bullet("Import LessonRequestLearningContext and EducationSelectionSnapshot from the existing libraries."),
    bullet("Add a readiness function returning ready, needs_clarification, legacy, or unsupported."),
    bullet("Define and test GeneratedLessonPlan plus runtime validation."),
    p("Phase 2 - Specification and material retrieval", "H2x"),
    bullet("Create a specification repository keyed by specificationVersionId and optional specificationCode."),
    bullet("Add private material extraction with source IDs and page/section metadata."),
    bullet("Build the compact evidence packet and precedence rules."),
    p("Phase 3 - Generation and validation", "H2x"),
    bullet("Version the system prompt and model configuration."),
    bullet("Generate JSON, validate it, and retry once using validation feedback."),
    bullet("Store draft, provenance, warnings, validation results, and input snapshot reference."),
    p("Phase 4 - Tutor workflow", "H2x"),
    bullet("Show plan draft next to the original learning brief and materials."),
    bullet("Support edit, approve, regenerate with feedback, and request clarification."),
    bullet("Keep an audit trail of generated and tutor-edited versions."),
    p("Phase 5 - Controlled release", "H2x"),
    bullet("Start behind a feature flag with internal/admin and selected tutors."),
    bullet("Measure readiness rate, clarification rate, generation failure rate, tutor edits, and approval time."),
    bullet("Do not auto-send plans to parents or students during the initial release."),
    PageBreak(),
]

# 12
story += section("12", "Test and acceptance matrix", "Tests should demonstrate educational correctness, data integrity, and safe failure behavior.")
test_rows = [
    ("Taxonomy", "Every pathway exposes only compatible stages, boards, subjects, variants, and tiers."),
    ("Non-exam route", "KS1 to KS3 submits without an exam board."),
    ("Exam route", "GCSE/A Level requires or derives a compatible awarding body."),
    ("Provider identity", "Cambridge International can never validate as OCR."),
    ("Unknown values", "Not sure produces needs_clarification with explicit missingFields."),
    ("Direct action", "Server rejects malformed combinations even when UI checks are bypassed."),
    ("Specification", "Assessment year affects version resolution and ambiguity never silently resolves."),
    ("Legacy", "Old descriptions and leads still render without a v2 context."),
    ("Privacy", "Unrelated tutor cannot access material, extracted text, or plan."),
    ("Output schema", "Invalid phase, missing objective, or malformed provenance is rejected."),
    ("Duration", "Activity minutes equal the booked lesson duration."),
    ("Goal alignment", "Success criteria and exit check reflect lessonGoal and difficultyDetails."),
    ("Adaptation", "Preferences and accommodations become observable teaching actions."),
    ("Failure", "Generator does not run for needs_clarification or unresolved specification."),
    ("Audit", "Stored draft records prompt, model, source, and intake schema versions."),
]
story += [
    data_table(["Area", "Acceptance check"], test_rows, [42 * mm, 124 * mm]),
    Spacer(1, 10),
    callout("Existing verification", "The current intake implementation passes TypeScript checks, the automated test suite, targeted lint, a production build, and a public free-assessment smoke test. Generator work should preserve those checks.", "green"),
    PageBreak(),
]

# 13
story += section("13", "Deployment and handoff checklist", "The generator should not be enabled until storage and access controls are in place.")
story += [
    p("Before deploying the intake schema", "H2x"),
    bullet("Apply sql/051_lesson_request_intake.sql in Supabase."),
    bullet("Confirm curriculum_specifications, learner_profiles, booking learning_context, assessment lead learning_context, and lesson_request_materials exist."),
    bullet("Verify the lesson-request-materials bucket is private and RLS policies work for requester, assigned tutor, and admin."),
    bullet("Verify immutable snapshot triggers do not block unrelated booking or lead status updates."),
    p("Before enabling generation", "H2x"),
    bullet("Backfill or intentionally classify legacy bookings without learning_context."),
    bullet("Populate trusted specification records and source URLs for supported subjects."),
    bullet("Choose the local model, context limit, prompt version, retry policy, and timeout."),
    bullet("Create the generated-plan persistence model and access policies."),
    bullet("Add monitoring for clarification, failures, latency, token use, and tutor edits."),
    bullet("Complete privacy and safeguarding review for uploaded material extraction."),
    p("Developer handoff rule", "H2x"),
    callout("Do not change the intake contract casually", "If the generator needs another field, add it through a versioned contract change, update both forms and server validation, migrate storage, and retain compatibility readers. Do not start parsing additionalContext as a substitute.", "blue"),
    PageBreak(),
]

# 14
story += section("14", "References", "Authoritative curriculum references and implementation sources used by the intake architecture.")
story += [
    p("External curriculum references", "H2x"),
    bullet("Ofqual guide for schools and colleges: https://www.gov.uk/government/publications/ofqual-guide-for-schools-and-colleges-2026/ofqual-guide-for-schools-and-colleges-2026"),
    bullet("England National Curriculum: https://www.gov.uk/national-curriculum"),
    bullet("Curriculum for Wales: https://hwb.gov.wales/curriculum-for-wales"),
    bullet("Northern Ireland statutory curriculum: https://www.education-ni.gov.uk/articles/statutory-curriculum"),
    bullet("Qualifications Scotland: https://qualifications.gov.scot/"),
    bullet("Cambridge programmes and qualifications: https://www.cambridgeinternational.org/programmes-and-qualifications/"),
    bullet("Pearson international qualifications: https://qualifications.pearson.com/"),
    bullet("International Baccalaureate programmes: https://ibo.org/programmes/"),
    p("Repository sources", "H2x"),
    bullet("components/EducationPathwayFields.tsx"),
    bullet("lib/educationTaxonomy.ts"),
    bullet("lib/lesson-request-intake.ts"),
    bullet("components/CalendlyBookingWizard.tsx"),
    bullet("app/free-assessment/FreeAssessmentForm.tsx"),
    bullet("app/tutor/actions.ts and app/free-assessment/actions.ts"),
    bullet("sql/051_lesson_request_intake.sql"),
    bullet("tests/education-taxonomy.test.mjs"),
    Spacer(1, 14),
    callout("Document owner", "ScienceDojo Product Engineering. Update this guide whenever the intake schema, specification registry, plan output contract, or tutor approval workflow changes.", "green"),
]

doc.build(story)
print(OUTPUT)
