export function GET() {
  return Response.json({ id: "/workbooks/aspekte-neu-b2", name: "Mein Arbeitsbuch · B2", short_name: "Arbeitsbuch", lang: "de", start_url: "/workbooks/aspekte-neu-b2", scope: "/workbooks/", display: "standalone", background_color: "#f6f8f0", theme_color: "#187456", icons: [{ src: "/workbook-icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/workbook-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }] }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
