import { ImageResponse } from "next/og";

export const alt = "ScienceDojo Engineering — Websites, web applications and connected workflows.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function EngineeringSharingImage() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#ffffff", color: "#001a44", padding: 64, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: "-1px" }}>science<span style={{ color: "#0066ff" }}>dojo</span><span style={{ color: "#00d2ff" }}>.</span></div>
        <span style={{ fontSize: 14, letterSpacing: "3px", color: "#526579" }}>ENGINEERING</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 72, letterSpacing: "-4px", fontWeight: 700, lineHeight: 1.03 }}>
        <span>Better websites.</span><span style={{ color: "#0066ff" }}>Useful software.</span><span>Connected work.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#526579" }}><span>Websites. Web applications. Integrations.</span><span>↗</span></div>
    </div>, size,
  );
}
