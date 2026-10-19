import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Mail, ShieldCheck } from "lucide-react";
import { siteUrl } from "@/lib/seo";
import EngineeringNavigation from "./EngineeringNavigation";
import EngineeringExperience from "./EngineeringExperience";
import EngineeringEnquiryForm from "./EngineeringEnquiryForm";
import ProblemExplorer from "./ProblemExplorer";
import ProductCasePreview from "./ProductCasePreview";
import EngineeringHeroArtwork from "./EngineeringHeroArtwork";
import EngineeringVisualMotion from "./EngineeringVisualMotion";
import { approach, faqs, team } from "./content";
import s from "./engineering.module.css";

const title = "Websites, Web Apps & Integrations | ScienceDojo Engineering";
const description = "A small Sri Lankan team building websites, improving web applications and connecting business workflows. In-house learning-platform experience. Focused or ongoing work.";
export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: `${siteUrl}/business/engineering` },
  openGraph: { title, description, url: `${siteUrl}/business/engineering`, siteName: "ScienceDojo Engineering", type: "website", images: [{ url: `${siteUrl}/business/engineering/opengraph-image`, width: 1200, height: 630, alt: "ScienceDojo Engineering — Websites, web applications and connected workflows." }] },
  twitter: { card: "summary_large_image", title, description, images: [`${siteUrl}/business/engineering/opengraph-image`] },
};

