# ScienceDojo Web App Product & Strategy Report

Generated from static repository inspection of the ScienceDojo Next.js app. This report describes what appears implemented in code, what appears partial or early, and how the product can be positioned strategically. It does not verify live database contents, production configuration, or deployed behavior.

Strategic lens used throughout:

- ScienceDojo is a premium, human-first STEM tutoring system.
- ScienceDojo is not a generic tutor marketplace.
- ScienceDojo is not an AI-first brand.
- Practice Dojo is a public/open practice tool.
- Missions are premium personalized learning journeys for enrolled students.
- AI should be positioned as learning infrastructure, not the main identity.
- The strongest emotional promise is: "Your child understands more than their grades show."

## 1. Executive Summary

ScienceDojo currently appears to be a substantial tutoring web app, not just a marketing site. The codebase includes a public premium tutoring website, tutor discovery and booking, Supabase authentication, student/parent/tutor/admin dashboards, lesson records, class spaces, messaging, payments, reviews, tutor onboarding, safety operations, Practice Dojo, and a class-linked Missions system.

The current app supports these main user types:

| User type | Current role in product |
| --- | --- |
| Public visitor | Reads marketing pages, explores tutors, tries Practice Dojo, requests a free assessment. |
| Student | Manages lessons, classes, homework, missions, messages, and practice. |
| Parent | Views bookings, child support, progress, homework, payments, and tutor discovery. |
| Tutor | Manages profile, availability, booking requests, sessions, lesson notes, students, earnings, and onboarding. |
| Admin | Manages users, tutors, leads, bookings, disputes, payouts, safeguards, announcements, and platform settings. |

The most strategically valuable system is the loop between tutoring, class records, homework, progress, and Missions. If refined and positioned well, this becomes a strong moat: ScienceDojo does not only match a student with a tutor; it turns tutoring into a structured learning system.

Practice Dojo is valuable as a public discovery and diagnostic tool. It can help students test what they know before committing to tutoring. However, it should remain secondary in brand hierarchy. It should lead users toward assessment and tutoring, not make ScienceDojo feel like an AI-question app.

The biggest strategic gaps are clarity and packaging. Many strong features exist in code, but the product story should more clearly distinguish:

- Practice Dojo: open practice and knowledge checks.
- Missions: personalized premium learning journeys for enrolled students.
- Class spaces: the operating system for tutoring continuity.
- Parent visibility: reassurance, clarity, and trust.

## 2. Current System Architecture

### Tech Stack

| Area | Observed implementation |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI runtime | React 19 |
| Styling | Tailwind CSS v4 with global CSS utilities |
| Database/auth | Supabase SSR and Supabase JS |
| Payments | Stripe Checkout, Stripe Connect, webhooks, payouts |
| Email | Resend |
| AI | Google Gemini via `@google/generative-ai` |
| Charts | Recharts |
| Motion | Framer Motion |
| Tours/onboarding | React Joyride |
| Whiteboard | tldraw |
| Live classroom | Jitsi class call route, plus Zoom SDK/proxy components present |

### Routing Structure

The app uses the Next.js App Router with public, dashboard, API, auth, and SEO route groups.

Key public routes include:

- `/` homepage
- `/learning-hub`
- `/learning-hub/[slug]`
- SEO pages under `app/(seo)/[slug]`
- `/free-assessment`
- `/tutor/[id]`
- `/tutor/[id]/book`
- `/ai-practice-studio`
- `/safeguarding`
- `/how-we-verify`
- `/classroom-guide`
- `/support`
- `/contact`
- `/privacy`
- `/terms`
- `/code-of-conduct`

Key dashboard routes include:

- `/dashboard/student`
- `/dashboard/parent`
- `/dashboard/tutor`
- `/dashboard/admin`
- `/dashboard/classes`
- `/dashboard/classes/[id]`
- `/dashboard/classes/[id]/call`
- `/dashboard/classes/[id]/missions`
- `/dashboard/messages`
- `/dashboard/support`
- `/dashboard/student/missions`
- `/dashboard/student/tutors`
- `/dashboard/tutor/settings`
- `/dashboard/tutor/earnings`
- `/dashboard/admin/tutors`
- `/dashboard/admin/users`
- `/dashboard/admin/bookings`
- `/dashboard/admin/leads`
- `/dashboard/admin/payouts`
- `/dashboard/admin/disputes`
- `/dashboard/admin/safeguards`
- `/dashboard/admin/settings`
- `/dashboard/admin/broadcast`

