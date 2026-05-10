import Image from "next/image";

export interface Testimonial {
  quote: string;
  firstName: string;
  context: string;
  type: "parent" | "student";
  initials: string;
  badge: string;
}

interface TestimonialsProps {
  useRealData?: boolean;
}

// Real testimonials — messages received from ScienceDojo students and parents.
// Shared with permission where applicable.
// Do not add fake ratings, fake outcomes, or unverifiable claims.
// Individual outcomes vary.
export const REAL_TESTIMONIALS: Testimonial[] = [
  {
    quote: "I really wouldn't have been able to do this without your help and advice.",
    firstName: "Kehara",
    context: "Chemistry and Physics support — GCSE",
    type: "student",
    initials: "K",
    badge: "Student story",
  },
  {
    quote:
      "I got my test results today and I was in the top 3.8% of the participants and got a place. I just wanted to thank you for your help, advice and motivation all throughout.",
    firstName: "University applicant",
    context: "University entrance preparation",
    type: "student",
    initials: "U",
    badge: "Student story",
  },
  {
    quote:
      "I received 8 A*s. Thank you so much for all your efforts which made me achieve these results. I am very grateful to have a wonderful teacher like you. You are always inspiring — you're the best teacher I ever had.",
    firstName: "GCSE student",
    context: "GCSE examination results",
    type: "student",
    initials: "A",
    badge: "Student story",
  },
  {
    quote:
      "I received back my physics lab report and got 22/22! Thank you so, so, so much — I could have never done that without you!",
    firstName: "Anuttara",
    context: "Perfect score — Physics lab report",
    type: "student",
    initials: "AN",
    badge: "Student story",
  },
  {
    quote:
      "One of the best teachers I know — who has that powerful ability to become a good friend for a student while teaching, and that system works very well.",
    firstName: "Shanuka",
    context: "Long-term ScienceDojo student",
    type: "student",
    initials: "S",
    badge: "Student story",
  },
];

const FEATURED_STORY = {
  quote:
    "We received Pawan's grade today and he received an A* for Physics. Thank you so much for your immense support and for guiding him over the past 1.5 years.",
  firstName: "Pawan's parent",
  context:
    "A Netherlands-based student supported through long-term Physics tutoring, now with a placement to study at TU Delft.",
  badge: "Long-term learning journey",
  achievement:
    "Highest Mark in Europe for Pearson Edexcel International GCSE Physics — November 2023 exam series",
  certificateSrc: "/images/home/testimonials/pawan-pearson-certificate-blurred-v2.png",
};

const ACHIEVEMENT_STORY = {
  quote:
    "Thank you for your help Mr Piumal. He got a silver medal and a local ranking of 5th place. Thank you so much for all your help, wish we can continue lessons.",
  firstName: "JD's mom",
  context: "SEAMO Mathematics Olympiad — Silver Medal, local ranking 5th place",
  badge: "Mathematics achievement",
  note: "Individual outcomes vary. This reflects one student's learning journey.",
};