export default function EngineeringPage() {
  return <EngineeringVisualMotion>
    {/* Reveal completed streamed markup in the shared loading boundary without JS. */}
    <noscript><style>{"@layer theme{div[hidden]:has(#engineering-content){display:block!important}}[data-route-loading]{display:none!important}[data-engineering-explorer] button,[data-product-views] button,[data-engineering-choice],[data-visual-motion-toggle]{display:none!important}"}</style></noscript>
    <a href="#engineering-content" className={s.skip}>Skip to content</a>
    <EngineeringNavigation />
    <EngineeringExperience>
      <div id="engineering-content" tabIndex={-1}>
        <section className={s.hero} aria-labelledby="engineering-heading">
          <div className={`${s.container} ${s.heroGrid}`}>
            <div>
              <p className={s.eyebrow}>Websites · Web applications · Integrations</p>
              <h1 id="engineering-heading">Better websites.<br /><span>Useful software.</span><br />Connected work.</h1>
              <p className={s.heroDescription}>We help training providers, education teams and service businesses improve their websites, web applications and the work between their tools.</p>
              <div className={s.heroActions}><a className={s.button} href="#contact">Discuss your project <ArrowUpRight size={18} aria-hidden="true" /></a><a className={s.heroSecondary} href="#work">See our work <ArrowDown size={16} aria-hidden="true" /></a></div>
              <p className={s.heroExpectation}>Start with a focused improvement. Scope and dates agreed together.</p>
            </div>
            <EngineeringHeroArtwork />
            <div className={s.heroFoot}><p>Built with care, by a small Sri Lankan team.</p><p>Have a web product or workflow in another sector?<br /><a href="#contact">Let’s see if we’re a fit <ArrowUpRight size={14} aria-hidden="true" /></a></p></div>
          </div>
        </section>
        <ProblemExplorer />
        <section id="work" className={`${s.section} ${s.work}`} aria-labelledby="work-heading">
          <div className={s.container}>
            <div className={s.caseFeature}>
              <div className={s.caseBrief}><p className={s.eyebrow}>02 / From our own product</p><span className={s.caseBadge}>In-house product</span><h2 id="work-heading">Inside our<br /><span>learning platform.</span></h2><p>ScienceDojo brings course access, learning interfaces and saved progress into one platform.</p><dl className={s.caseFacts}><div><dt>The need</dt><dd>Different users need a clear next step and a way back to their work.</dd></div><div><dt>What we built</dt><dd>Role-specific interfaces, course workflows and retained learning progress.</dd></div><div><dt>A key decision</dt><dd>Keep individual learning work private while giving each role a useful view.</dd></div></dl><p className={s.evidenceNote}>Our own product, not a client commission. Explore the actual interfaces using sample data.</p></div>
              <div data-reveal><ProductCasePreview /></div>
            </div>
          </div>
        </section>
        <section className={`${s.section} ${s.operations}`} aria-labelledby="operations-heading">
          <div className={`${s.container} ${s.operationsGrid}`}>
            <div className={s.operationsCopy}><p className={s.eyebrow}>03 / Our website & connected operations</p><span className={s.caseBadge}>In-house implementation</span><h2 id="operations-heading">Keep the enquiry.<br /><span>Then notify the team.</span></h2><p>A website should make the next step clear—and keep the enquiry safe when someone takes it.</p><p>Our own enquiry flow saves the brief before sending a notification, so an email problem leaves something we can recover.</p><Link href="/business" className={s.textLink}>Explore our learning-design website <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
            <div className={s.operationsEvidence} data-animate data-reveal>
              <figure className={s.workflowArtwork}><Image src="/images/business/engineering/reliable-workflow-v1.webp" alt="Concept illustration of connected blue glass channels keeping information along a continuous route" width={1440} height={960} sizes="(max-width: 760px) 92vw, 550px" /><figcaption className={`${s.workflowTag} ${s.visualFloat}`}><ShieldCheck size={18} aria-hidden="true" />Keep the work. Connect the next step.</figcaption><span className={s.artCaption}>Concept illustration</span></figure>
              <div className={s.flowHeading}><Mail size={22} aria-hidden="true" /><span>Behind an enquiry</span><span className={s.label}>Implementation outline</span></div>
              <ol className={s.reliabilityFlow}><li><span>01</span><div><h3>Check the details.</h3><p>Help people send a useful brief.</p></div><Check size={18} aria-hidden="true" /></li><li><span>02</span><div><h3>Keep the enquiry.</h3><p>Save it privately before sending a notification.</p></div><ShieldCheck size={19} aria-hidden="true" /></li><li><span>03</span><div><h3>Notify. Recover if needed.</h3><p>Keep a way to recover if email fails.</p></div><ArrowRight size={18} aria-hidden="true" /></li></ol>
              <p className={s.outlineNote}>Our own website workflow. Implementation outline; no real enquiry data.</p>
            </div>
          </div>
        </section>
        <section id="approach" className={`${s.section} ${s.approach}`} aria-labelledby="approach-heading">
          <div className={`${s.container} ${s.approachGrid}`}><div className={s.approachLead}><p className={s.eyebrow}>04 / How we work</p><h2 id="approach-heading">From your first brief<br /><span>to a clear handover.</span></h2><figure className={s.studioArtwork} data-reveal><Image src="/images/business/engineering/studio-process-v1.webp" alt="Illustrative sunlit studio desk with a sketchbook, coffee and blue material samples" width={1440} height={960} sizes="(max-width: 760px) 92vw, 530px" /><figcaption>Thoughtful from the first sketch.<span>Studio concept</span></figcaption></figure><div className={s.engagementModes} aria-label="Ways to work together"><article><h3>A focused project</h3><p>One journey, feature or integration, with a defined scope and completion checks.</p></article><article><h3>Continuing development</h3><p>An agreed set of priorities, with team availability, reviews and support arranged for the work.</p></article></div><a href="#contact" className={s.textLink}>Start with a conversation <ArrowUpRight size={17} aria-hidden="true" /></a></div><ol>{approach.map((step, index) => <li key={step.title} className={s.approachStep}><span className={s.stepIndex}>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p><span className={s.stepOutput}>{step.output}</span></div></li>)}</ol></div>
        </section>
        <section id="team" className={`${s.section} ${s.team}`} aria-labelledby="team-heading"><div className={s.container}>
          <div className={s.teamIntro}><div><p className={s.eyebrow}>A small Sri Lankan team</p><h2 id="team-heading">Meet the people<br /><span>behind the work.</span></h2></div><p>Piumal leads your first conversation. Together, we bring product thinking, engineering and interface design to the brief.</p></div>
          <div className={s.teamGrid} data-engineering-team>{team.map(person => <article key={person.name} aria-labelledby={`team-${person.initial}`}><figure className={s.personPortrait} data-reveal><Image src={person.portrait} alt={`Illustrated portrait of ${person.name}`} width={800} height={800} sizes="(max-width: 370px) 88px, (max-width: 760px) 112px, (max-width: 1200px) 30vw, 390px" /></figure><p className={s.label}>{person.focus}</p><h3 id={`team-${person.initial}`}>{person.name}</h3><p>{person.role}</p></article>)}</div>
        </div></section>
        <section className={`${s.section} ${s.faq}`} aria-labelledby="faq-heading"><div className={`${s.container} ${s.faqGrid}`}><div><p className={s.eyebrow}>A few useful answers</p><h2 id="faq-heading">Costs, handover<br /><span>and next steps.</span></h2><p>Different projects need different arrangements. We agree them before the work begins.</p></div><div>{faqs.map(faq => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>
        <section id="contact" className={`${s.section} ${s.contact}`} aria-labelledby="contact-heading"><div className={`${s.container} ${s.contactGrid}`}><div className={s.contactCopy}><p className={s.eyebrow}>05 / Start a conversation</p><h2 id="contact-heading">Start with<br /><span>a conversation.</span></h2><p>A few sentences about your current tools and the change you want will help Piumal understand the work.</p><div className={s.nextSteps}><span className={s.label}>Your first point of contact</span><p className={s.contactPerson}><strong>Piumal</strong><span>Discovery, requirements & client communication</span></p><ol className={s.contactSteps}><li>Piumal reviews the brief and follows up by email.</li><li>We clarify fit, requirements and any access needed.</li><li>If the work fits, we agree scope, fees and dates before development.</li></ol></div><a className={s.textLink} href="mailto:hello@sciencedojo.co.uk?subject=ScienceDojo%20Engineering%20enquiry">Prefer email? <ArrowUpRight size={16} aria-hidden="true" /></a><a className={s.email} href="mailto:hello@sciencedojo.co.uk">hello@sciencedojo.co.uk</a></div><EngineeringEnquiryForm /></div></section>
      </div>
    </EngineeringExperience>
    <footer className={s.footer}><div className={`${s.container} ${s.footerInner}`}><div><Link href="/business/engineering" className={s.footerBrand}>science<span className={s.brandDojo}>dojo</span><span>.</span></Link><p>Engineering, with a human touch.</p></div><nav aria-label="Engineering footer"><Link href="/business/engineering">Engineering</Link><Link href="/business">Learning design</Link><Link href="/">ScienceDojo</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav><small>© {new Date().getFullYear()} ScienceDojo (Pvt) Ltd</small></div></footer>
  </EngineeringVisualMotion>;
}