### Backend and API Structure

The backend is mainly built with:

- Supabase database queries and server actions.
- Next.js API routes for payments, reviews, calendar feeds, Stripe Connect, Stripe webhooks, and Zoom proxying.
- Server actions for bookings, lessons, tutor updates, class posts, messages, support, leads, and Missions.

Notable API areas:

- `api/checkout_sessions`
- `api/webhooks/stripe`
- `api/stripe/connect`
- `api/stripe/connect/callback`
- `api/reviews`
- `api/calendar`
- `api/zoom-proxy/[...path]`

### Database and Schema

The repository contains many SQL migrations. Visible schema areas include:

- Profiles and tutors
- Bookings and recurring bookings
- Tutor availability
- Lesson notes
- Reviews
- Platform settings
- API keys and integrations
- Messages and conversations
- Disputes
- Announcements
- Stripe Connect and payouts
- Tutor credentials and applications
- Classes, posts, comments, homework
- Jitsi video provider support
- Student missions
- Assessment leads

This is a fairly broad operational schema for a tutoring platform.

### Authentication System

Authentication uses Supabase. The codebase includes:

- Login/signup/reset flows.
- Auth callback route.
- Role-based dashboard behavior.
- Profile records with roles such as student, parent, tutor, and admin.
- Tutor application/onboarding status.

### Important Components

Important components and services observed include:

- `Navbar`, `Footer`
- `TutorCard`, `SearchFilterBar`
- `BookingWizard`, `CheckoutButton`
- `ClassFeed`, `ClassPostComposer`, `ClassCommentThread`
- `HomeworkFeed`
- `StudentProgressStats`, `StudentProgressChart`
- `TutorAvailabilityCalendar`, `TutorSchedule`
- `DojoWhiteboard`
- `ZoomClassroom`
- `MessageTutorButton`, `InquiryModal`
- `ReviewModal`, `DisputeModal`
- `DashboardSidebar`, `DashboardGuidedTour`
- `AnnouncementFeed`
- `Testimonials`
- `SupportInfoPage`
- Analytics and CTA tracking utilities

## 3. User Roles & Permissions

### Public Visitor

Public visitors can:

- View the homepage and marketing pages.
- Read Learning Hub and SEO pages.
- Explore tutor profile pages.
- Submit a free assessment lead form.
- Access Practice Dojo.
- Start tutor discovery and booking flows.

Strategic interpretation: public users are being led through two possible conversion paths: book a free learning assessment or find/try a tutor directly.

### Student

Students can access:

- Student dashboard.
- Bookings and sessions.
- Confirmed classes.
- Class spaces.
- Homework/feed items.
- Messages.
- Missions.
- Practice-related pages.
- Tutor discovery.

Students appear to receive:

- Lesson history.
- Homework.
- Progress stats.
- Class-linked mission history.
- Access to live classroom sessions.

Strategic interpretation: the student product is strongest when it feels like a guided learning environment, not just an appointment dashboard.

### Parent

Parents can access:

- Parent dashboard.
- Bookings and payments.
- Child learning visibility in dashboard cards.
- Homework/progress summaries where available.
- Tutor discovery.
- Settings/support areas.

Parent experience is present, but the parent-child relationship model should be reviewed carefully. The code suggests parent visibility features, but static inspection cannot prove how fully child account linking works in production.

Strategic interpretation: parents buy reassurance. Parent-facing UX should emphasize clarity, safety, communication, and progress visibility more than product features.

### Tutor

Tutors can access:

- Tutor dashboard.
- Profile editing.
- Availability management.
- Booking requests.
- Upcoming sessions.
- Student roster.
- Lesson completion and lesson notes.
- Class spaces.
- Earnings.
- Settings.
- Onboarding/application/contract flows.

Tutors are central to the app. The code supports them as operators inside a structured learning system, not just marketplace sellers.