export function FeaturedTestimonialCard() {
  return (
    <div className="relative mt-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#06172f_0%,#0a3a70_100%)] p-8 shadow-2xl shadow-secondary/20 md:p-12 lg:p-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_12%,rgba(0,245,212,0.11),transparent_35%),radial-gradient(circle_at_88%_64%,rgba(255,255,255,0.07),transparent_31%)]"></div>
      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.52fr)] lg:items-center">
        <div className="min-w-0 lg:pr-10">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white">
              Featured Story
            </span>
            <span className="rounded-full border border-cyan-200/15 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">
              {FEATURED_STORY.badge}
            </span>
          </div>
          <p className="mt-8 max-w-4xl text-2xl font-black leading-9 text-white md:text-3xl md:leading-10 lg:text-[2.28rem] lg:leading-[1.22]">
            &ldquo;{FEATURED_STORY.quote}&rdquo;
          </p>
          <p className="mt-5 text-sm font-black text-white/65">— {FEATURED_STORY.firstName}</p>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-white/58">
            {FEATURED_STORY.context}
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.055] p-6 md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Achievement</p>
            <p className="mt-3 text-xl font-black leading-7 text-white md:text-2xl md:leading-8">
              Physics learning journey <span className="text-primary">→</span> TU Delft
            </p>
            <p className="mt-4 text-sm font-bold leading-6 text-cyan-100/70">
              {FEATURED_STORY.achievement}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
              <span>Shared with permission</span>
              <span aria-hidden="true">•</span>
              <span>Individual outcomes vary</span>
            </div>
          </div>
        </div>

        <aside aria-label="Achievement proof" className="min-w-0">
          <div className="mx-auto w-full max-w-[400px] rounded-[1.75rem] border border-white/10 bg-white/[0.065] p-3 shadow-xl shadow-black/15 backdrop-blur lg:ml-auto lg:max-w-[300px]">
            <div className="relative h-[260px] overflow-hidden rounded-[1.25rem] bg-white sm:h-[320px] lg:h-[318px]">
              <Image
                src={FEATURED_STORY.certificateSrc}
                alt="Privacy-blurred Pearson achievement certificate showing Highest Mark in Europe recognition for a ScienceDojo student."
                fill
                sizes="(max-width: 768px) 82vw, (max-width: 1024px) 46vw, 300px"
                className="object-contain opacity-85 brightness-95 contrast-90"
              />
            </div>
            <div className="px-2 pb-1 pt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70">Achievement proof</p>
              <p className="mt-1 text-xs leading-5 text-white/45">
                Privacy-blurred certificate for the November 2023 Pearson Edexcel International GCSE Physics recognition.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function AchievementStoryCard() {
  return (
    <div className="rounded-3xl border border-primary/20 bg-[linear-gradient(135deg,rgba(0,102,255,0.09),rgba(255,255,255,0.99))] p-8 shadow-xl shadow-primary/10 xl:p-9">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
          {ACHIEVEMENT_STORY.badge}
        </span>
        <span className="rounded-full border border-secondary/10 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/45">
          Parent feedback
        </span>
      </div>
      <p className="text-xl font-black leading-8 text-secondary xl:text-[1.38rem] xl:leading-9">&ldquo;{ACHIEVEMENT_STORY.quote}&rdquo;</p>
      <div className="mt-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white" aria-hidden="true">
          JD
        </div>
        <div>
          <p className="text-sm font-black text-secondary">{ACHIEVEMENT_STORY.firstName}</p>
          <p className="mt-1 text-xs leading-5 text-secondary/55">{ACHIEVEMENT_STORY.context}</p>
        </div>
      </div>
      <p className="mt-5 rounded-2xl border border-secondary/10 bg-white/70 p-4 text-xs font-bold leading-6 text-secondary/50">
        {ACHIEVEMENT_STORY.note}
      </p>
    </div>
  );
}

export function TestimonialCard({ story, variant = "standard" }: { story: Testimonial; variant?: "standard" | "wide" }) {
  const isWide = variant === "wide";

  return (
    <div
      className={`rounded-3xl border border-secondary/[0.08] p-7 shadow-md shadow-secondary/[0.06] backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.07] xl:p-8 ${
        isWide
          ? "bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] sm:grid sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6"
          : "h-full bg-white"
      }`}
    >
      <div className={`flex items-start justify-between gap-3 ${isWide ? "mb-5 sm:mb-0" : "mb-5"}`}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white"
            aria-hidden="true"
          >
            {story.initials}
          </div>
          <div>
            <p className="text-sm font-black text-secondary">{story.firstName}</p>
            <p className="mt-0.5 text-xs leading-5 text-secondary/52">{story.context}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
          {story.badge}
        </span>
      </div>
      <p className={`text-xl font-black leading-8 text-secondary xl:leading-9 ${isWide ? "xl:text-[1.45rem]" : "xl:text-[1.34rem]"}`}>
        &ldquo;{story.quote}&rdquo;
      </p>
    </div>
  );
}

export default function Testimonials({ useRealData = false }: TestimonialsProps) {
  const stories = useRealData ? REAL_TESTIMONIALS : [];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {stories.map((story, index) => (
        <div key={index} className={index === stories.length - 1 ? "sm:col-span-2" : ""}>
          <TestimonialCard story={story} variant={index === stories.length - 1 ? "wide" : "standard"} />
        </div>
      ))}
    </div>
  );
}
