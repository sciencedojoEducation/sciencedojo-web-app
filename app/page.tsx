import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, ChartNoAxesCombined } from "lucide-react";
import AuthenticatedHomeRedirect from "@/components/AuthenticatedHomeRedirect";
import BookAssessmentLink from "@/components/analytics/BookAssessmentLink";
import HomepageSectionTracker from "@/components/analytics/HomepageSectionTracker";
import HomepageViewTracker from "@/components/analytics/HomepageViewTracker";
import HomepageSubjectChooser from "@/components/HomepageSubjectChooser";
import HomepageProductShowcase from "@/components/HomepageProductShowcase";
import JsonLd from "@/components/JsonLd";
import UserAvatar from "@/components/UserAvatar";
import { getPublicFeatureFlagMap } from "@/lib/feature-flags";
import { getPublicTutors } from "@/lib/public-tutors";
import { getVisibleShowcaseItems } from "@/lib/product-showcase";
import { businessNavigationItems } from "@/lib/business-navigation";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/seo";
import styles from "./home.module.css";

const assessmentSteps = [
  { title: "Tell us what feels difficult", text: "Share the subject, your child's year, and what you have noticed." },
  { title: "Talk it through for free", text: "We review your request, then email you to arrange a conversation about confidence, goals and next steps." },
  { title: "Get a direction for support", text: "We recommend a suitable tutor and a learning approach shaped around your child." },
];

async function FeaturedTutor() {
  const tutors = await getPublicTutors();
  const tutor = tutors
    .filter((candidate) => candidate.is_verified)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))[0];
  if (!tutor) return null;

  return (
    <article className={styles.tutorCard}>
      <HomepageSectionTracker eventName="homepage_tutor_marketplace_visible" />
      <p className={styles.eyebrow}>Meet a verified tutor</p>
      <div className={styles.tutorIdentity}>
        <div className={styles.avatar}>
          <UserAvatar src={tutor.avatar_url} alt={tutor.full_name} width={72} height={72} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <h3>{tutor.full_name}</h3>
          <p className={styles.subjects}>{tutor.subjects.slice(0, 3).join(" · ")}</p>
        </div>
      </div>
      <p className={styles.cardText}>Explore this tutor&apos;s teaching approach and experience to see if they&apos;re a good fit for your child.</p>
      <Link href={`/tutor/${tutor.id}`} className={styles.textLink}>View tutor profile <ArrowRight size={16} aria-hidden="true" /></Link>
    </article>
  );
}

