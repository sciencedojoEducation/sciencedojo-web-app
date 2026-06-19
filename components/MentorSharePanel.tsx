"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import type { TutorProfile } from "@/lib/supabase-queries";
import { trackEvent } from "@/lib/analytics";
import { getMeaningfulTutorSubjects } from "@/lib/tutors/subjects";

type MentorSharePanelProps = {
  tutor: TutorProfile;
};

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

const scienceSubjects = new Set([
  "science",
  "stem",
  "physics",
  "chemistry",
  "biology",
  "computer science",
  "programming",
  "coding",
  "environmental science",
  "combined science",
]);
const mathSubjects = new Set(["math", "maths", "mathematics", "further mathematics", "further maths"]);

function normalizeSubject(subject: string) {
  return subject
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getPrimarySubject(subjects: string[]) {
  const first = getMeaningfulTutorSubjects(subjects)[0];
  if (!first) return "STEM";
  const normalized = normalizeSubject(first);
  if (normalized === "math" || normalized === "maths") return "Mathematics";
  if (normalized === "programming") return "Computer Science";
  return titleCase(first);
}

function getSubjectRole(subjects: string[]) {
  const normalizedSubjects = getMeaningfulTutorSubjects(subjects)
    .flatMap((subject) => normalizeSubject(subject).split(/\s*,\s*|\s*\/\s*|\s+\+\s+/))
    .map((subject) => subject.trim())
    .filter(Boolean);
  const uniqueSubjects = [...new Set(normalizedSubjects)];

  if (uniqueSubjects.length === 0) return "SCIENCEDOJO TUTOR";

  const hasMath = uniqueSubjects.some((subject) => mathSubjects.has(subject));
  const hasScience = uniqueSubjects.some((subject) => scienceSubjects.has(subject));
  const hasBroadScience = uniqueSubjects.some((subject) => subject === "science" || subject === "stem" || subject === "combined science");

  if (uniqueSubjects.length === 1) {
    const [subject] = uniqueSubjects;
    if (mathSubjects.has(subject)) return "MATHEMATICS TUTOR";
    if (subject === "stem" || subject === "science" || subject === "combined science") return "SCIENCE TUTOR";
    if (subject === "programming") return "COMPUTER SCIENCE TUTOR";
    if (subject === "coding") return "COMPUTER SCIENCE TUTOR";
    return `${titleCase(subject).toUpperCase()} TUTOR`;
  }

  if (hasMath && hasScience) return "SCIENCE & MATHEMATICS TUTOR";
  if (hasBroadScience) return "SCIENCE TUTOR";
  if (hasScience && uniqueSubjects.every((subject) => scienceSubjects.has(subject))) return "SCIENCE TUTOR";
  if (hasMath) return "MATHEMATICS TUTOR";

  return "SCIENCEDOJO TUTOR";
}

function getSubjectRoleFontSize(subjectRole: string) {
  if (subjectRole === "SCIENCE & MATHEMATICS TUTOR") return 38;
  if (subjectRole === "SCIENCE TUTOR") return 41;
  return 44;
}

function getDisplayUrl(slug: string) {
  return `sciencedojo.co.uk/t/${slug}`;
}

function safeTrack(eventName: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  try {
    trackEvent(eventName, params);
  } catch {
    // Analytics should never block sharing.
  }
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = `${word} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
  }

  return currentY;
}

function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, size = 50) {
  ctx.font = `900 ${size}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#071B3C";
  ctx.fillText("science", x, y);
  const scienceWidth = ctx.measureText("science").width;
  ctx.fillStyle = "#1175FF";
  ctx.fillText("dojo", x + scienceWidth, y);
  const dojoWidth = ctx.measureText("dojo").width;
  ctx.fillStyle = "#06C8D9";
  ctx.fillText(".", x + scienceWidth + dojoWidth, y);
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#F8FBFF");
  gradient.addColorStop(0.58, "#EAF7FF");
  gradient.addColorStop(1, "#DFFFFB");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = "rgba(30, 90, 168, 0.10)";
  ctx.beginPath();
  ctx.arc(930, 150, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(111, 227, 214, 0.34)";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(135, 1180, 170, 0, Math.PI * 2);
  ctx.stroke();
}

function drawVerifiedPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(30, 90, 168, 0.18)";
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const ringGradient = ctx.createLinearGradient(x, y, x + size, y + size);
  ringGradient.addColorStop(0, "#1175FF");
  ringGradient.addColorStop(1, "#06C8D9");

  ctx.strokeStyle = ringGradient;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.28, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#071B3C";
  ctx.font = `900 ${Math.round(size * 0.28)}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("SD", centerX, centerY + size * 0.1);

  ctx.textAlign = "left";
  ctx.fillStyle = "#1E5AA8";
  ctx.font = "900 22px Inter, Arial, sans-serif";
  ctx.fillText("VERIFIED", x + 34, y + size - 34);
  ctx.restore();
}

async function loadCanvasImage(src?: string | null) {
  if (!src) return null;

  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const ratio = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const drawWidth = img.naturalWidth * ratio;
  const drawHeight = img.naturalHeight * ratio;
  const drawX = x + (size - drawWidth) / 2;
  const drawY = y + (size - drawHeight) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(30, 90, 168, 0.18)";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

export default function MentorSharePanel({ tutor }: MentorSharePanelProps) {
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const slug = tutor.slug || tutor.id;
  const primarySubject = getPrimarySubject(tutor.subjects);
  const subjectRole = getSubjectRole(tutor.subjects);
  const hasGenericSubjectRole = subjectRole === "SCIENCEDOJO TUTOR";
  const visibleUrl = getDisplayUrl(slug);

  const mentorUrl = useMemo(() => {
    if (!origin) return `/t/${slug}?r=${slug}`;
    return `${origin}/t/${slug}?r=${slug}`;
  }, [origin, slug]);

  const shareCopy = `If your child needs help with ${primarySubject}, here’s my ScienceDojo mentor profile. You can book a trial lesson or ask a question before booking: ${mentorUrl}`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!mentorUrl.startsWith("http")) return;
    QRCode.toDataURL(mentorUrl, {
      margin: 1,
      width: 440,
      color: {
        dark: "#071B3C",
        light: "#FFFFFF",
      },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [mentorUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mentorUrl);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    drawBackground(ctx);
    return { canvas, ctx };
  };

  const drawQrBlock = async (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    drawRoundRect(ctx, x, y, size, size, 34);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(30, 90, 168, 0.14)";
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (qrDataUrl) {
      const qrImage = await loadCanvasImage(qrDataUrl);
      if (qrImage) {
        ctx.drawImage(qrImage, x + 28, y + 28, size - 56, size - 56);
      }
    }
  };

  const handleDownloadTutorCard = async () => {
    const prepared = prepareCanvas();
    if (!prepared) return;
    const { canvas, ctx } = prepared;

    drawWordmark(ctx, 72, 92, 54);

    ctx.fillStyle = "#1E5AA8";
    ctx.font = "900 23px Inter, Arial, sans-serif";
    ctx.fillText("VERIFIED BY SCIENCEDOJO", 72, 154);

    ctx.fillStyle = "#071B3C";
    ctx.font = "950 66px Inter, Arial, sans-serif";
    drawWrappedText(ctx, "Your child understands more than their grades show.", 72, 240, 860, 78);

    const photoX = 72;
    const photoY = 430;
    const photoSize = 300;
    const tutorImage = await loadCanvasImage(tutor.avatar_url);

    try {
      if (tutorImage) {
        drawCoverImage(ctx, tutorImage, photoX, photoY, photoSize);
      } else {
        drawVerifiedPlaceholder(ctx, photoX, photoY, photoSize);
      }
    } catch {
      drawVerifiedPlaceholder(ctx, photoX, photoY, photoSize);
    }

    if (hasGenericSubjectRole) {
      ctx.fillStyle = "#071B3C";
      ctx.font = "900 40px Inter, Arial, sans-serif";
      drawWrappedText(ctx, tutor.full_name, 410, 488, 560, 45);

      ctx.fillStyle = "#334B6F";
      ctx.font = "850 34px Inter, Arial, sans-serif";
      drawWrappedText(ctx, "Helping students build confidence, understanding, and exam readiness.", 410, 565, 560, 42);

      ctx.fillStyle = "#5D708D";
      ctx.font = "750 24px Inter, Arial, sans-serif";
      ctx.fillText("GCSE • IGCSE • IB • A-Level support", 410, 694);
    } else {
      const subjectRoleFontSize = getSubjectRoleFontSize(subjectRole);

      ctx.fillStyle = "#1E5AA8";
      ctx.font = `950 ${subjectRoleFontSize}px Inter, Arial, sans-serif`;
      drawWrappedText(ctx, subjectRole, 410, 488, 560, subjectRoleFontSize + 6);

      ctx.fillStyle = "#071B3C";
      ctx.font = "900 37px Inter, Arial, sans-serif";
      drawWrappedText(ctx, tutor.full_name, 410, 558, 560, 42);

      ctx.fillStyle = "#334B6F";
      ctx.font = "850 32px Inter, Arial, sans-serif";
      drawWrappedText(ctx, "Helping students build confidence, understanding, and exam readiness.", 410, 645, 530, 40);

      ctx.fillStyle = "#5D708D";
      ctx.font = "750 24px Inter, Arial, sans-serif";
      ctx.fillText("GCSE • IGCSE • IB • A-Level support", 410, 755);
    }

    await drawQrBlock(ctx, 72, 805, 360);

    ctx.fillStyle = "#071B3C";
    ctx.font = "950 43px Inter, Arial, sans-serif";
    ctx.fillText("Scan to learn more", 470, 900);

    ctx.fillStyle = "#334B6F";
    ctx.font = "800 29px Inter, Arial, sans-serif";
    drawWrappedText(ctx, "Book a trial lesson or ask a question.", 470, 955, 500, 38);

    ctx.fillStyle = "#48627F";
    ctx.font = "700 22px Inter, Arial, sans-serif";
    ctx.fillText(visibleUrl, 470, 1062);

    ctx.fillStyle = "#071B3C";
    ctx.font = "950 34px Inter, Arial, sans-serif";
    ctx.fillText("Book • Ask • Explore", 72, 1262);

    safeTrack("mentor_share_card_downloaded", {
      card_type: "tutor_trust",
      tutor_id: tutor.id,
      subject: primarySubject,
    });
    downloadCanvas(canvas, `${slug}-sciencedojo-tutor-card.png`);
  };

  const handleDownloadMethodCard = async () => {
    const prepared = prepareCanvas();
    if (!prepared) return;
    const { canvas, ctx } = prepared;

    drawWordmark(ctx, 72, 92, 54);

    ctx.fillStyle = "#071B3C";
    ctx.font = "950 64px Inter, Arial, sans-serif";
    drawWrappedText(ctx, "How ScienceDojo Supports Learning", 72, 220, 860, 72);

    const stages = ["Assessment", "Personalised Plan", "Weekly Lessons", "Practice & Missions", "Visible Progress"];
    stages.forEach((stage, index) => {
      const y = 365 + index * 118;
      ctx.fillStyle = "#FFFFFF";
      drawRoundRect(ctx, 72, y - 58, 660, 82, 24);
      ctx.fill();

      ctx.fillStyle = "#1E5AA8";
      ctx.font = "950 36px Inter, Arial, sans-serif";
      ctx.fillText(String(index + 1), 108, y);

      ctx.fillStyle = "#071B3C";
      ctx.font = "900 34px Inter, Arial, sans-serif";
      ctx.fillText(stage, 172, y);
    });

    await drawQrBlock(ctx, 72, 970, 305);

    ctx.fillStyle = "#071B3C";
    ctx.font = "950 44px Inter, Arial, sans-serif";
    ctx.fillText("Scan to learn more", 420, 1066);

    ctx.fillStyle = "#1E5AA8";
    ctx.font = "900 27px Inter, Arial, sans-serif";
    ctx.fillText(visibleUrl, 420, 1122);

    ctx.fillStyle = "#071B3C";
    ctx.font = "950 34px Inter, Arial, sans-serif";
    ctx.fillText("Book • Ask • Explore", 72, 1282);

    safeTrack("mentor_share_card_downloaded", {
      card_type: "sciencedojo_method",
      tutor_id: tutor.id,
      subject: primarySubject,
    });
    downloadCanvas(canvas, `${slug}-sciencedojo-method-card.png`);
  };

  return (
    <section className="rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(135deg,#ffffff_0%,#f4fbff_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">Mentor profile sharing</p>
          <h2 className="mt-2 text-2xl font-black text-secondary">Share your ScienceDojo mentor profile</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary/55">
            Use this branded link when families ask about your tutoring. It keeps trust, booking, and questions inside ScienceDojo.
          </p>
        </div>
        {qrDataUrl && (
          <div className="w-28 rounded-2xl border border-secondary/10 bg-white p-2 shadow-sm">
            <img src={qrDataUrl} alt="Mentor profile QR code" className="h-full w-full" />
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-secondary/10 bg-white p-3">
        <p className="break-all text-sm font-bold text-secondary/65">{mentorUrl}</p>
      </div>

      {hasGenericSubjectRole && (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-xs font-bold leading-5 text-amber-800/75">
            Add subjects in Profile Settings to make your card more specific.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5"
        >
          {copyState === "copied" ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(shareCopy);
            setCopyState("copied");
            window.setTimeout(() => setCopyState("idle"), 1800);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-secondary/10 bg-white px-5 text-sm font-black text-secondary/60 transition-all hover:text-primary"
        >
          Copy share text
        </button>
        <button
          type="button"
          onClick={handleDownloadTutorCard}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-secondary/10 bg-white px-5 text-sm font-black text-secondary/60 transition-all hover:text-primary"
        >
          Download tutor card
        </button>
        <button
          type="button"
          onClick={handleDownloadMethodCard}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-secondary/10 bg-white px-5 text-sm font-black text-secondary/60 transition-all hover:text-primary"
        >
          Download ScienceDojo card
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary/35">Suggested copy</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-secondary/60">{shareCopy}</p>
      </div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </section>
  );
}