Strategic interpretation: this is a strong differentiator. Tutor tools can make ScienceDojo tutors more consistent, accountable, and effective.

### Admin

Admins can access:

- Platform overview/KPIs.
- Tutor review and verification.
- User management.
- Booking management.
- Assessment leads.
- Payouts.
- Disputes.
- Safety/safeguard alerts.
- Platform settings.
- Announcements/broadcasts.

Strategic interpretation: admin tooling is unusually broad for an early tutoring platform. It supports operational control and safety, but may need refinement before scaling.

## 4. Public Website / Marketing Pages

### Current Public Website Areas

The public site includes:

- Homepage.
- Learning Hub.
- SEO landing pages.
- Tutor profile pages.
- Free assessment page.
- Practice Dojo page.
- Support and safety pages.
- Contact/legal pages.

### Homepage Sections

The homepage currently appears to include:

- Hero with premium tutoring promise.
- Practice Dojo section.
- ScienceDojo learning system section.
- Learning method section.
- Parent trust section.
- Support across learning stages.
- Tutor marketplace/discovery section.
- How ScienceDojo works.
- Pricing/flexible learning support.
- Success stories/testimonials.
- FAQ.
- Final CTA.

### Current CTAs

Main CTAs include:

- Book a Free Learning Assessment.
- Try Practice Dojo.
- Find tutors / tutor discovery.
- Log in / sign up.

### Marketing Strengths

- The site has moved toward a premium tutoring-first position.
- Real testimonials and certificate proof add authenticity.
- The support/safety pages strengthen trust.
- Practice Dojo provides an interactive public entry point.
- Tutor marketplace is supported by real tutor profile structures.
- The homepage has a modern visual system and clear premium tone.

### Marketing Weaknesses

- Some sections still risk sounding like a product platform rather than tutoring support.
- Practice Dojo and Missions need clearer strategic separation.
- The homepage should avoid overexplaining features before trust and emotion are established.
- Parent-specific reassurance could be stronger.
- Founder-led credibility is not yet fully expressed in the inspected public pages.

### Does The Website Support "ScienceDojo Builds Science Confidence Systematically"?

Partially. The codebase strongly supports this message through lesson notes, homework, class spaces, progress, and Missions. The website should make this more explicit:

- Confidence is the emotional outcome.
- Tutoring is the core method.
- Structure is the learning system.
- Practice Dojo is the open practice tool.
- Missions are the premium enrolled-student journey.

## 5. Practice Dojo Analysis

### Location

Practice Dojo is publicly located at:

- `/ai-practice-studio`

Older or related routes also exist:

- `/ai-practice-generator`
- `/ai-question-generator`

The public display name should remain Practice Dojo, even if the route remains `/ai-practice-studio`.

### What Users Can Do

Practice Dojo appears to let users:

- Select curriculum/stage/level/subject/topic.
- Generate curriculum-aligned questions.
- Answer practice questions.
- View answers, working, skill labels, and difficulty.

### AI and Fallback Behavior

Question generation uses:

- Google Gemini, specifically `gemini-2.5-flash`.
- Structured JSON response schema.
- Education taxonomy validation.
- Fallback question bank if the API key is missing or generation fails.

### Login Requirement

From code inspection, Practice Dojo appears designed as an open/public tool rather than an enrolled-student-only dashboard feature. Static inspection does not prove production auth behavior, but the route and actions suggest public access.

### Storage and Tracking

The inspected question generation flow appears focused on generating and displaying questions. It does not appear to be the same as Missions, and it does not appear to be the main persistent personalized progress engine.

### Strategic Value

Practice Dojo is valuable as:

- A public trust-building experience.
- A diagnostic entry point.
- A way for students to notice knowledge gaps.
- A bridge toward booking a free assessment.

Recommended positioning:

> Practice Dojo helps students test what they know and spot where they need support.

### What Feels Unfinished

- The route still uses AI-oriented naming.
- It may not yet connect public practice attempts to leads or accounts.
- It should not be marketed as the premium personalized system; that is Missions.
- The page should avoid "AI-first" language.

## 6. Missions System Analysis

### Where Missions Appear

Missions appear in:

