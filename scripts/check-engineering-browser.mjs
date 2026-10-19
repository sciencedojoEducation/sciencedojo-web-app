/** Actual Next route acceptance. Only invalid form submissions; no live enquiry or email. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { chromium, expect } from "@playwright/test";
import { checkPublicScrollProgress } from "./check-public-scroll-progress.mjs";

const output = await mkdtemp(join(tmpdir(), "sciencedojo-engineering-browser-"));
const urlIndex = process.argv.indexOf("--url");
let server, browser;
const evidence = { fixture: "Actual Next.js engineering route; synthetic local browser checks; no valid enquiry submitted", checks: [], screenshots: [] };
let origin = urlIndex >= 0 ? process.argv[urlIndex + 1] : null;
if (origin && !["127.0.0.1", "localhost", "[::1]"].includes(new URL(origin).hostname)) throw new Error("Only loopback acceptance targets are allowed");
try {
  if (!origin) {
    const portProbe = createServer();
    await new Promise(resolve => portProbe.listen(0, "127.0.0.1", resolve));
    const port = portProbe.address().port;
    await new Promise(resolve => portProbe.close(resolve));
    origin = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: "ignore", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://synthetic.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "synthetic-public-key" } });
  }
  const route = `${origin}/business/engineering`;
  const deadline = Date.now() + 120000;
  while (true) {
    if (server?.exitCode != null) throw new Error("Acceptance server exited before readiness");
    try { if ((await fetch(route, { signal: AbortSignal.timeout(5000) })).ok) break; } catch (error) {
      if (error.cause?.code === "EPERM") throw new Error("Local loopback access is blocked by the execution sandbox", { cause: error });
      /* Poll owned local server while it starts. */
    }
    if (Date.now() > deadline) throw new Error("Local engineering route did not become ready");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ executablePath: process.env.ENGINEERING_CHROMIUM_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydration|hydrated|didn't match|does not match/i.test(message.text())) errors.push(message.text()); });
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Better websites.Useful software.Connected work.");
  assert.equal(await page.locator("main").count(), 1);
  assert.equal(await page.locator("header").count(), 1);
  await expect(page).toHaveTitle("Websites, Web Apps & Integrations | ScienceDojo Engineering");
  await expect(page.locator('input[name="submissionToken"]')).toHaveValue(/^[a-f0-9-]{36}$/);
  const motion = page.locator("[data-engineering-motion]");
  await expect(motion).toHaveAttribute("data-motion", "on");
  const artwork = page.locator("figure[data-animate]").first();
  await expect(artwork).toHaveAttribute("data-in-view", "true");
  const floating = artwork.locator('[class*="visualFloat"]').first();
  await expect.poll(() => floating.evaluate(node => getComputedStyle(node).animationPlayState)).toBe("running");
  const tilt = page.locator("[data-tilt]");
  const artBounds = await tilt.boundingBox();
  assert.ok(artBounds);
  await page.mouse.move(artBounds.x + artBounds.width * .8, artBounds.y + artBounds.height * .6);
  await expect.poll(() => tilt.evaluate(node => node.style.getPropertyValue("--tilt-y"))).not.toBe("");
  await page.getByRole("button", { name: "Pause visual motion", exact: true }).click();
  await expect(motion).toHaveAttribute("data-motion", "off");
  await expect.poll(() => floating.evaluate(node => getComputedStyle(node).animationPlayState)).toBe("paused");
  assert.equal(await tilt.evaluate(node => node.style.getPropertyValue("--tilt-y")), "");
  await page.getByRole("button", { name: "Play visual motion", exact: true }).click();
  await expect(motion).toHaveAttribute("data-motion", "on");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(motion).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("button", { name: "Reduced motion enabled", exact: true })).toBeDisabled();
  assert.equal(await floating.evaluate(node => getComputedStyle(node).animationName), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(motion).toHaveAttribute("data-motion", "on");
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(motion).toHaveAttribute("data-motion", "off");
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
  await expect(motion).toHaveAttribute("data-motion", "on");
  evidence.checks.push("Visual motion pause/resume, pointer-tilt cleanup, live reduced-motion preference and synthetic hidden-document pause");
  assert.match(await page.locator('link[rel="canonical"]').getAttribute("href"), /\/business\/engineering$/);
  const image = await context.request.get(`${route}/opengraph-image`);
  assert.equal(image.status(), 200);
  assert.match(image.headers()["content-type"], /image\/png/);
  const opening = join(output, "opening-desktop.png");
  await page.screenshot({ path: opening }); evidence.screenshots.push(opening);
  evidence.checks.push("Anonymous direct entry, single main/header, engineering metadata and PNG share image");
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await noJs.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(staticPage.locator("noscript").getByText(/Email your brief/)).toBeAttached();
  await expect(staticPage.locator("#problems")).toContainText("Someone finds the right course");
  await expect(staticPage.locator("#work")).toContainText("In-house product");
  await expect(staticPage.locator("[data-visual-motion-toggle]")).toBeHidden();
  await expect(staticPage.locator("[data-public-scroll-progress]")).toBeHidden();
  evidence.checks.push("No-JavaScript opening, explanatory default example and email fallback");
  await noJs.close();
  for (const [width, height] of [[320,667],[390,844],[768,1024],[1280,900],[1440,1000],[390,568]]) {
    await page.setViewportSize({ width, height });
    await page.goto(route);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}×${height}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const brand = page.getByRole("link", { name: "ScienceDojo Engineering home" });
    const wordmark = await brand.locator(":scope > span").boundingBox();
    const descriptor = await brand.locator("small").boundingBox();
    assert.ok(wordmark && descriptor && descriptor.y >= wordmark.y + wordmark.height && Math.abs(descriptor.x - wordmark.x) < 1, `Engineering sits below its wordmark at ${width}`);
    await expect(page.getByRole("img", { name: /Concept illustration: one continuous route/ })).toBeVisible();
    const path = join(output, `${width}-${height}.png`);
    await page.screenshot({ path, fullPage: true }); evidence.screenshots.push(path);
  }
  evidence.checks.push("No page overflow at 320, 390, 768, 1280, 1440 and short-phone viewports");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile engineering navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Mobile engineering navigation" })).toBeHidden();
  evidence.checks.push("Mobile menu focus, Escape dismissal and return");
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const name of ["reliable-workflow", "studio-process"]) {
    const art = page.locator(`img[src*="${name}"]`);
    await art.scrollIntoViewIfNeeded();
    await expect.poll(() => art.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await page.locator("#work").scrollIntoViewIfNeeded();
  await expect(artwork).toHaveAttribute("data-in-view", "false");
  await expect.poll(() => floating.evaluate(node => getComputedStyle(node).animationPlayState)).toBe("paused");
  const artworkScreen = join(output, "visual-work-desktop.png");
  await page.screenshot({ path: artworkScreen }); evidence.screenshots.push(artworkScreen);
  evidence.checks.push("Adapted connected-interface SVG and two original supporting images load; offscreen decorative motion pauses");
  await page.getByRole("navigation", { name: "Engineering navigation", exact: true }).getByRole("link", { name: "Services", exact: true }).click();
  await expect.poll(async () => {
    const position = await page.locator("#problems-heading").boundingBox();
    return Boolean(position && position.y >= 88 && position.y < 900);
  }, { message: "Problem heading clears the sticky header after anchor navigation" }).toBe(true);
  for (const [label, asset] of [["Learner view", "student"], ["Parent view", "parent"], ["Tutor view", "tutor"]]) {
    const choice = page.getByRole("button", { name: label, exact: true });
    await choice.focus();
    await page.keyboard.press("Enter");
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    const screenshot = page.locator("[data-product-views] img:visible");
    await expect(screenshot).toHaveAttribute("src", new RegExp(`${asset}-home`));
    await expect(screenshot).toBeVisible();
    await expect.poll(() => screenshot.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await expect(page.getByRole("link", { name: "ScienceDojo Engineering home" })).toHaveAttribute("href", "/business/engineering");
  await expect(page.getByRole("navigation", { name: "Engineering navigation", exact: true }).getByRole("link", { name: /Instructional design/ })).toHaveAttribute("href", "/business/instructional-design");
  for (const name of ["Piumal", "Tharindu", "Yelka"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const people = page.locator("[data-engineering-team]");
  await expect(people.locator("img")).toHaveCount(3);
  for (const [width, height] of [[1440,1000], [390,844]]) {
    await page.setViewportSize({ width, height });
    for (const name of ["Piumal", "Tharindu", "Yelka"]) {
      const portrait = people.getByRole("img", { name: `Illustrated portrait of ${name}`, exact: true });
      await portrait.scrollIntoViewIfNeeded();
      await expect.poll(() => portrait.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const box = await portrait.boundingBox();
      assert.ok(box && Math.abs(box.width - box.height) < 2, `${name} portrait keeps its square framing`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const teamScreen = join(output, `team-${width}.png`);
    await people.screenshot({ path: teamScreen }); evidence.screenshots.push(teamScreen);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  evidence.checks.push("Three illustrated team portraits load with square framing on desktop/phone; no raw photographs or page overflow");
  assert.equal(await page.locator('img[src*="clipboard"]').count(), 0);
  evidence.checks.push("Three actual sample-data product views load and switch by keyboard; explicit arm navigation, visible anchor heading and confirmed team roles");
  const explorer = page.locator("[data-engineering-explorer]");
  assert.ok(await page.locator("#problems").evaluate(node => Boolean(node.compareDocumentPosition(document.querySelector("#work")) & Node.DOCUMENT_POSITION_FOLLOWING)));
  const scope = explorer.getByText("Explore a possible first step", { exact: false });
  await scope.click();
  await expect(explorer.locator("details").filter({ hasText: "Explore a possible first step" })).toHaveAttribute("open", "");
  await scope.press("Enter");
  await expect(explorer.locator("details").filter({ hasText: "Explore a possible first step" })).not.toHaveAttribute("open", "");
  const exercise = explorer.locator("[data-demo-disclosure]");
  const tryExample = () => exercise.locator("summary");
  await expect(exercise).not.toHaveAttribute("open", "");
  await expect(explorer.getByText("A possible first project", { exact: true })).toBeVisible();
  const selectionUrl = page.url();
  for (const [prompt, category] of [["Make our website clearer", "Websites & enquiries"], ["Improve our application", "Web applications"], ["Connect our everyday tools", "Integrations & workflows"]]) {
    const choice = explorer.getByRole("button", { name: new RegExp(prompt) });
    await choice.focus();
    await choice.press("Enter");
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(choice.locator("small")).toHaveText(category);
    assert.equal(page.url(), selectionUrl, "Problem choices update the example without navigating");
    assert.equal(await explorer.locator('button[aria-pressed="true"]').count(), 1);
  }
  evidence.checks.push("Recognisable service prompts work by keyboard, retain category context and select exactly one on-page example without navigating");
  const cases = [["Website journey", "workflow", "Keep course context & retry"], ["Learner experience", "application", "Restore saved step & retry"], ["Connected operations", "integration", "Keep enquiry & retry"]];
  for (const [label, value, retry] of cases) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await expect(explorer.locator("[data-scenario-visual]")).toHaveAttribute("data-scenario-visual", value);
    await expect(page.locator("#engineering-interest")).toHaveValue(value);
    await tryExample().click();
    await expect(exercise).toHaveAttribute("open", "");
    await page.getByRole("button", { name: "Run example", exact: true }).click();
    await expect(explorer).toHaveAttribute("data-phase", "complete");
    await page.getByLabel(/Where should the course link lead|What should the learner see first|What happens before the email is sent/).selectOption("incomplete");
    await page.getByRole("button", { name: "Run example", exact: true }).click();
    await expect(explorer).toHaveAttribute("data-phase", "blocked");
    await page.getByRole("button", { name: retry, exact: true }).click();
    await expect(explorer).toHaveAttribute("data-phase", "complete");
    await page.getByRole("button", { name: "Show recovery" }).click();
    await expect(explorer).toHaveAttribute("data-phase", "blocked");
    await page.getByRole("button", { name: retry, exact: true }).click();
    await expect(explorer).toHaveAttribute("data-phase", "complete");
    await page.getByRole("button", { name: "Reset example" }).click();
    await expect(explorer).toHaveAttribute("data-phase", "ready");
  }
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await page.getByRole("button", { name: /Learner experience/ }).click();
  await expect(explorer).toHaveAttribute("data-phase", "ready");
  await expect(exercise).not.toHaveAttribute("open", "");
  await page.waitForTimeout(1000); // Detect stale completion after the old attempt's deadline.
  await expect(explorer).toHaveAttribute("data-phase", "ready");
  await tryExample().press("Enter");
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await tryExample().click();
  await expect(explorer).toHaveAttribute("data-phase", "ready");
  await page.waitForTimeout(1000);
  await expect(explorer).toHaveAttribute("data-phase", "ready");
  await tryExample().press("Enter");
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.waitForTimeout(1000);
  await expect(explorer).toHaveAttribute("data-phase", "ready");
  evidence.checks.push("Explicit service labels and first-project scope; optional demo keyboard disclosure/close cancellation; three decisions, recovery, correction, reset and stale-result cancellation");
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await page.locator("#contact-heading").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await expect(explorer).toHaveAttribute("data-phase", "checking");
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer).toHaveAttribute("data-phase", "complete");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Reset example" }).click();
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await expect(explorer).toHaveAttribute("data-phase", "complete");
  evidence.checks.push("Offscreen simulation pauses and resumes; reduced-motion completion works");
  for (const question of ["How do you estimate cost and timing?", "What happens to the source, accounts and handover?", "What happens after delivery?", "How will we know the work is ready?", "Do you provide general IT support?"]) {
    const answer = page.locator("summary").filter({ hasText: question });
    await answer.press("Enter");
    await expect(answer.locator("..")).toHaveAttribute("open", "");
    await answer.press("Enter");
  }
  await page.getByText("Not sure what to write?", { exact: true }).press("Enter");
  await expect(page.getByText("Fictional example brief", { exact: true })).toBeVisible();
  await expect(page.getByText("A focused project", { exact: true })).toBeVisible();
  await expect(page.getByText("Continuing development", { exact: true })).toBeVisible();
  evidence.checks.push("Engagement choices, estimation/handover/quality/support FAQ keyboard use and fictional brief guidance");
  await expect(page.locator("#engineering-organisation")).toHaveAttribute("aria-describedby", "engineering-organisation-hint");
  await expect(page.locator("#engineering-organisation-hint")).toHaveText("Your business, team or project name.");
  await page.locator("#engineering-goal").fill("Synthetic draft retained after validation");
  await page.locator("#engineering-interest").selectOption("unsure");
  await page.getByRole("button", { name: "Send your brief" }).click();
  await expect(page.locator("form").getByRole("alert")).toBeVisible();
  await expect(page.locator("form").getByRole("alert")).toBeFocused();
  await expect(page.locator("#engineering-goal")).toHaveValue("Synthetic draft retained after validation");
  await expect(page.locator("#engineering-interest")).toHaveValue("unsure");
  await expect(page.locator("#engineering-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#engineering-organisation")).toHaveAttribute("aria-describedby", "engineering-organisation-hint engineering-organisation-error");
  await expect(page.locator("#engineering-organisation-hint")).toBeVisible();
  evidence.checks.push("Invalid server-action submission, focused error summary, editable interest and retained draft; no save attempted");
  const legacy = await context.request.get(`${origin}/business?ref=legacy`, { maxRedirects: 0 });
  assert.equal(legacy.status(), 308);
  assert.equal(new URL(legacy.headers().location, origin).pathname, "/business/instructional-design");
  assert.equal(new URL(legacy.headers().location, origin).searchParams.get("ref"), "legacy");
  await page.goto(`${origin}/business?ref=legacy#contact`);
  await expect(page).toHaveURL(`${origin}/business/instructional-design?ref=legacy#contact`);
  await page.goto(`${origin}/business/instructional-design`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/business\/instructional-design$/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /\/business\/instructional-design$/);
  const share = await context.request.get(`${origin}/business/instructional-design/opengraph-image`);
  assert.equal(share.status(), 200);
  assert.match(share.headers()["content-type"], /image\/png/);
  const oldShare = await context.request.get(`${origin}/business/opengraph-image`, { maxRedirects: 0 });
  assert.equal(oldShare.status(), 308);
  evidence.checks.push("Instructional-design canonical route, permanent legacy redirects with query/hash, new share PNG and preserved legacy share URL");
  await expect(page.getByRole("link", { name: "Engineering", exact: true })).toBeVisible();
  assert.match(await page.locator("body").innerText(), /€1,490/);
  await expect(page.locator("#learning-demo")).toBeAttached();
  const downloads = await page.locator('a[href^="/business/examples/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))]);
  assert.ok(downloads.some(link => link.endsWith(".pdf")));
  for (const path of downloads) assert.equal((await context.request.get(`${origin}${path}`)).status(), 200, path);
  await page.locator("#business-goal").fill("Synthetic route-move draft retained after invalid submission");
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(page.locator("#business-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#business-goal")).toHaveValue("Synthetic route-move draft retained after invalid submission");
  evidence.checks.push("Learning offer price, example/download responses and invalid server action with retained draft on the new route; no save attempted");
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1440,1000]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}/business/instructional-design`);
    await expect(page.locator("#business-heading")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const [label, heading] of [["The offer", "offer-heading"],["Work", "work-heading"],["Process", "process-heading"],["Studio", "about-heading"],["Discuss your project", "contact-heading"]]) {
      const desktop = page.getByRole("navigation", { name: "Business navigation", exact: true });
      if (await desktop.isVisible()) {
        if (label === "Discuss your project") await page.locator("header").getByRole("link", { name: label, exact: true }).click();
        else await desktop.getByRole("link", { name: label, exact: true }).click();
      } else {
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        await page.getByRole("navigation", { name: "Mobile business navigation", exact: true }).getByRole("link", { name: label, exact: true }).click();
      }
      await expect.poll(() => page.evaluate(id => {
        const header = document.querySelector("header").getBoundingClientRect();
        const target = document.getElementById(id).getBoundingClientRect();
        return scrollY > 100 && Math.abs(header.top) < 1 && target.top >= header.bottom && target.top < innerHeight;
      }, heading), { message: `Sticky instructional header and visible ${label} target at ${width}` }).toBe(true);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const screenshot = join(output, `instructional-sticky-${width}.png`);
    await page.screenshot({ path: screenshot }); evidence.screenshots.push(screenshot);
  }
  evidence.checks.push("Engineering descriptor below wordmark at every responsive width; instructional header stays at top with all five navigation targets visible below it on desktop/tablet/phones");
  for (const width of [320,390,768,1120,1440]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = [];
    for (const arm of ["engineering","instructional-design"]) {
      await page.goto(`${origin}/business/${arm}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      metrics.push(await page.locator("header").evaluate(header => {
        const logo = header.querySelector('a[aria-label$="home"] > span');
        const r = logo.getBoundingClientRect(), h = header.getBoundingClientRect(), d = header.querySelector("small").getBoundingClientRect();
        const type = getComputedStyle(document.querySelector("h1")), brand = getComputedStyle(logo);
        return { x:r.x,y:r.y,height:h.height,wordmarkSize:brand.fontSize,wordmarkWeight:brand.fontWeight,descriptorY:d.y,headingFamily:type.fontFamily,headingWeight:type.fontWeight,headingSize:type.fontSize,headingLine:type.lineHeight,headingTracking:type.letterSpacing };
      }));
      const shot = join(output, `business-type-${arm}-${width}.png`);
      await page.screenshot({ path: shot }); evidence.screenshots.push(shot);
      if (width < 1021) {
        await page.getByRole("button", { name: "Open menu", exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("navigation", { name: arm === "engineering" ? "Mobile engineering navigation" : "Mobile business navigation", exact: true })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
      }
    }
    assert.deepEqual(metrics[0], metrics[1], `Both business arms share rendered typography and brand/header geometry at ${width}`);
  }
  evidence.checks.push("Identical rendered hero typography, logo position/size/descriptor baseline and header height across both business arms at five widths; native mobile keyboard entry/Escape retained");
  // Main-site entry points: native disclosure + hover, keyboard and phone links.
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin);
    const trigger = page.locator("header summary").filter({ hasText: "For Business" });
    const businessMenu = trigger.locator("..");
    await expect(trigger).toBeVisible();
    await expect(businessMenu).not.toHaveAttribute("open", "");
    await trigger.hover();
    await expect(businessMenu).toHaveAttribute("open", "");
    await expect(businessMenu.getByRole("link", { name: /Instructional design/ })).toHaveAttribute("href", "/business/instructional-design");
    const engineeringLink = businessMenu.getByRole("link", { name: /Engineering/ });
    await expect(engineeringLink).toHaveAttribute("href", "/business/engineering");
    await engineeringLink.hover();
    await expect(businessMenu).toHaveAttribute("open", "");
    const navScreen = join(output, `main-business-menu-${width}.png`);
    await page.screenshot({ path: navScreen }); evidence.screenshots.push(navScreen);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    const headerFits = await page.locator("header a:visible, header summary:visible, header button:visible").evaluateAll(nodes => nodes.every(node => { const r = node.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    assert.equal(headerFits, true);
    await page.mouse.move(5, 500);
    await expect(businessMenu).not.toHaveAttribute("open", "");
    await trigger.focus();
    await trigger.press("ArrowDown");
    await expect(businessMenu.getByRole("link", { name: /Instructional design/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(engineeringLink).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(businessMenu).not.toHaveAttribute("open", "");
    await trigger.press("Enter");
    await expect(businessMenu).toHaveAttribute("open", "");
    await page.locator("h1").first().click();
    await expect(businessMenu).not.toHaveAttribute("open", "");
    await trigger.focus();
    await trigger.press("ArrowUp");
    await expect(engineeringLink).toBeFocused();
    await engineeringLink.press("Enter");
    await expect(page).toHaveURL(`${origin}/business/engineering`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Better websites.Useful software.Connected work.");
  }
  for (const [label, path] of [["Instructional design", "/business/instructional-design"], ["Engineering", "/business/engineering"]]) {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(origin);
    await page.getByLabel("Open menu", { exact: true }).click();
    const mobile = page.getByRole("dialog", { name: "Mobile navigation" });
    const business = mobile.getByRole("group", { name: "For Business" });
    await expect(business.getByRole("link", { name: "Instructional design", exact: true })).toHaveAttribute("href", "/business/instructional-design");
    await expect(business.getByRole("link", { name: "Engineering", exact: true })).toHaveAttribute("href", "/business/engineering");
    await business.scrollIntoViewIfNeeded();
    const phoneScreen = join(output, `main-business-mobile-${label === "Engineering" ? "engineering" : "instructional"}.png`);
    await page.screenshot({ path: phoneScreen }); evidence.screenshots.push(phoneScreen);
    await business.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(`${origin}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assert.equal(await page.evaluate(() => document.body.style.overflow === "hidden"), false);
  }
  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const plainPage = await plain.newPage();
  await plainPage.goto(origin);
  const plainTrigger = plainPage.locator("summary:visible").filter({ hasText: "For Business" });
  await plainTrigger.click();
  await expect(plainTrigger.locator("..").getByRole("link", { name: /Engineering/ })).toBeVisible();
  await plainTrigger.locator("..").getByRole("link", { name: /Instructional design/ }).click();
  await expect(plainPage).toHaveURL(`${origin}/business/instructional-design`);
  await plainPage.setViewportSize({ width: 390, height: 844 });
  await plainPage.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(plainPage.getByRole("navigation", { name: "Mobile business navigation", exact: true })).toBeVisible();
  await plainPage.getByRole("navigation", { name: "Mobile business navigation", exact: true }).getByRole("link", { name: "Engineering", exact: true }).click();
  await expect(plainPage).toHaveURL(`${origin}/business/engineering`);
  await plainPage.goto(`${origin}/business/engineering`);
  assert.equal(await plainPage.getByRole("navigation", { name: "Main navigation without JavaScript" }).count(), 0);
  assert.equal(await plainPage.locator("header").count(), 1);
  await plainPage.goto(`${origin}/login`);
  assert.equal(await plainPage.getByRole("navigation", { name: "Main navigation without JavaScript" }).count(), 0);
  await plain.close();
  evidence.checks.push("Main For Business disclosure: desktop hover/leave, pointer bridge, keyboard open/tab/Escape/focus and outside dismissal; 1280/1440 fit; both phone destinations and scroll cleanup; native no-script navigation");
  const publicProgress = await checkPublicScrollProgress(page, origin, output);
  evidence.checks.push(...publicProgress.checks);
  evidence.screenshots.push(...publicProgress.screenshots);
  assert.deepEqual(errors, []);
  evidence.checks.push("No browser page errors");
  evidence.passed = true;
  console.log(JSON.stringify({ passed: true, checks: evidence.checks, evidence: output }, null, 2));
} finally {
  await writeFile(join(output, "evidence.json"), JSON.stringify(evidence, null, 2));
  await browser?.close();
  if (server && server.exitCode == null) {
    server.kill("SIGTERM");
    await Promise.race([new Promise(resolve => server.once("exit", resolve)), new Promise(resolve => setTimeout(resolve, 3000))]);
    if (server.exitCode == null) server.kill("SIGKILL");
  }
}
