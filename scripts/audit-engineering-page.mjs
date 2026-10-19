/** Read-only, synthetic loopback audit. Never submits an enquiry or retains page/user data. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

const stage = process.argv[2] || "review";
assert.match(stage, /^[a-z-]+$/);
const origin = process.env.ENGINEERING_AUDIT_URL || "http://127.0.0.1:3105";
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname));
const output = resolve(`output/design/engineering-audit-${stage}`);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.ENGINEERING_CHROMIUM_PATH || undefined });
const report = { stage, scope: "Anonymous local page, synthetic Chromium fixture; no real form submission, certification or field performance", views: [] };
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const [width, height] of [[1440,1000],[390,844],[320,568],[768,1024]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}/business/engineering`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const result = await page.evaluate(() => {
      const visible = node => Boolean(node.getClientRects().length);
      const root = document.querySelector("[data-engineering-motion]");
      const headings = [...root.querySelectorAll("h1,h2,h3")].filter(visible).map(n => ({ level: Number(n.tagName[1]), text: n.textContent.trim() }));
      const duplicateIds = [...document.querySelectorAll("[id]")].map(n=>n.id).filter((id,i,all)=>all.indexOf(id)!==i);
      const brokenAnchors = [...root.querySelectorAll('a[href^="#"]')].map(n=>n.getAttribute("href")).filter(href=>href.length>1 && !document.getElementById(href.slice(1)));
      const unlabelledFields = [...root.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(visible).filter(n=>!n.labels?.length && !n.getAttribute("aria-label") && !n.getAttribute("aria-labelledby")).map(n=>n.id || n.tagName);
      const missingDescriptions = [...root.querySelectorAll("[aria-describedby]")].flatMap(n=>n.getAttribute("aria-describedby").split(/\s+/).filter(id=>!document.getElementById(id)));
      const imageAltMissing = [...root.querySelectorAll("img")].filter(n=>!n.hasAttribute("alt")).map(n=>n.getAttribute("src"));
      const smallControls = [...root.querySelectorAll("button,summary,select,input:not([type=hidden])")].filter(visible).map(n=>({name:n.getAttribute("aria-label") || n.textContent.trim().slice(0,65),rect:n.getBoundingClientRect()})).filter(x=>x.rect.height<44 || x.rect.width<24).map(x=>({name:x.name,width:Math.round(x.rect.width),height:Math.round(x.rect.height)}));
      const resource = performance.getEntriesByType("resource");
      const nav = performance.getEntriesByType("navigation")[0];
      return { width: innerWidth, height: innerHeight, pageHeight: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth>innerWidth+1, proofTop: Math.round(document.querySelector("#work").getBoundingClientRect().top+scrollY), contactTop: Math.round(document.querySelector("#contact").getBoundingClientRect().top+scrollY), headings, duplicateIds, brokenAnchors, unlabelledFields, missingDescriptions, imageAltMissing, smallControls, scriptCount: resource.filter(r=>r.initiatorType==="script").length, scriptEncodedBytes: resource.filter(r=>r.initiatorType==="script").reduce((sum,r)=>sum+r.encodedBodySize,0), domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd), note: "Single local fixture/cache-dependent timing and initially requested script bodies; not Core Web Vitals or intended-device proof" };
    });
    report.views.push(result);
    assert.equal(result.overflow, false);
    for (const key of ["duplicateIds","brokenAnchors","unlabelledFields","missingDescriptions","imageAltMissing"]) assert.deepEqual(result[key],[],key);
    await page.screenshot({ path: `${output}/opening-${width}.png` });
    if (width===1440 || width===390) {
      for (const id of ["problems","work","approach","team","contact"]) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        for (const image of await page.locator(`#${id} img`).all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(()=>image.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
        }
        await page.locator(`#${id}`).evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 96, behavior: "instant" }));
        await page.screenshot({ path: `${output}/${id}-${width}.png` });
      }
    }
  }
  for (const path of ["/business","/privacy","/terms"]) assert.equal((await context.request.get(`${origin}${path}`)).status(),200,path);
  console.log(JSON.stringify({output, views:report.views.map(({width,pageHeight,proofTop,contactTop,smallControls,scriptCount,scriptEncodedBytes})=>({width,pageHeight,proofTop,contactTop,smallControls,scriptCount,scriptEncodedBytes}))},null,2));
} finally {
  await writeFile(`${output}/audit.json`,JSON.stringify(report,null,2));
  await browser.close();
}
