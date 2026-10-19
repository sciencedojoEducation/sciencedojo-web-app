import assert from "node:assert/strict";
import { join } from "node:path";
import { expect } from "@playwright/test";

/** Uses the existing anonymous loopback fixture; never signs in or sends a form. */
export async function checkPublicScrollProgress(page, origin, output) {
  const screenshots = [];
  const bar = page.locator("[data-public-scroll-progress]");
  const fraction = () => bar.evaluate(node => node.getBoundingClientRect().width / innerWidth);
  const scroll = progress => page.evaluate(value => {
    const range = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    window.scrollTo({ top: Math.round(range * value), behavior: "instant" });
  }, progress);

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (const path of ["/", "/privacy", "/business", "/business/engineering"]) {
      await page.goto(`${origin}${path}`);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(bar).toHaveCount(1);
      await expect(bar).toHaveAttribute("data-scrollable", "true");
      await scroll(0);
      await expect.poll(fraction).toBeLessThan(.001);
      await scroll(.5);
      await expect.poll(async () => Math.abs(await fraction() - .5)).toBeLessThan(.01);
      const positionError = await bar.evaluate(node => {
        const header = document.querySelector("[data-public-site-header]");
        return Math.abs(node.getBoundingClientRect().top - Math.max(0, (header?.getBoundingClientRect().bottom || 0) - 2));
      });
      assert.ok(positionError < 2, `Indicator follows the actual header: ${path}`);
      assert.equal(await bar.evaluate(node => getComputedStyle(node).pointerEvents), "none");
      if (path === "/" || path === "/business/engineering") {
        const screenshot = join(output, `scroll-progress-${path === "/" ? "home" : "engineering"}-${width}.png`);
        await page.screenshot({ path: screenshot }); screenshots.push(screenshot);
      }
      await scroll(1);
      await expect.poll(fraction).toBeGreaterThan(.99);
    }
  }

  // An actual native FAQ changes document length without scrolling.
  await scroll(.5);
  await page.locator('section[aria-labelledby="faq-heading"] details').first().evaluate(node => { node.open = true; });
  await expect.poll(async () => {
    const expected = await page.evaluate(() => scrollY / (document.documentElement.scrollHeight - document.documentElement.clientHeight));
    return Math.abs(await fraction() - expected);
  }).toBeLessThan(.001);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/about`);
  await page.evaluate(() => document.fonts.ready);
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight + 200);
  await page.setViewportSize({ width: 1440, height: fullHeight });
  await expect(bar).toHaveAttribute("data-scrollable", "false");
  await expect(bar).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${origin}/privacy`);
  // Wait for the streamed page before measuring its reduced-motion scroll range.
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(bar).toHaveAttribute("data-scrollable", "true");
  await scroll(0);
  await expect.poll(fraction).toBeLessThan(.001);
  await scroll(.5);
  await expect.poll(async () => Math.abs(await fraction() - .5)).toBeLessThan(.01);
  assert.equal(await bar.evaluate(node => getComputedStyle(node).transitionDuration), "0s");
  assert.equal(await bar.evaluate(node => getComputedStyle(node).animationName), "none");

  // Exercise the real pathname gate using Next's native-history integration.
  // This is a synthetic boundary check, not an authenticated dashboard visit.
  for (const path of ["/dashboard/student", "/admin/leads", "/academy/example", "/workbooks/example", "/campus", "/login"]) {
    await page.evaluate(value => history.pushState(null, "", value), path);
    await expect(bar).toHaveCount(0);
    await page.evaluate(() => history.pushState(null, "", "/privacy"));
    await expect(bar).toHaveCount(1);
  }
  await scroll(0);
  await expect.poll(fraction).toBeLessThan(.001);
  return {
    screenshots,
    checks: ["Shared public scroll progress: exactly one on home/privacy/both business arms at desktop/phone; empty/half/full positions; actual header alignment; dynamic FAQ height; short-page hiding; resize and reduced-motion behavior; synthetic private-route removal/return"],
  };
}