- `/dashboard/student/missions`
- `/dashboard/classes/[id]/missions`
- Mission-related actions under class and student dashboard routes.

### How Missions Are Created

The strongest mission generator appears in the class route actions:

- It fetches class context.
- It gathers relevant bookings and lesson notes.
- It uses lesson summaries as context.
- It generates a structured mission blueprint with Gemini.
- It stores the mission in `student_missions`.

### Mission Tiers

The code supports mission tiers such as:

- Daily
- Weekly
- Monthly
- Quarterly
- Annual
- Improvement drill

This is strategically important. It means Missions can become a structured learning journey across different time horizons.

### Mission Structure

The generated mission blueprint includes four stages:

1. Multiple-choice recall.
2. Logic/reasoning.
3. Application/scenario.
4. Error correction or corrupted-data challenge.

This suggests a clear learning philosophy: recall, reasoning, application, and evaluation.

### Mission Evaluation

Mission answers are evaluated by:

- Auto-scoring stage 1.
- Gemini evaluation for later stages.
- Saving student answers, AI evaluation, score percentage, and completion status.

The code includes a status such as `pending_tutor_approval`, which is strategically excellent. However, from static inspection it is unclear how complete the tutor approval workflow is in the UI.

### Strategic Interpretation

Missions may be one of ScienceDojo's strongest differentiators.

Best positioning:

> Personalized learning missions built around each student's tutoring journey.

Why this matters:

- It turns lesson records into structured follow-up.
- It gives students something to do between lessons.
- It gives parents visible learning momentum.
- It helps tutors scale their support quality.

### Current Risk

Some mission language appears more AI-heavy or game-like than the premium tutoring brand should emphasize. Missions should feel structured, personal, and mentor-guided, not like a generic AI challenge engine.

## 7. Tutoring Workflow

### Observed Journey

The current code supports this tutoring journey:

1. Public visitor lands on homepage.
2. Visitor either books a free assessment, tries Practice Dojo, or explores tutors.
3. Assessment lead is captured in `assessment_leads`.
4. Visitor/student selects a tutor and submits a booking request.
5. Tutor accepts or declines booking.
6. Accepted booking can move into payment/confirmation.
7. Confirmed session appears in dashboards.
8. Student joins online classroom.
9. Tutor completes session and writes lesson notes.
10. Lesson notes can create class posts and homework.
11. Class spaces accumulate learning records.
12. Missions can be generated from class/lesson context.
13. Student completes missions and progress is tracked.

### Booking Flow

The code supports:

- Tutor profile pages.
- Booking wizard.
- One-off bookings.
- Weekly recurring booking creation.
- Tutor accept/decline.
- Booking statuses such as requested, accepted, declined, confirmed, completed, cancelled.

### Payments

Stripe support exists for:

- Checkout sessions.
- Webhooks.
- Stripe Connect.
- Tutor payouts.
- Platform fee settings.

This suggests a marketplace/payment infrastructure is present. The brand should still avoid feeling like a generic marketplace.

### Lesson Notes and Class Creation

The tutor completion action is strategically important:

- Tutor marks a session complete.
- Lesson notes are inserted.
- A class can be found or created.
- Lesson reports and homework can be posted to the class feed.
- Students receive lesson summaries.

This is one of the core "structured learning support" systems.

### Communication

Messaging exists with:

- Conversations.
- Messages.
- Read status.
- Inquiry flows.
- Support conversations.
- Safety flagging for concerning content.

### Live Classroom

The app contains:

- A class call route using Jitsi-style room URLs.
- A Dojo whiteboard using tldraw.
- Zoom Meeting SDK/proxy infrastructure also present.

Strategically, this supports the message that ScienceDojo can host lessons inside its own learning environment. The implementation should be described carefully because both Jitsi and Zoom-related code exist.

## 8. Parent Experience

### What Parents Can See or Do

Parents appear to have access to:

- Parent dashboard.
- Bookings and session status.
- Payment actions for accepted bookings.
- Homework/progress cards.
- Lesson history.
- Tutor discovery.
- Support and settings.

### Strategic Strength

The product already contains the raw ingredients parents care about:

