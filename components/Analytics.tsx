import Script from "next/script";

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  // gtag.js is shared between Google Analytics (GA4) and Google Ads (AW-…).
  // Load it once and configure whichever IDs are present.
  const loaderId = gaId || adsId;

  if (!loaderId) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${gaId ? `gtag('config', '${gaId}');` : ""}
          ${adsId ? `gtag('config', '${adsId}');` : ""}
        `}
      </Script>
    </>
  );
}