async function HomeContent() {
  const flags = await getPublicFeatureFlagMap();
  const showPractice = flags.practice_dojo_enabled;
  const showAssessment = flags.free_assessment_enabled;
  const showParentWorkspace = flags.parent_dashboard_enabled && flags.booking_enabled;
  const showcaseItems = getVisibleShowcaseItems(flags);
  const supportItems = [
    { icon: MessageCircle, title: "One-to-one teaching", text: "Work through difficult ideas with a tutor, with room to ask questions and build understanding." },
    ...(showPractice ? [{ icon: BookOpen, title: "Practice between lessons", text: "Return to what you have learned with focused subject practice between sessions." }] : []),
    ...(showParentWorkspace ? [{ icon: ChartNoAxesCombined, title: "A clearer view for parents", text: "Keep the next lesson, tutor practice and recent learning together in your family workspace." }] : []),
  ];

  return (
    <main className={`${styles.page} min-w-0 flex-1 bg-white`} data-homepage>
      <HomepageViewTracker />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />

      <section id="hero" className={styles.hero} aria-labelledby="home-heading">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>Online tutoring · British &amp; international curricula</p>
            <h1 id="home-heading" className={styles.heroHeading}>Tutoring that makes the next step clear.</h1>
            <p className={styles.lead}>One-to-one lessons, practice between sessions, and progress parents can follow.</p>
            <ul className={styles.curricula} aria-label="Supported school pathways">
              {['GCSE', 'IGCSE', 'A-Level', 'IB'].map(label => <li key={label}>{label}</li>)}
            </ul>
            <div className={styles.actions}>
              {showAssessment ? (
                <BookAssessmentLink source="homepage_hero" className={styles.primary}>Request a free assessment <ArrowRight size={16} aria-hidden="true" /></BookAssessmentLink>
              ) : showPractice ? (
                <Link href="/ai-practice-studio#studio" className={styles.primary}>Try free practice <ArrowRight size={16} aria-hidden="true" /></Link>
              ) : (
                <Link href="/how-it-works" className={styles.primary}>See how it works <ArrowRight size={16} aria-hidden="true" /></Link>
              )}
              {showAssessment && showPractice && <Link href="/ai-practice-studio#studio" className={styles.secondary}>Try free practice <ArrowRight size={16} aria-hidden="true" /></Link>}
            </div>
            {showAssessment && <p className={styles.hint}>A free conversation about your child&apos;s learning, with no pressure to continue. We&apos;ll review your request and email you to arrange it.</p>}
          </div>
          <div className={styles.heroImage}>
            <Image src="/images/home/hero-parent-support.webp" alt="A parent and child learning together at a computer" fill sizes="(max-width: 850px) 100vw, 45vw" loading="eager" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className={styles.proof} aria-labelledby="stories-heading">
        <div className={styles.container}>
          <div className={styles.proofHeader}>
            <p className={styles.eyebrow}>From ScienceDojo families</p>
            <h2 id="stories-heading">Support that makes a difference.</h2>
          </div>
          <div className={styles.proofGrid}>
            <article className={styles.quoteCard}>
              <p className={styles.eyebrow}>Physics · long-term support</p>
              <blockquote>“We received Pawan&apos;s grade today and he received an A* for Physics. Thank you so much for your immense support and for guiding him over the past 1.5 years.”</blockquote>
              <p className={styles.attribution}>Pawan&apos;s parent · Individual outcomes vary</p>
              <Link href="/about#stories" className={styles.textLink}>Read the full story <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
            {flags.tutor_marketplace_enabled && flags.tutor_profiles_enabled && <Suspense fallback={null}><FeaturedTutor /></Suspense>}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="support-heading">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Learning with ScienceDojo</p>
            <h2 id="support-heading" className={styles.heading}>Good support goes beyond the lesson.</h2>
          </div>
          <div className={styles.supportGrid}>
            {supportItems.map(({ icon: Icon, title, text }) => <article key={title} className={styles.supportCard}>
              <div className={styles.supportIcon}><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></div>
              <h3>{title}</h3><p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <HomepageProductShowcase items={showcaseItems} />

      {showAssessment && <section className={`${styles.section} ${styles.assessment}`} aria-labelledby="system-heading">
        <HomepageSectionTracker eventName="homepage_method_visible" />
        <div className={styles.container}>
          <div className={styles.assessmentIntro}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Your first step</p>
              <h2 id="system-heading" className={styles.heading}>Let&apos;s find a useful starting point.</h2>
              <p>The free assessment starts with a conversation about your child&apos;s learning and the support that could help.</p>
            </div>
            <BookAssessmentLink source="homepage_method" className={styles.textLink}>Tell us what your child needs <ArrowRight size={16} aria-hidden="true" /></BookAssessmentLink>
          </div>
          <ol className={styles.steps}>
            {assessmentSteps.map((step, index) => <li key={step.title}>
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3><p>{step.text}</p>
            </li>)}
          </ol>
        </div>
      </section>}

      {showAssessment && <section className={styles.section} aria-labelledby="questions-heading">
        <div className={styles.container}>
          <h2 id="questions-heading" className={styles.heading}>Before you get started</h2>
          <div className={styles.faqs}>
            <div><h3>Is the assessment free?</h3><p>Yes. The conversation is free, with no pressure to continue.</p></div>
            <div><h3>What happens after I ask?</h3><p>We review what you share, then email you to arrange the assessment conversation.</p></div>
            <div><h3>Which curricula do you support?</h3><p>GCSE, IGCSE, A-Level, IB, and other British and international school pathways.</p></div>
          </div>
          {showPractice && <div className={styles.practice}>
            <HomepageSectionTracker eventName="homepage_practice_dojo_visible" />
            <HomepageSubjectChooser assessmentEnabled />
          </div>}
        </div>
      </section>}
      {showPractice && !showAssessment && <section className={styles.section} aria-label="Choose a subject to practise">
        <HomepageSectionTracker eventName="homepage_practice_dojo_visible" />
        <div className={styles.container}><HomepageSubjectChooser assessmentEnabled={false} /></div>
      </section>}

      <section className={styles.business} aria-labelledby="business-heading">
        <div className={`${styles.container} ${styles.businessGrid}`}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>ScienceDojo for organisations</p>
            <h2 id="business-heading" className={styles.heading}>Better learning.<br />Thoughtful digital experiences.</h2>
            <p>We also work with organisations on workplace learning and web software.</p>
          </div>
          <div className={styles.businessLinks}>
            {businessNavigationItems.map(item => <Link key={item.href} href={item.href} className={styles.businessLink}>
              <div><h3>{item.label}</h3><p>{item.description}</p></div><ArrowRight size={20} aria-hidden="true" />
            </Link>)}
          </div>
        </div>
      </section>

      {(showAssessment || showPractice) && <section className={styles.final} aria-labelledby="next-step-heading">
        <div className={`${styles.container} ${styles.finalInner}`}>
          <div>
            <h2 id="next-step-heading" className={styles.heading}>A clearer next step starts here.</h2>
            <p>{showAssessment ? "Tell us about your child’s goals and where they need support." : "Choose a subject and start with a few focused practice questions."}</p>
          </div>
          <div className={styles.actions}>
            {showAssessment && <BookAssessmentLink source="homepage_final" className={styles.primary}>Request a free assessment <ArrowRight size={16} aria-hidden="true" /></BookAssessmentLink>}
            {showPractice && <Link href="/ai-practice-studio#studio" className={showAssessment ? styles.secondary : styles.primary}>Try free practice <ArrowRight size={16} aria-hidden="true" /></Link>}
          </div>
        </div>
      </section>}
    </main>
  );
}

export default function Home() {
  return <><AuthenticatedHomeRedirect /><Suspense fallback={<main className="min-h-[70vh] flex-1 bg-[#f3faff]" />}><HomeContent /></Suspense></>;
}