- Who is teaching my child?
- What happened in the lesson?
- What should my child do next?
- Is the tutor safe and verified?
- Is progress visible?
- Can I get help quickly?

### Weaknesses

The parent experience may need stronger packaging:

- Parent-child relationships should be made very clear.
- Parent progress summaries should be more emotionally reassuring.
- Mission progress should be parent-visible in a simple way.
- Payment, booking, and learning progress should feel like one journey, not separate dashboard panels.

### Strategic Recommendation

Parent dashboard language should focus on reassurance:

- "What your child worked on."
- "What needs support next."
- "What the tutor recommends."
- "How confidence is building."

Parents do not buy dashboards. They buy clarity.

## 9. Student Experience

### What Students Can Do

Students appear to access:

- Upcoming lessons.
- Class spaces.
- Homework.
- Lesson history.
- Missions.
- Tutors.
- Messages.
- Practice tools.

### Motivation Features

Motivation is supported by:

- Missions.
- Score percentages.
- Mission history.
- Progress charts.
- Homework feed.
- Class posts/comments.

### Emotional Experience

The product can support under-confident students well if the UI frames progress gently. The current architecture supports structure, but some mission copy may feel too intense or AI/game-like. A premium tutoring brand should make students feel capable, not tested by a machine.

### Strategic Recommendation

Student product language should emphasize:

- "Next step."
- "Practice with support."
- "Build confidence."
- "Review what your tutor covered."
- "Try again with guidance."

## 10. Tutor Experience

### What Tutors Can Do

Tutors can:

- Apply/onboard.
- Complete profile and credentials.
- Manage availability.
- Accept/decline booking requests.
- Launch or manage sessions.
- Complete lessons.
- Add lesson notes and homework.
- View students and progress.
- Use class spaces.
- Access earnings/settings.

### Tutor Onboarding

Tutor onboarding appears fairly developed:

- Application stages.
- Document/credential uploads.
- Contract flow.
- Admin review/verification.
- Profile completion.

### Tutor Support Systems

The strongest tutor support features are:

- Lesson note workflows.
- Class feeds.
- Homework posting.
- Mission generation from lesson context.
- Student progress views.

### Strategic Interpretation

ScienceDojo can credibly say that tutors are supported by structured learning systems. This is a better message than "AI-powered tutoring." It positions the tutor as the expert and the software as the operating system around them.

### Risks

- If tutor profiles feel like a generic directory, the brand weakens.
- If Missions are student-triggered without tutor framing, they may feel detached from tutoring.
- Tutor approval/review of AI-generated work should be clearly implemented before making strong claims.

## 11. Admin Experience

### Admin Features

Admin tooling includes:

- Platform overview.
- User management.
- Tutor review and verification.
- Booking management.
- Assessment lead management.
- Broadcast announcements.
- Disputes.
- Safeguards and safety alerts.
- Payouts.
- Platform settings and integrations.

### Operational Strengths

The admin area suggests serious platform thinking:

- Tutor verification.
- Safety monitoring.
- Lead tracking.
- Payout management.
- Dispute handling.
- Platform fee controls.

### Scaling Risks

At scale, these workflows may need:

- Clearer admin queues.
- Audit trails.
- SLA indicators.
- Better lead pipeline status design.
- Tutor quality scorecards.
- Parent complaint triage.
- Mission review moderation if AI-generated tasks become central.

## 12. Learning Philosophy Embedded In The App

The product already contains several visible learning principles:

| Principle | Evidence in code |
| --- | --- |
| Active recall | Practice Dojo questions and mission stage 1. |
| Exam practice | Curriculum/topic selection and subject-level practice. |
| Reasoning | Mission stage 2 logic prompts. |
| Application | Mission stage 3 scenario/application tasks. |
| Error correction | Mission stage 4 corrupted-data/error correction. |
| Feedback loops | AI mission evaluation, lesson notes, homework, comments. |
| Structured revision | Homework feed, class posts, missions, progress charts. |
| Accountability | Bookings, class records, lesson completion, parent visibility. |
| Confidence-building | Product architecture supports this, but copy should make it clearer. |

### Strategic Assessment

The learning philosophy is present but not fully named. ScienceDojo should define a branded method around:

