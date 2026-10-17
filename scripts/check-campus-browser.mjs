/** Disposable loopback fixture: real campus UI + Colyseus; synthetic course, no production auth bypass. */
import { createServer } from "node:http";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { createCampusServer } from "../services/campus-server/server.mjs";

const directory = await mkdtemp(join(tmpdir(), "sciencedojo-campus-browser-"));
const origin = "http://127.0.0.1:3012",
  serviceKey = randomBytes(32).toString("hex");
const identities = new Map(),
  tickets = new Map();
let next = 0;
const identity = () => {
  const n = ++next;
  return {
    id: `40000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
    pseudonym: `Quiet Maple aaaa${String(n).padStart(2, "0")}`,
    colour: n % 5,
    blocked: [],
  };
};
await build({
  stdin: {
    contents: `import React from "react";import {createRoot} from "react-dom/client";
       import Campus from "./components/campus/CampusClient";
       import Boundary from "./components/campus/CampusDocumentBoundary";
       if(location.pathname==="/privacy-entry-fixture"){
         window.gtag=()=>{};window.fbq=()=>{};
         new MutationObserver(()=>{if(document.querySelector(".campus-shell"))sessionStorage.setItem("fixture-private-ui-with-tags","yes")})
           .observe(document.getElementById("root"),{childList:true,subtree:true});
         history.pushState({},"","/campus");
       }
       createRoot(document.getElementById("root")).render(<Boundary><Campus dashboardHref="/dashboard/student" courses={[{key:"fixture",title:"Synthetic test course"}]}/></Boundary>);`,
    loader: "tsx",
    resolveDir: process.cwd(),
  },
  bundle: true,
  jsx: "automatic",
  platform: "browser",
  format: "esm",
  banner: { js: 'globalThis.process={env:{NODE_ENV:"development"}};' },
  outfile: join(directory, "app.js"),
  define: { "process.env.NODE_ENV": '"development"' },
});
const wireFrames = [],
  ticketReads = [],
  issuedTickets = [];
const errors = [],
  result = {
    fixture: "Synthetic UI/course fixture with real Colyseus WebSockets",
    checks: [],
    screenshots: [],
  };
let campus, browser;
const http = createServer(async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const path = new URL(req.url, origin).pathname;
    if (path === "/app.js" || path === "/app.css") {
      res.setHeader(
        "content-type",
        path.endsWith("js") ? "text/javascript" : "text/css",
      );
      return res.end(await readFile(join(directory, path.slice(1))));
    }
    if (path === "/api/campus/admission") {
      const who = identity();
      identities.set(who.id, who);
      const ticket = randomBytes(32).toString("hex");
      tickets.set(ticket, who);
      res.setHeader(
        "set-cookie",
        `fixture=${who.id}; HttpOnly; SameSite=Strict; Path=/`,
      );
      res.setHeader("content-type", "application/json");
      return res.end(
        JSON.stringify({
          ticket,
          endpoint: "ws://127.0.0.1:2569",
          room: "library",
        }),
      );
    }
    if (path === "/api/campus/safety") {
      const own = /fixture=([0-9a-f-]+)/.exec(req.headers.cookie || "")?.[1];
      let body = "";
      for await (const chunk of req) body += chunk;
      const action = JSON.parse(body),
        who = identities.get(own);
      if (!who) {
        res.statusCode = 403;
        return res.end("{}");
      }
      if (action.action === "block") who.blocked.push(action.target);
      if (action.action === "unblock")
        who.blocked = who.blocked.filter((id) => id !== action.target);
      res.setHeader("content-type", "application/json");
      return res.end('{"saved":true}');
    }
    if (path.startsWith("/dashboard/academy/")) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end(
        "<!doctype html><html><body><h1>Synthetic course fixture</h1><p>This checks frame retention; it is not a real enrolled Academy course.</p><label>Practice answer <input id=\"answer\"></label><button onclick=\"localStorage.setItem('fixture-progress',document.getElementById('answer').value);document.getElementById('status').textContent='Saved'\">Save progress</button><p id=\"status\"></p></body></html>",
      );
    }
    if (path === "/dashboard/student") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end("<!doctype html><html><body><h1>Synthetic personal dashboard</h1><p>Existing dashboard destination; no real learner data.</p></body></html>");
    }
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(
      '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body style="margin:0"><p style="margin:0;padding:9px;text-align:center;background:#e5e9da;color:#25483d;font:12px Arial">LOCAL PREVIEW · SYNTHETIC ACCOUNTS AND COURSE · NOT A LIVE PILOT</p><div id="root"></div><script type="module" src="/app.js"></script></body></html>',
    );
  } catch {
    res.statusCode = 500;
    res.end("Fixture error");
  }
});
try {
  await new Promise((resolve) => http.listen(3012, "127.0.0.1", resolve));
  campus = await createCampusServer({
    port: 2569,
    origin,
    serviceKey,
    verify: async (t) => {
      const who = tickets.get(t);
      tickets.delete(t);
      return who;
    },
    refresh: async (id) => identities.get(id),
  });
  if (process.argv.includes("--preview")) {
    console.log(
      "Local campus preview: " +
        origin +
        " — synthetic accounts and course only; not a live pilot.",
    );
    await new Promise((resolve) => {
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    });
  } else {
    browser = await chromium.launch({
      executablePath: process.env.CAMPUS_CHROMIUM_PATH || undefined,
      headless: true,
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    });
    const privateContext = await browser.newContext();
    const privatePage = await privateContext.newPage();
    await privatePage.goto(`${origin}/privacy-entry-fixture`);
    await privatePage
      .getByRole("button", { name: "Enter library", exact: true })
      .waitFor();
    if (
      !(await privatePage.evaluate(
        () =>
          typeof window.gtag === "undefined" &&
          typeof window.fbq === "undefined" &&
          new URL(performance.getEntriesByType("navigation")[0].name)
            .pathname === "/campus" &&
          !sessionStorage.getItem("fixture-private-ui-with-tags"),
      ))
    )
      throw new Error("Public tracking document was reused for private study");
    result.checks.push(
      "SPA entry from a public document reloads before campus content appears; previous marketing globals are absent",
    );
    await privateContext.close();
    const fallbackContext = await browser.newContext();
    await fallbackContext.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (
          kind === "webgl" ||
          kind === "webgl2" ||
          kind === "experimental-webgl"
        )
          return null;
        return Reflect.apply(getContext, this, [kind, ...args]);
      };
    });
    const fallbackPage = await fallbackContext.newPage();
    fallbackPage.on("pageerror", (error) =>
      errors.push("No-WebGL: " + error.message),
    );
    await fallbackPage.goto(origin);
    await fallbackPage
      .getByText("3D is unavailable on this device.", { exact: true })
      .waitFor({ timeout: 10000 });
    if (
      (await fallbackPage
        .getByRole("link", {
          name: "Open your courses directly →",
          exact: true,
        })
        .getAttribute("href")) !== "/dashboard/academy"
    )
      throw new Error("Missing authorized course fallback");
    result.checks.push(
      "No-WebGL browser shows a direct Academy fallback without an uncaught exception",
    );
    await fallbackContext.close();
    const aContext = await browser.newContext({
        viewport: { width: 1440, height: 1050 },
      }),
      bContext = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
    const a = await aContext.newPage(),
      b = await bContext.newPage();
    for (const page of [a, b]) {
      page.on("websocket", (socket) => {
        for (const kind of ["framesent", "framereceived"])
          socket.on(kind, (frame) =>
            wireFrames.push(
              Buffer.isBuffer(frame.payload)
                ? frame.payload
                : Buffer.from(frame.payload),
            ),
          );
      });
      page.on("response", (response) => {
        if (new URL(response.url()).pathname === "/api/campus/admission")
          ticketReads.push(
            response.json().then((body) => issuedTickets.push(body.ticket)),
          );
      });
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.error("Browser error:", e.message);
      });
      await page.goto(origin);
      await page
        .getByRole("button", { name: "Enter library", exact: true })
        .click();
      await page
        .getByText("In the library · walking", { exact: true })
        .waitFor();
    }
    await a.getByText("2 here", { exact: true }).waitFor();
    result.checks.push(
      "Two browser contexts join the same real room with pseudonyms",
    );
    await a.getByRole("button", { name: "Controls", exact: true }).click();
    const forward = a.getByRole("button", { name: "Walk forward", exact: true });
    const me = campus.room.world.players.values().next().value;
    for (const activate of [() => forward.click(), () => forward.press("Enter")]) {
      const before = me.z;
      await activate();
      await new Promise((resolve) => setTimeout(resolve, 650));
      if (me.z >= before - 0.3) throw new Error("Direction button activation did not move");
      const stopped = me.z;
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (Math.abs(me.z - stopped) > 0.05) throw new Error("Direction step did not stop");
    }
    result.checks.push("Pointer taps and native keyboard button activation move a bounded step and stop");
    const stage = a.getByRole("region", { name: /3D library/ });
    await stage.focus();
    await a.keyboard.down("ArrowUp");
    await new Promise((resolve) => setTimeout(resolve, 1400));
    await a.keyboard.up("ArrowUp");
    if (me.z > 0) throw new Error("Keyboard movement did not reach the desks");
    await a.getByRole("button", { name: "Desk 2 Sit →", exact: true }).click();
    await a
      .getByRole("button", { name: "Open Study Hub", exact: true })
      .waitFor({ state: "visible" });
    await a.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll("button")).find(
          (e) => e.textContent === "Open Study Hub",
        )?.disabled,
    );
    await a
      .getByRole("button", { name: "Open Study Hub", exact: true })
      .click();
    await a.getByText("VIRTUAL SCIENCEDOJO · BETA", { exact: true }).waitFor();
    const dashboardOpened = aContext.waitForEvent("page");
    await a.getByRole("link", { name: "My dashboard · opens a new tab ↗", exact: true }).click();
    const dashboard = await dashboardOpened;
    await dashboard.getByRole("heading", { name: "Synthetic personal dashboard" }).waitFor();
    if (new URL(dashboard.url()).pathname !== "/dashboard/student")
      throw new Error("Computer did not open the personal dashboard");
    if (!(await dashboard.evaluate(() => window.opener === null)))
      throw new Error("Dashboard tab retained an opener");
    await dashboard.close();
    if (!(await a.locator("dialog").evaluate((dialog) => dialog.open)))
      throw new Error("Opening the existing dashboard replaced the beta");
    result.checks.push("Optional beta computer opens the existing personal dashboard in a separate tab while retaining the library and Study Hub");
    await a.screenshot({ path: join(directory, "hub-desktop.png") });
    result.screenshots.push(join(directory, "hub-desktop.png"));
    await a.setViewportSize({ width: 390, height: 844 });
    if (await a.locator("dialog").evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth))
      throw new Error("Phone Study Hub has horizontal overflow");
    await a.screenshot({ path: join(directory, "hub-phone.png") });
    result.screenshots.push(join(directory, "hub-phone.png"));
    await a.setViewportSize({ width: 1440, height: 1050 });
    await a.getByRole("checkbox").check();
    await a
      .getByRole("button", { name: "Synthetic test course Open course →" })
      .click();
    const course = a.frameLocator('iframe[title="Your Academy course"]');
    await course
      .getByRole("textbox", { name: "Practice answer" })
      .fill("campus-wire-answer-canary-17oct");
    await course
      .getByRole("textbox", { name: "Practice answer" })
      .press("Escape");
    await a.waitForFunction(
      () => !document.querySelector("dialog")?.open,
      undefined,
      { timeout: 2000 },
    );
    if (
      !(await a
        .getByRole("button", { name: "Open Study Hub", exact: true })
        .evaluate((e) => e === document.activeElement))
    )
      throw new Error("Study Hub did not return keyboard focus");
    await a
      .getByRole("button", { name: "Open Study Hub", exact: true })
      .click();
    if (
      (await course
        .getByRole("textbox", { name: "Practice answer" })
        .inputValue()) !== "campus-wire-answer-canary-17oct"
    )
      throw new Error("Closing hub discarded work");
    await course.getByRole("button", { name: "Save progress" }).click();
    await course.getByText("Saved", { exact: true }).waitFor();
    await a.getByRole("button", { name: "Return to library →" }).click();
    await a.getByRole("button", { name: "Stand up", exact: true }).click();
    await a.getByText("In the library · walking", { exact: true }).waitFor();
    result.checks.push(
      "Keyboard walk, sit, Study Hub, identity notice, save, close/reopen retention and stand",
    );
    await a.getByRole("button", { name: "Desk 2 Sit →", exact: true }).click();
    await a.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll("button")).find(
          (e) => e.textContent === "Open Study Hub",
        )?.disabled,
    );
    await a
      .getByRole("button", { name: "Open Study Hub", exact: true })
      .click();
    const removal = await fetch("http://127.0.0.1:2569/remove/" + me.id, {
      method: "POST",
      headers: { authorization: "Bearer " + serviceKey },
    });
    if (removal.status !== 204)
      throw new Error("Authenticated moderator removal failed");
    await a.waitForFunction(() =>
      document.body.textContent.includes(
        "Disconnected — your course stays open",
      ),
    );
    if (
      (await course
        .getByRole("textbox", { name: "Practice answer" })
        .inputValue()) !== "campus-wire-answer-canary-17oct"
    )
      throw new Error("Transport loss discarded course input");
    await a.getByRole("button", { name: "Return to library →" }).click();
    await a.getByText("0 here", { exact: true }).waitFor();
    if (await a.getByRole("button", { name: /Your seat/ }).count())
      throw new Error("Disconnected UI retained a seat claim");
    await a.getByRole("button", { name: "Open Study Hub", exact: true }).click();
    if ((await course.getByRole("textbox", { name: "Practice answer" }).inputValue()) !== "campus-wire-answer-canary-17oct")
      throw new Error("Offline Hub reopen discarded course input");
    await a.getByRole("button", { name: "Return to library →" }).click();
    await a.getByRole("button", { name: "Enter library", exact: true }).click();
    await a.getByText("In the library · walking", { exact: true }).waitFor();
    if (campus.room.world.players.has(me.id))
      throw new Error("Dropped presence retained its seat");
    result.checks.push(
      "Authenticated moderator removal clears stale presence/seat UI, permits offline Hub reopen with retained input and fresh admission",
    );
    await a.getByRole("button", { name: "Block", exact: true }).click();
    await a.getByText("1 here", { exact: true }).waitFor();
    await a.getByText(/Blocked participants/).click();
    await a.getByRole("button", { name: "Unblock participant 1" }).click();
    await a.getByText("2 here", { exact: true }).waitFor();
    await a.getByRole("button", { name: "Report", exact: true }).click();
    await a.getByText(/Report saved for the session moderator/).waitFor();
    result.checks.push(
      "Block/unblock filtering and report confirmation in UI fixture",
    );
    await a.screenshot({
      path: join(directory, "desktop.png"),
      fullPage: true,
    });
    result.screenshots.push(join(directory, "desktop.png"));
    await a.setViewportSize({ width: 390, height: 844 });
    await a.screenshot({ path: join(directory, "phone.png"), fullPage: true });
    result.screenshots.push(join(directory, "phone.png"));
    if (
      await a.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
      throw new Error("Phone horizontal overflow");
    result.checks.push("390px layout has no horizontal overflow");
    await a.getByRole("button", { name: "Leave", exact: true }).click();
    await a.getByRole("button", { name: "Enter library", exact: true }).click();
    await a.getByText("In the library · walking", { exact: true }).waitFor();
    result.checks.push("Leave and fresh admission restore standing presence");
    await Promise.all(ticketReads);
    const combined = Buffer.concat(wireFrames);
    if (!wireFrames.length || !issuedTickets.length)
      throw new Error("Wire observation missing");
    for (const canary of [
      "Synthetic test course",
      "/dashboard/academy/fixture",
      "/dashboard/student",
      "campus-wire-answer-canary-17oct",
      ...issuedTickets,
    ])
      if (combined.includes(Buffer.from(canary)))
        throw new Error(
          "Private study data or admission ticket found in world frames",
        );
    result.checks.push(
      "Wire audit: " +
        wireFrames.length +
        " WebSocket frames inspected; no dashboard/course path, course title, answer canary or issued admission ticket found",
    );
    if (errors.length) throw new Error(errors.join("\n"));
    result.checks.push("No uncaught browser errors");
    await writeFile(
      join(directory, "evidence.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(
      JSON.stringify(
        { ...result, evidence: join(directory, "evidence.json") },
        null,
        2,
      ),
    );
  }
} finally {
  await browser?.close();
  await campus?.close();
  http.closeAllConnections();
  await new Promise((resolve) => http.close(resolve));
}
