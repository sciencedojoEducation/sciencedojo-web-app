import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ScienceDojo for Business — Onboarding Task Pilot from €1,490, subject to agreed scope";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BusinessSharingImage() {
  const artwork = await readFile(join(process.cwd(), "public/images/business/learning-design-sharing-v1.jpg"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#FFFFFF", color: "#12243A", padding: 52, gap: 40, borderBottom: "14px solid #006B70" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 530 }}>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: "-1px" }}>sciencedojo<span style={{ color: "#006B70" }}>.</span></div>
        <div style={{ display: "flex", marginTop: 7, fontSize: 13, fontWeight: 700, letterSpacing: "3px", color: "#526071" }}>FOR BUSINESS</div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 65, fontWeight: 700, lineHeight: 1.03, letterSpacing: "-2px" }}>Onboarding Task Pilot.</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 24, lineHeight: 1.4, color: "#526071" }}>Practical onboarding for IT service and software implementation teams.</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 30, fontWeight: 700, color: "#006B70" }}>From €1,490</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 16, color: "#526071" }}>Scope, delivery, dates, and applicable taxes agreed in the proposal.</div>
        <div style={{ display: "flex", marginTop: 27, fontSize: 17, color: "#12243A" }}>sciencedojo.co.uk/business</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: 510 }}>
        {/* ImageResponse renders plain image elements into the sharing image. */}
        <img src={`data:image/jpeg;base64,${artwork.toString("base64")}`} alt="" width={510} height={340} style={{ borderRadius: 12 }} />
        <div style={{ display: "flex", marginTop: 22, fontSize: 20, color: "#006B70" }}>One task. Realistic practice. A reviewable assessment.</div>
      </div>
    </div>,
    size,
  );
}