1. Understand.
2. Practice.
3. Review.
4. Apply.
5. Build confidence.

This would connect tutoring, Practice Dojo, Missions, and parent reporting into one coherent educational story.

## 13. AI Usage Analysis

### Where AI Appears

AI appears in:

- Practice Dojo question generation.
- Mission blueprint generation.
- Mission answer evaluation.

### Model Usage

The code uses Google Gemini, including `gemini-2.5-flash` in the question generator.

### AI Safety and Fallbacks

Observed safeguards include:

- Structured response schema for question generation.
- Fallback questions when AI generation fails.
- Validation against education taxonomy.
- Human tutor context through lesson summaries for Missions.

Messaging safety uses keyword/contact/profanity checks rather than AI in the inspected code.

### Strategic Assessment

AI is well-suited as infrastructure here. The strongest positioning is:

- AI-supported question generation.
- AI-assisted mission drafting/evaluation.
- Tutor-led learning context.
- Human review where needed.

Avoid positioning ScienceDojo as:

- AI tutoring.
- Automated education.
- Chatbot learning.
- Replacement for tutors.

The best message is:

> Smart tools help tutors give students more structured support between lessons.

## 14. Data Model & Strategic Data Assets

The app has several strategically valuable data assets:

| Data asset | Strategic value |
| --- | --- |
| Lesson records | Source of personalized learning context. |
| Class records | Longitudinal view of a student's tutoring journey. |
| Homework posts/submissions | Evidence of follow-through and gaps. |
| Mission completion | Progress and motivation data. |
| Practice question attempts | Potential future diagnostic signal. |
| Tutor notes | Quality control and personalization. |
| Parent updates | Reassurance and retention. |
| Assessment leads | Conversion and onboarding data. |
| Bookings/payments | Business operations and tutor utilization. |
| Reviews/testimonials | Trust and marketplace quality. |
| Messages/safety flags | Safeguarding and platform trust. |
| Tutor credentials/applications | Verification and quality moat. |

### Future Uses

These assets could support:

- Personalized Missions.
- Parent progress reports.
- Tutor quality coaching.
- Student confidence dashboards.
- Curriculum gap maps.
- Retention risk alerts.
- Better assessment calls.
- Premium learning plans.
- Future school/SaaS offerings.

The biggest strategic asset is not the AI itself. It is the tutoring context captured over time.

## 15. Conversion & Marketing Opportunities

### Strongest Real Features To Emphasize

- Premium one-to-one STEM tutoring.
- Structured lesson records.
- Parent-visible progress.
- Practice Dojo as a free knowledge check.
- Personalized Missions for enrolled students.
- Built-in classroom and whiteboard.
- Tutor verification.
- Real student/parent testimonials.
- Free learning assessment.
- Curriculum coverage: GCSE, IGCSE, IB, A-Level, and international pathways.

### Strongest Emotional Benefits

- Less stress for families.
- More confidence for students.
- Clearer next steps after lessons.
- Support that continues between lessons.
- Distance is no longer a barrier to expert tutoring.

### Features To Avoid Overemphasizing Yet

- AI as the main identity.
- Fully automated progress claims.
- Guaranteed results.
- Mission tutor approval if the workflow is not polished end to end.
- Review counts or ratings unless backed by a live external review system.
- "Marketplace" language that makes tutors feel interchangeable.

### Homepage Messaging Recommendation

Recommended hero direction:

> Helping GCSE and international students learn with confidence.

Recommended subheadline:

> Premium one-to-one tutoring, structured learning support, and modern study systems designed to reduce stress and improve results.

Recommended emotional anchor:

> Your child understands more than their grades show. ScienceDojo helps turn that potential into structured progress.

## 16. Strategic Gaps

