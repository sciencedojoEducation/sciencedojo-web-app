import { ImageResponse } from "next/og";
import { getTutorBySlug } from "@/lib/supabase-queries";

export const alt = "ScienceDojo Mentor Profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function getPrimarySubject(subjects?: string[]) {
  const subject = subjects?.find((item) => item.trim().length > 0);
  if (!subject) return "STEM";
  const normalized = subject.trim().toLowerCase();
  if (normalized === "math" || normalized === "maths") return "Mathematics";
  if (normalized === "programming") return "Computer Science";
  return subject.trim();
}

function PlaceholderPortrait({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "SD";

  return (
    <div
      style={{
        width: 250,
        height: 250,
        borderRadius: 46,
        background: "white",
        border: "8px solid rgba(255,255,255,0.85)",
        boxShadow: "0 24px 70px rgba(30,90,168,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 124,
          height: 124,
          borderRadius: 999,
          border: "10px solid #1E8CFF",
          color: "#071B3C",
          fontSize: 48,
          fontWeight: 950,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {initials}
      </div>
      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 22,
          borderRadius: 999,
          background: "#06C8D9",
          color: "#071B3C",
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 950,
        }}
      >
        ✓
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tutor = await getTutorBySlug(slug);
  const tutorName = tutor?.full_name || "ScienceDojo Mentor";
  const primarySubject = getPrimarySubject(tutor?.subjects);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f8fbff 0%, #eaf7ff 52%, #d9fffb 100%)",
          color: "#071B3C",
          fontFamily: "Inter, Arial, sans-serif",
          padding: 66,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -130,
            top: -130,
            width: 460,
            height: 460,
            borderRadius: 999,
            background: "rgba(30, 90, 168, 0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 86,
            bottom: 68,
            width: 210,
            height: 210,
            borderRadius: 999,
            border: "14px solid rgba(111, 227, 214, 0.35)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 1, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  background: "linear-gradient(135deg, #1E5AA8, #06C8D9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 30,
                  fontWeight: 900,
                }}
              >
                s
              </div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>
                science<span style={{ color: "#1175FF" }}>dojo</span><span style={{ color: "#06C8D9" }}>.</span>
              </div>
            </div>
            <div
              style={{
                borderRadius: 999,
                background: "rgba(30, 90, 168, 0.08)",
                color: "#1E5AA8",
                padding: "12px 18px",
                fontSize: 20,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              ScienceDojo Verified Tutor
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 54 }}>
            <div style={{ maxWidth: 760 }}>
              <div style={{ fontSize: 68, lineHeight: 1.02, fontWeight: 950, letterSpacing: -3 }}>
                Your child understands more than their grades show.
              </div>
              <div style={{ marginTop: 24, fontSize: 32, color: "#334B6F", fontWeight: 800 }}>
                Personalised support for {primarySubject} students.
              </div>
              <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 30, color: "#071B3C", fontWeight: 950 }}>
                  Meet {tutorName}
                </div>
                <div style={{ fontSize: 24, color: "#1E5AA8", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.6 }}>
                  ScienceDojo Verified Tutor
                </div>
              </div>
            </div>

            {tutor?.avatar_url ? (
              <img
                src={tutor.avatar_url}
                alt={tutorName}
                width={250}
                height={250}
                style={{
                  width: 250,
                  height: 250,
                  borderRadius: 46,
                  objectFit: "cover",
                  border: "8px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 24px 70px rgba(30,90,168,0.18)",
                }}
              />
            ) : (
              <PlaceholderPortrait name={tutorName} />
            )}
          </div>

          <div style={{ display: "flex", gap: 16, fontSize: 22, fontWeight: 800, color: "#334B6F" }}>
            <span>Book</span>
            <span style={{ color: "#1E5AA8" }}>•</span>
            <span>Ask</span>
            <span style={{ color: "#1E5AA8" }}>•</span>
            <span>Explore</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