| Gap | Current state | Why it matters | Recommended improvement | Priority |
| --- | --- | --- | --- | --- |
| Practice Dojo vs Missions distinction | Both involve practice/AI, but strategic separation must be clearer. | Confusion weakens product positioning. | Position Practice Dojo as open knowledge checks and Missions as enrolled personalized journeys. | High |
| Parent reassurance packaging | Parent dashboard exists, but emotional framing can be stronger. | Parents buy clarity and trust. | Create parent-facing progress summary language around confidence, next steps, and tutor recommendations. | High |
| Mission tutor review workflow | Code includes pending tutor approval status, but UI completeness is unclear. | Premium positioning needs human oversight. | Build or clarify tutor approval/review of generated Missions and evaluations. | High |
| Founder-led credibility | Not strongly visible in inspected public positioning. | Premium tutoring often depends on trust in educational leadership. | Add founder/educator credibility story in a restrained section or About page. | Medium |
| Tutor profile warmth | Tutor data exists, but cards can feel marketplace-like. | Tutors are the core product. | Add teaching style, best-for, and mentor tone using real data only. | Medium |
| Data-to-report loop | Lesson notes, homework, and missions exist, but parent reports can be stronger. | Parent retention depends on visible value. | Generate monthly parent learning summaries from real class records. | Medium |
| Practice attempt persistence | Public practice appears not deeply connected to account history. | Diagnostics could improve conversion and personalization. | Let users save Practice Dojo results after sign-up or assessment booking. | Medium |
| Live classroom provider clarity | Jitsi and Zoom-related code both exist. | Messaging should match actual production behavior. | Consolidate naming around "ScienceDojo Classroom" and hide provider complexity. | Low |
| Admin scale workflows | Broad admin tooling exists but may become complex. | Ops quality matters as tutors/students grow. | Add clearer queues, SLAs, and audit trails. | Low |

## 17. Product Moats

### Emerging Moats

| Moat | Strength | How to strengthen |
| --- | --- | --- |
| Structured tutoring records | High | Make lesson notes, homework, and progress visible as the core learning journey. |
| Personalized Missions | High | Tie Missions clearly to lessons, tutor goals, and parent-visible progress. |
| Curriculum-specific STEM focus | High | Own GCSE, IGCSE, IB, A-Level STEM support with precise language. |
| Tutor-supported learning system | High | Show how tools help tutors support students better between lessons. |
| Parent visibility | Medium | Package progress summaries around reassurance and next steps. |
| Practice Dojo | Medium | Use it as an open diagnostic and conversion gateway. |
| Tutor verification/onboarding | Medium | Make verification meaningful and transparent. |
| Founder-led brand | Potentially high | Bring founder expertise and teaching philosophy into public trust story. |
| Safety and support operations | Medium | Highlight safeguarding, recorded classroom, support response, and verified tutors. |

### Strongest Moat

The strongest moat is the combination of:

> Human tutoring + captured lesson context + personalized Missions + parent-visible progress.

That is harder to copy than a tutor directory or an AI question generator.

## 18. Recommended Website Strategy

### Recommended Homepage Narrative

1. Hero: confidence for GCSE and international students.
2. Emotional parent promise: your child understands more than their grades show.
3. Practice Dojo: free knowledge check.
4. The ScienceDojo learning system: lessons, classroom, dashboard, parent updates.
5. Personalized Missions: enrolled-student support between lessons.
6. ScienceDojo method: understand, practice, review, apply, grow.
7. Parent trust: safety, visibility, communication.
8. Tutors: expert mentors, not marketplace listings.
9. Learning stages/curricula: compact trust signal.
10. How it works: assessment, tutor match, lessons, progress.
11. Real stories/testimonials.
12. Final CTA.

### Practice Dojo Positioning

Practice Dojo should be framed as:

- Free.
- Open.
- Curriculum-aligned.
- A way to test current understanding.
- A bridge to a free assessment if gaps appear.

Avoid:

- Main product positioning.
- AI-first language.
- Gamified mission language.

### Missions Positioning

Missions should be framed as:

- Enrolled-student learning journeys.
- Built from lessons, goals, class records, and tutor context.
- Personalized practice between lessons.
- A premium support layer.

Avoid:

- Public generic practice language.
- Over-gamification.
- Fully automated claims.

### Founder Trust Positioning

Recommended message:

> Built by educators who understand that grades do not always show what a student is capable of.

This supports the emotional promise without hype.

## 19. Recommended Product Improvements

### High Priority

| Improvement | Why it matters | Where it belongs | Expected impact |
| --- | --- | --- | --- |
| Clarify Missions as enrolled-student journeys | This is a major differentiator. | Homepage, student dashboard, class pages. | Stronger premium positioning and retention. |
| Build parent progress summary view | Parents need reassurance and proof of value. | Parent dashboard, class reports. | Higher trust and retention. |
| Complete tutor mission review/approval UX | Human oversight protects premium trust. | Tutor dashboard, class missions. | Better quality and safer AI positioning. |
| Connect free assessment to learning diagnosis | Assessment should feel educational, not just a lead form. | Free assessment, admin leads, parent onboarding. | Better conversion and sales calls. |
| Refine Practice Dojo conversion path | Public practice should lead to support. | Practice Dojo page. | More assessment bookings. |

### Medium Priority

| Improvement | Why it matters | Where it belongs | Expected impact |
| --- | --- | --- | --- |
| Tutor profile mentor positioning | Tutors are the core product. | Tutor cards/profile pages. | Higher trust and booking conversion. |
| Student confidence dashboard | Students need emotional progress, not only tasks. | Student dashboard. | Better engagement. |
| Monthly learning reports | Converts raw lesson data into parent value. | Parent dashboard/email. | Retention and referrals. |
| Better mission naming/tone | Some current language may feel too AI/game-like. | Missions UI. | More premium feel. |
| Admin lead pipeline refinement | Free assessment leads need operational follow-up. | Admin leads. | Better sales conversion. |

### Low Priority

| Improvement | Why it matters | Where it belongs | Expected impact |
| --- | --- | --- | --- |
| Practice Dojo saved history | Useful, but not core before tutoring loop is polished. | Practice Dojo/account. | Better personalization. |
| Advanced tutor quality analytics | Useful at scale. | Admin/tutor ops. | Operational quality. |
| Additional curriculum SEO pages | Helpful for acquisition. | SEO route group. | Organic traffic. |
| More guided onboarding tours | Existing tours can be refined. | Dashboards. | Lower user confusion. |
| Provider consolidation for classroom naming | Reduces internal/product confusion. | Classroom routes/components. | Clearer product story. |

## 20. Final Strategic Summary

### What ScienceDojo Already Has That Is Strategically Valuable

ScienceDojo already has the building blocks of a premium tutoring system:

- Tutor discovery and booking.
- Tutor verification/onboarding.
- Payments and payouts.
- Lesson notes and class records.
- Homework and class feeds.
- Messaging and support.
- Parent/student/tutor/admin dashboards.
- Practice Dojo.
- Personalized Missions.
- Real testimonials and educational proof.
- Safety and support pages.

### What Should Be Protected

Protect these principles:

- Tutoring first, technology second.
- Human expertise before AI.
- Calm premium trust over flashy product language.
- Real proof only.
- Parent reassurance.
- Student confidence.
- Structured progress.

### What Should Be Improved First

The highest-impact improvements are:

1. Package Missions as premium personalized learning journeys.
2. Make parent progress visibility more emotionally useful.
3. Complete tutor review/approval around Missions.
4. Turn Practice Dojo into a clear assessment gateway.
5. Strengthen tutor profiles as trusted mentors.

### What Should Be Marketed Immediately

Market these now:

- Premium one-to-one STEM tutoring.
- GCSE, IGCSE, IB, and A-Level support.
- Structured learning support between lessons.
- Parent-visible progress.
- Practice Dojo as a free knowledge check.
- Built-in online classroom.
- Real student and parent stories.
- Verified tutor process.

### What Should Be Delayed

Delay or soften these claims until fully polished:

- Fully automated AI learning journeys.
- Guaranteed grade improvement.
- Mission outcomes as proven results.
- Large-scale review/rating claims.
- Any claim that makes AI sound like the teacher.

### What The Website Should Communicate

The website should communicate:

> ScienceDojo helps students build science confidence through expert human tutoring, structured learning support, Practice Dojo, and personalized Missions.

The emotional promise should be:

> Your child understands more than their grades show. ScienceDojo helps turn that hidden potential into calm, structured progress.

This is the strongest strategic direction because it makes ScienceDojo feel premium, human, credible, and differentiated without becoming an AI-first product or a generic tutor marketplace.
