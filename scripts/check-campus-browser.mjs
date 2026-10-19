import {gamesFixture,attachGamesApi} from "../tests/helpers/campus-games-fixture.mjs";
import {checkWortQuest} from "./campus-vocabulary-acceptance.mjs";
import {checkBoardGames} from "./campus-board-games-acceptance.mjs";
import sharp from "sharp";
import {checkLivingCube} from "./campus-living-cube-acceptance.mjs";
/** Disposable loopback fixture: real campus UI + Colyseus; synthetic course, no production auth bypass. */
import { createServer } from "node:http";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { WebSocketServer } from "ws";
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { createCampusServer } from "../services/campus-server/server.mjs";
import { runtimeFixture } from "../tests/helpers/campus-runtime-fixture.mjs";
import { runVercelCampusSession } from "../lib/campus/vercel-session.ts";
import { validServiceKey,gameAccessKey } from "../lib/campus/security.ts";
import {COURT,HOOPS,basketballAim} from "../lib/campus/basketball.ts";

const vercel = process.argv.includes("--vercel");
const shared = vercel ? await runtimeFixture(14) : null;
const checkingVocabulary=process.argv.includes('--vocabulary');
const checkingGames=process.argv.includes('--games')||checkingVocabulary;
const gameBackend=true;
let gameFixture=null,gameApi,playApi;
if(gameBackend){
 if(shared){for(const file of ['076_campus_board_games.sql','077_campus_german_vocabulary.sql','080_campus_room_games_invitations.sql'])await shared.db.exec(await readFile(new URL('../sql/'+file,import.meta.url),'utf8'));({api:gameApi,playApi}=attachGamesApi(shared,async()=>["vercel","{}"]));
  for(let n=1;n<=6;n++)await shared.db.query('UPDATE profiles SET full_name=$2,avatar_url=$3 WHERE id=$1',[`30000000-0000-0000-0000-${String(n).padStart(12,'0')}`,`Game Friend ${n}`,`https://fixture.supabase.co/storage/v1/object/public/avatars/fixture-${n}.png`]);
 }else{gameFixture=await gamesFixture(true,14);
  ({api:gameApi,playApi}=attachGamesApi(gameFixture,async()=>{
    const response=await fetch('http://127.0.0.1:2569/games-context',{headers:{authorization:`Bearer ${serviceKey}`},signal:AbortSignal.timeout(1500)});
    if(!response.ok)throw new Error('Live context unavailable');return ['colyseus',JSON.stringify(await response.json())];
  }));}
}
const fixturePictures=gameBackend?await Promise.all(['#167c79','#b95e47','#7461a2','#8c710e','#467bad','#b28460'].map(background=>sharp({create:{width:40,height:40,channels:3,background}}).png().toBuffer())):[];

const directory = await mkdtemp(join(tmpdir(), "sciencedojo-campus-browser-"));
const origin = "http://127.0.0.1:3012",
  serviceKey = randomBytes(32).toString("hex");
const identities = new Map(),
  tickets = new Map();
const gameKeys=new Map(),gameCanaries=new Set();
const runtimeSockets = new Map(), runtimeDurations = [];
const stalledRenewals = new Set();
const quietSnapshots = new Set();
let stalledEntries = 0;
let next = 0;
const identity = () => {
  const n = ++next;
  if (shared || gameFixture) {
    const members=shared?.members??gameFixture.identities;
    if (!members[n - 1]) throw new Error("Synthetic account fixture exhausted");
    return { ...members[n - 1], blocked: [] };
  }
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
const sourcePaths=['app/api/campus/play/route.ts','app/api/campus/admission/route.ts','lib/campus/board-game-server.ts',
 'app/api/campus/service/route.ts','services/campus-server/index.mjs','lib/campus/game-context.ts','lib/campus/game-location.ts','scripts/check-campus-browser.mjs','scripts/campus-board-games-acceptance.mjs','scripts/campus-vocabulary-acceptance.mjs','components/campus/CampusClient.tsx','components/campus/BoardGames.tsx','components/campus/PlayTogether.tsx',
 'components/campus/campus.css','components/campus/play-together.css','lib/campus/board-game-api.ts','lib/campus/play-api.ts',
 'lib/campus/connection.ts','lib/campus/security.ts','services/campus-server/server.mjs','sql/080_campus_room_games_invitations.sql'];
const sourceHashes=Object.fromEntries(await Promise.all(sourcePaths.map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
const wireFrames = [],
  ticketReads = [],
  issuedTickets = [],
  handshakeHashes = [];
const errors = [],
  result = {
    sourceHashes,
    fixture: vercel ? "Synthetic UI/course fixture with independent WebSocket handlers and shared SQL runtime" : "Synthetic UI/course fixture with real Colyseus WebSockets",
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
    if(gameBackend&&(path.startsWith('/api/campus/games')||path==='/api/campus/play')){
      const own=/fixture=([0-9a-f-]+)/.exec(req.headers.cookie||'')?.[1];
      const members=shared?.members??gameFixture.identities;
      const account=members.findIndex(m=>m.id===own)+1;
      let data='';for await(const chunk of req)data+=chunk;
      const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,body:data||undefined});
      const api=path==='/api/campus/play'?playApi(account):gameApi(account,async source=>new Response(fixturePictures[(Number(String(source).match(/(\d+)\.png$/)?.[1])||1)-1],{headers:{'content-type':'image/png'}}));
      const reply=await api[path.endsWith('/photo')?'PHOTO':req.method](request);
      const bytes=Buffer.from(await reply.arrayBuffer());
      if(path==='/api/campus/play'&&reply.ok){const body=JSON.parse(bytes.toString());if(body.invitation)gameCanaries.add(body.invitation.id);}
      res.writeHead(reply.status,Object.fromEntries(reply.headers));return res.end(bytes);
    }
    if (path === "/api/campus/admission") {
      let renewal = false;
      if (shared) {
        let body = ""; for await (const chunk of req) body += chunk;
        renewal = Boolean(body && JSON.parse(body).renew === true);
      }
      const previous = /fixture=([0-9a-f-]+)/.exec(req.headers.cookie || "")?.[1];
      if (shared && !renewal && stalledEntries > 0) { stalledEntries--; return; }
      if (shared && renewal && stalledRenewals.has(previous)) {
        // Deliberately send no headers/body: the browser must bound a hung admission request.
        res.once("close", () => stalledRenewals.delete(previous));
        return;
      }
      const who = renewal && identities.has(previous) ? identities.get(previous) : identity();
      identities.set(who.id, who);
      const account = shared ? shared.members.findIndex((member) => member.id === who.id) + 1 : next;
      const ticket = shared ? await shared.issueRaw(account) : randomBytes(32).toString("hex");
      tickets.set(ticket, who);gameKeys.set(who.id,gameAccessKey(ticket));
      res.setHeader(
        "set-cookie",
        `fixture=${who.id}; HttpOnly; SameSite=Strict; Path=/`,
      );
      res.setHeader("content-type", "application/json");
      return res.end(
        JSON.stringify({
          ticket,gameKey:gameAccessKey(ticket),
          endpoint: shared ? "/api/campus/socket" : "ws://127.0.0.1:2569",
          transport: shared ? "vercel" : "colyseus",
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
      if (shared||gameFixture) {
        const data=shared??gameFixture,members=shared?.members??gameFixture.identities;
        const account = members.findIndex((m) => m.id === own) + 1;
        if (action.action === "report") await data.as(account, () => data.db.query("SELECT campus_report($1,$2)", [action.target, action.reason]));
        else await data.as(account, () => data.db.query("SELECT campus_block($1,$2)", [action.target, action.action === "block"]));
      }
      res.setHeader("content-type", "application/json");
      return res.end('{"saved":true}');
    }
    if (shared && path.startsWith("/fixture/remove/")) {
      if (!validServiceKey(req.headers.authorization || null, serviceKey)) { res.statusCode = 401; return res.end(); }
      await shared.db.query("DELETE FROM campus_presence WHERE campus_id=$1", [path.split("/").at(-1)]);
      res.statusCode = 204; return res.end();
    }
    if (shared && path.startsWith("/fixture/renew/")) {
      if (!validServiceKey(req.headers.authorization || null, serviceKey)) { res.statusCode = 401; return res.end(); }
      const target = path.split("/").at(-1);
      await shared.db.query("UPDATE campus_presence SET opened_at=clock_timestamp()-interval '181 seconds' WHERE campus_id=$1", [target]);
      for (const [socket, own] of runtimeSockets) if (own === target) socket.send(JSON.stringify({ type: "renew", data: null }));
      res.statusCode = 204; return res.end();
    }
    if (shared && path.startsWith("/fixture/stall-renewal/")) {
      if (!validServiceKey(req.headers.authorization || null, serviceKey)) { res.statusCode = 401; return res.end(); }
      const target = path.split("/").at(-1);
      stalledRenewals.add(target);
      for (const [socket, own] of runtimeSockets) if (own === target) {
        socket.send(JSON.stringify({ type: "renew", data: null }));
        setTimeout(() => socket.close(1012), 100);
      }
      res.statusCode = 204; return res.end();
    }
    if (shared && path.startsWith("/fixture/stall-snapshots/")) {
      if (!validServiceKey(req.headers.authorization || null, serviceKey)) { res.statusCode = 401; return res.end(); }
      quietSnapshots.add(path.split("/").at(-1));
      res.statusCode = 204; return res.end();
    }
    if (shared && path === "/fixture/stall-next-entry") {
      if (!validServiceKey(req.headers.authorization || null, serviceKey)) { res.statusCode = 401; return res.end(); }
      stalledEntries++; res.statusCode = 204; return res.end();
    }
    if (path.startsWith("/dashboard/academy/")) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end(
        "<!doctype html><html><body><h1>Synthetic course fixture</h1><p>This checks frame retention; it is not a real enrolled Academy course.</p><label>Practice answer <input id=\"answer\"></label><button onclick=\"localStorage.setItem('fixture-progress',document.getElementById('answer').value);document.getElementById('status').textContent='Saved'\">Save progress</button><p id=\"status\"></p></body></html>",
      );
    }
    if (path === "/dashboard/student") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end('<!doctype html><html><body><h1>Synthetic personal dashboard</h1><p>Existing dashboard destination; no real learner data.</p><label>Dashboard draft <textarea></textarea></label></body></html>');
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
  if (shared) {
    const servers = [new WebSocketServer({ noServer: true, maxPayload: 2048 }), new WebSocketServer({ noServer: true, maxPayload: 2048 })];
    const sessions = new Set();
    let listener = 0;
    http.on("upgrade", (req, socket, head) => {
      const own = /fixture=([0-9a-f-]+)/.exec(req.headers.cookie || "")?.[1];
      if (req.url !== "/api/campus/socket" || req.headers.origin !== origin || !identities.has(own)) { socket.destroy(); return; }
      servers[listener++ % 2].handleUpgrade(req, socket, head, (ws) => {
        runtimeSockets.set(ws, own);
        const send = ws.send.bind(ws);
        ws.send = (...args) => { if (!quietSnapshots.has(own)) return send(...args); };
        const done = runVercelCampusSession(ws, own, async (args) => {
          const started = performance.now();
          try { return await shared.runtime(args.runtime_connection, args.runtime_operation, args.runtime_commands, args.ticket_hash, args.expected_campus, args.runtime_renew); }
          finally { runtimeDurations.push(performance.now() - started); }
        });
        sessions.add(done); void done.finally(() => { sessions.delete(done); runtimeSockets.delete(ws); });
      });
    });
    campus = { close: async () => {
      for (const server of servers) for (const socket of server.clients) socket.terminate();
      await Promise.all([...sessions]);
      for (const server of servers) await new Promise((resolve) => server.close(resolve));
      await shared.db.close();
    } };
  } else campus = await createCampusServer({
    port: 2569,
    origin,
    serviceKey,
    verify: async (t) => {
      const who = tickets.get(t);
      tickets.delete(t);
      return who;
    },
    departed:gameFixture?async(target,owner_connection)=>{
      await gameFixture.db.transaction(async tx=>{await tx.exec('SET LOCAL ROLE service_role');await tx.query('SELECT campus_play_depart($1,$2)',[target,owner_connection]);});
    }:undefined,
    refresh: async (id) => gameBackend ? (await gameFixture.db.query("SELECT campus_service_identity($1) AS value",[id])).rows[0].value : identities.get(id),
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
      headless: !process.argv.includes('--headed'),
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
      .getByRole("button", { name: "Enter school", exact: true })
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
        let firstSent = true;
        for (const kind of ["framesent", "framereceived"])
          socket.on(kind, (frame) => {
            const bytes = Buffer.isBuffer(frame.payload) ? frame.payload : Buffer.from(frame.payload);
            if (vercel && kind === "framesent" && firstSent) {
              firstSent = false;
              try {
                const admission = JSON.parse(bytes.toString());
                const keys = Object.keys(admission).sort().join(",");
                if (!(keys === "ticket,type" || (keys === "renew,ticket,type" && admission.renew === true)) || admission.type !== "admit" || !/^[0-9a-f]{64}$/.test(admission.ticket))
                  throw new Error("Invalid protected admission handshake");
                handshakeHashes.push(createHash("sha256").update(admission.ticket).digest("hex"));
                return;
              } catch { errors.push("Invalid protected admission handshake"); }
            }
            wireFrames.push(bytes);
          });
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
        .getByRole("button", { name: "Enter school", exact: true })
        .click();
      await page
        .getByText("In the school · walking", { exact: true })
        .waitFor();
    }
    await a.getByText("2 here", { exact: true }).waitFor();
    result.checks.push(
      "Two browser contexts join the same real room with pseudonyms",
    );
    await a.bringToFront();
    await a.getByRole("button", { name: "Controls", exact: true }).click();
    const forward = a.getByRole("button", { name: "Walk forward", exact: true });
    const firstId = identities.keys().next().value;
    const player = async (id = firstId) => shared
      ? (await shared.db.query("SELECT campus_id AS id,x,z,floor,elevation,stance,travel->>'via' AS travel,seat,status FROM campus_presence WHERE campus_id=$1", [id])).rows[0]
      : campus.room.world.players.get(id);
    const checkGraphics=async()=>{
      const canvas=a.locator('.school-scene canvas');
      const ratio=async()=>canvas.evaluate(c=>c.width/c.clientWidth);
      await a.getByRole('button',{name:'Performance',exact:true}).click();
      await a.waitForFunction(()=>{const c=document.querySelector('.school-scene canvas');return c&&Math.abs(c.width/c.clientWidth-.45)<.01;});
      await a.getByRole('button',{name:'Sharp',exact:true}).press('Enter');
      await a.waitForFunction(()=>{const c=document.querySelector('.school-scene canvas');return c&&Math.abs(c.width/c.clientWidth-Math.min(2,devicePixelRatio))<.01;});
      const sharpRatio=await ratio();
      const outsideOverflow=await a.evaluate(()=>document.body.style.overflow);
      await a.getByRole('button',{name:'Full screen',exact:true}).click();
      await a.getByRole('button',{name:'Sky & view',exact:true}).click();
      if(!await a.getByRole('group',{name:'Graphics',exact:true}).isVisible())throw new Error('Fullscreen lost graphics controls');
      if(await a.getByRole('button',{name:'Sharp',exact:true}).getAttribute('aria-pressed')!=='true')throw new Error('Fullscreen discarded graphics preference');
      await a.screenshot({path:join(directory,'fullscreen-graphics.png')});result.screenshots.push(join(directory,'fullscreen-graphics.png'));
      await a.getByRole('button',{name:'Auto',exact:true}).click();
      const autoResolution=await a.waitForFunction(()=>{const c=document.querySelector('.school-scene canvas');const value=c?c.width/c.clientWidth:0;return Math.abs(value-1)<.01?value:false;});
      const autoIdleRatio=await autoResolution.jsonValue();await autoResolution.dispose();
      await a.getByRole('button',{name:'Close school panel',exact:true}).click();
      await a.getByRole('button',{name:'Exit full screen',exact:true}).click();
      // Fullscreen exit restores focus asynchronously. Starting the movement
      // test before it finishes can blur its button and cancel that input.
      await a.waitForFunction(overflow=>!document.fullscreenElement&&!document.querySelector('.campus-immersive')&&document.body.style.overflow===overflow&&document.activeElement===document.querySelector('.campus-fullscreen-button'),outsideOverflow);
      result.graphics={pointerAndKeyboard:true,performanceRatio:.45,sharpRatio,autoIdleRatio,fullscreenPreferenceRetained:true};
      result.checks.push('Local graphics modes change the actual canvas resolution through pointer and keyboard controls, remain available in fullscreen, and preserve the connected world');
    };
    if(!process.argv.includes('--dashboard-only'))await checkGraphics();
    const renewGames=vercel?async()=>{
      await shared.db.query("UPDATE campus_presence SET opened_at=clock_timestamp()-interval '181 seconds' WHERE campus_id=$1",[firstId]);
      const before=(await shared.db.query('SELECT connection_id FROM campus_presence WHERE campus_id=$1',[firstId])).rows[0].connection_id;
      for(const [ws,own] of runtimeSockets)if(own===firstId)ws.send(JSON.stringify({type:'renew',data:null}));
      const until=Date.now()+10000;while(Date.now()<until){
        const row=(await shared.db.query('SELECT p.connection_id,k.connection FROM campus_presence p LEFT JOIN campus_play_keys k USING(campus_id) WHERE p.campus_id=$1',[firstId])).rows[0];
        if(row&&row.connection_id!==before&&row.connection_id===row.connection)return;
        await new Promise(resolve=>setTimeout(resolve,50));
      }
      throw new Error('Game duration handover did not complete');
    }:null;
    const gameFetch=async(page,url,body)=>{
      const own=(await page.context().cookies()).find(c=>c.name==='fixture')?.value;
      return page.evaluate(async({url,key,body})=>{const response=await fetch(url,{method:body?'POST':'GET',headers:{'X-Campus-Game-Key':key,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,body:response.headers.get('content-type')?.includes('json')?await response.json():null};},{url,key:gameKeys.get(own),body});
    };
    if(checkingGames){
      await (checkingVocabulary?checkWortQuest:checkBoardGames)({a,b,browser,origin,identities,shared,gameFixture,campus,result,directory,wireFrames,issuedTickets,handshakeHashes,errors,gameFetch,renewGames});
    }else if(process.argv.includes("--graphics-only")){
      // The focused display check still performs the shared wire/privacy audit below.
    }else if(process.argv.includes("--living-cube-only")){
      await checkLivingCube({page:a,peer:b,stage:a.getByRole("region",{name:/3D school/}),player,id:firstId,result,directory});
    }else{
    const me = await player();
    if(!process.argv.includes('--dashboard-only')){
    for (const activate of [() => forward.click(), () => forward.press("Enter")]) {
      const before = (await player()).z;
      await activate();
      await new Promise((resolve) => setTimeout(resolve, 650));
      if ((await player()).z >= before - 0.3) throw new Error("Direction button activation did not move");
      const stopped = (await player()).z;
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (Math.abs((await player()).z - stopped) > 0.05) throw new Error("Direction step did not stop");
    }
    result.checks.push("Pointer taps and native keyboard button activation move a bounded step and stop");
    }
    if(!process.argv.includes('--entry-only')){
    const stage = a.getByRole("region", { name: /3D school/ });
    // Observe authoritative arrival, rather than assuming CI delivers a fixed
    // number of input ticks during a wall-clock sleep. Speed is tested in SQL/JS.
    const walkForwardTo = async (id, targetZ) => {
      await stage.focus();await a.keyboard.down("ArrowUp");
      const deadline = Date.now() + 8000;
      try {
        while ((await player(id)).z > targetZ) {
          if (Date.now() > deadline) throw new Error("Held keyboard input did not reach the desk within eight seconds");
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } finally { await a.keyboard.up("ArrowUp"); }
    };
    await stage.focus();await a.keyboard.press("e");
    await a.waitForTimeout(450);
    if(await a.getByRole("button",{name:"Stand up",exact:true}).isEnabled())throw new Error("E interacted with a distant desk");
    await walkForwardTo(firstId, -1.2);
    // E uses the visible snapshot prompt; the server can arrive one cadence
    // before that snapshot reaches the browser.
    await a.waitForFunction(()=>{const prompt=document.querySelector(".campus-interact");return prompt&&!prompt.disabled;});
    await a.keyboard.down("e");
    await a.keyboard.down("e");
    await a.keyboard.up("e");
    await a
      .getByRole("button", { name: "Open Study Hub", exact: true })
      .waitFor({ state: "visible" });
    await a.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll("button")).find(
          (e) => e.textContent === "Open Study Hub",
        )?.disabled,
    );
    if(await a.locator("dialog").evaluate(dialog=>dialog.open))throw new Error("Held E repeated the desk interaction");
    await a.waitForTimeout(450);await stage.focus();await a.keyboard.press("e");
    await a.waitForFunction(()=>document.querySelector("dialog")?.open);
    await a.getByRole('button',{name:'My dashboard',exact:true}).click();
    const embeddedDashboard=a.frameLocator('iframe[title="Your personal dashboard"]');
    await embeddedDashboard.getByRole('heading',{name:'Synthetic personal dashboard',exact:true}).waitFor();
    await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft',exact:true}).fill('campus-private-dashboard-canary');
    const beforeDashboardKeys={x:(await player()).x,z:(await player()).z};
    await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft',exact:true}).press('e');
    await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft',exact:true}).press('Backspace');
    if(Math.hypot((await player()).x-beforeDashboardKeys.x,(await player()).z-beforeDashboardKeys.z)>.01)throw new Error('Typing in the dashboard moved the avatar');
    await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft',exact:true}).press('Escape');
    await a.waitForFunction(()=>!document.querySelector('dialog')?.open);
    await a.getByRole('button',{name:'Open Study Hub',exact:true}).click();
    if(await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft',exact:true}).inputValue()!=='campus-private-dashboard-canary')throw new Error('Dashboard draft was discarded across a school pause');
    await a.setViewportSize({width:390,height:844});
    if(await a.locator('iframe[title="Your personal dashboard"]').evaluate(el=>el.getBoundingClientRect().right>innerWidth+1))throw new Error('Embedded dashboard overflows the phone computer panel');
    await a.setViewportSize({width:1440,height:1050});
    await a.screenshot({path:join(directory,'computer-dashboard.png')});result.screenshots.push(join(directory,'computer-dashboard.png'));
    await a.getByRole('button',{name:'My courses',exact:true}).click();
    if(await a.locator('iframe[title="Your personal dashboard"]').count()!==1)throw new Error('Tool switching unmounted the dashboard');
    result.checks.push('Desk E interaction opens Study Hub; its embedded existing dashboard retains unsent input across Escape/school pauses and tool switches, isolates typing from movement and fits the phone panel');
    if(process.argv.includes('--dashboard-only')){
      await a.getByRole('checkbox').check();
      await a.getByRole('button',{name:/Synthetic test course/}).click();
      const embeddedCourse=a.frameLocator('iframe[title="Your Academy course"]');
      await embeddedCourse.getByRole('textbox',{name:'Practice answer'}).fill('campus-wire-answer-canary-17oct');
      await a.getByRole('button',{name:'My dashboard',exact:true}).click();
      if(await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft'}).inputValue()!=='campus-private-dashboard-canary')throw new Error('Opening a course reset the dashboard');
      await a.getByRole('button',{name:'My courses',exact:true}).click();
      if(await embeddedCourse.getByRole('textbox',{name:'Practice answer'}).inputValue()!=='campus-wire-answer-canary-17oct')throw new Error('Opening the dashboard reset the course');
      await a.getByRole('button',{name:'Return to school →',exact:true}).click();
      await a.getByRole('button',{name:'Full screen',exact:true}).click();
      await a.getByRole('button',{name:'Study desk',exact:true}).click();
      await a.getByRole('button',{name:'Open Study Hub',exact:true}).click();
      await a.getByRole('button',{name:'My dashboard',exact:true}).click();
      if(!await a.evaluate(()=>document.fullscreenElement?.contains(document.querySelector('iframe[title="Your personal dashboard"]'))))throw new Error('Embedded dashboard escaped fullscreen');
      await a.screenshot({path:join(directory,'computer-dashboard-fullscreen.png')});result.screenshots.push(join(directory,'computer-dashboard-fullscreen.png'));
      await embeddedDashboard.getByRole('textbox',{name:'Dashboard draft'}).press('Escape');
      await a.getByRole('button',{name:'Exit full screen',exact:true}).click();
      result.checks.push('Both dashboard and course retain independent drafts across tool switches; the real dashboard iframe stays inside the native fullscreen ancestor and Escape returns to the school');
    }
    if(!process.argv.includes('--dashboard-only')){
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
    await course.getByRole("textbox", { name: "Practice answer" }).press("e");
    if(!(await a.locator("dialog").evaluate(dialog=>dialog.open)))throw new Error("Course typing triggered a world interaction");
    await course.getByRole("textbox", { name: "Practice answer" }).press("Backspace");
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
    if (shared) {
      const oldConnection = (await shared.db.query("SELECT connection_id FROM campus_presence WHERE campus_id=$1", [me.id])).rows[0].connection_id;
      const renewed = await fetch(`${origin}/fixture/renew/${me.id}`, { method: "POST", headers: { authorization: `Bearer ${serviceKey}` } });
      if (renewed.status !== 204) throw new Error("Renewal trigger failed");
      let transferred = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        const state = (await shared.db.query("SELECT connection_id,seat FROM campus_presence WHERE campus_id=$1", [me.id])).rows[0];
        if (state && state.connection_id !== oldConnection && state.seat === "desk-2") { transferred = true; break; }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!transferred || !(await a.locator("dialog").evaluate((dialog) => dialog.open)) ||
        (await course.getByRole("textbox", { name: "Practice answer" }).inputValue()) !== "campus-wire-answer-canary-17oct")
        throw new Error("Duration handover did not retain the seat, Hub and course input");
      if ((await a.textContent("body")).includes("Disconnected — your course stays open"))
        throw new Error("Healthy handover disconnected the UI");
      result.checks.push("Fresh one-use admission transfers between independent handlers before the duration limit, retaining seat, modal and unsaved course input");
    }
    await course.getByRole("button", { name: "Save progress" }).click();
    await course.getByText("Saved", { exact: true }).waitFor();
    await a.getByRole("button", { name: "Return to school →" }).click();
    await stage.focus();await a.keyboard.press("e");
    await a.getByText("In the school · walking", { exact: true }).waitFor();
    result.checks.push("E ignores distant desks and repeat, sits at the nearest free station, opens its Hub and stands after return; course typing stays isolated");
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
    const removal = await fetch((shared ? `${origin}/fixture` : "http://127.0.0.1:2569") + "/remove/" + me.id, {
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
    await a.getByRole("button", { name: "Return to school →" }).click();
    await a.getByText("0 here", { exact: true }).waitFor();
    if (await a.getByRole("button", { name: /Your seat/ }).count())
      throw new Error("Disconnected UI retained a seat claim");
    await a.getByRole("button", { name: "Open Study Hub", exact: true }).click();
    if ((await course.getByRole("textbox", { name: "Practice answer" }).inputValue()) !== "campus-wire-answer-canary-17oct")
      throw new Error("Offline Hub reopen discarded course input");
    await a.getByRole("button", { name: "Return to school →" }).click();
    await a.getByRole("button", { name: "Enter school", exact: true }).click();
    await a.getByText("In the school · walking", { exact: true }).waitFor();
    if (await player(me.id))
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
    if (shared) {
      const own = (await shared.db.query("SELECT campus_id FROM campus_presence ORDER BY opened_at DESC LIMIT 1")).rows[0].campus_id;
      const stalled = await fetch(`${origin}/fixture/stall-renewal/${own}`, { method: "POST", headers: { authorization: `Bearer ${serviceKey}` } });
      if (stalled.status !== 204) throw new Error("Stalled-renewal trigger failed");
      await a.waitForFunction(() => document.body.textContent.includes("Disconnected — your course stays open"), undefined, { timeout: 12000 });
      await a.getByText("0 here", { exact: true }).waitFor();
      await a.getByRole("button", { name: "Open Study Hub", exact: true }).click();
      if ((await course.getByRole("textbox", { name: "Practice answer" }).inputValue()) !== "campus-wire-answer-canary-17oct")
        throw new Error("Hung renewal discarded retained course input");
      await a.getByRole("button", { name: "Return to school →" }).click();
      await a.getByRole("button", { name: "Enter school", exact: true }).click();
      await a.getByText("In the school · walking", { exact: true }).waitFor();
      result.checks.push("A hung renewal request times out after the old socket closes, clears stale presence, preserves offline course input and permits fresh admission");
      const latest = (await shared.db.query("SELECT campus_id FROM campus_presence ORDER BY opened_at DESC LIMIT 1")).rows[0].campus_id;
      const quiet = await fetch(`${origin}/fixture/stall-snapshots/${latest}`, { method: "POST", headers: { authorization: `Bearer ${serviceKey}` } });
      if (quiet.status !== 204) throw new Error("Silent-channel trigger failed");
      await a.waitForFunction(() => document.body.textContent.includes("Disconnected — your course stays open"), undefined, { timeout: 15000 });
      await a.getByText("0 here", { exact: true }).waitFor();
      await a.getByRole("button", { name: "Open Study Hub", exact: true }).click();
      if ((await course.getByRole("textbox", { name: "Practice answer" }).inputValue()) !== "campus-wire-answer-canary-17oct")
        throw new Error("Silent-channel failure discarded retained course input");
      await a.getByRole("button", { name: "Return to school →" }).click();
      await a.getByRole("button", { name: "Enter school", exact: true }).click();
      await a.getByText("In the school · walking", { exact: true }).waitFor();
      result.checks.push("A silent application channel is detected locally even while native pongs remain healthy; presence clears and unsaved course input survives fresh admission");
      await a.getByRole("button", { name: "Leave", exact: true }).click();
      const stallEntry = async () => {
        const response = await fetch(`${origin}/fixture/stall-next-entry`, { method: "POST", headers: { authorization: `Bearer ${serviceKey}` } });
        if (response.status !== 204) throw new Error("Stalled-entry trigger failed");
        await a.getByRole("button", { name: "Enter school", exact: true }).click();
        for (let attempt = 0; attempt < 40 && stalledEntries > 0; attempt++)
          await new Promise((resolve) => setTimeout(resolve, 25));
        if (stalledEntries > 0) throw new Error("Stalled entry request was not observed before cancellation/timeout");
      };
      await stallEntry();
      await a.getByRole("button", { name: "Leave", exact: true }).click();
      await a.getByText("You left the school", { exact: true }).waitFor();
      await stallEntry();
      await a.getByText("Unable to enter", { exact: true }).waitFor({ timeout: 12000 });
      await a.getByRole("button", { name: "Open Study Hub", exact: true }).click();
      if ((await course.getByRole("textbox", { name: "Practice answer" }).inputValue()) !== "campus-wire-answer-canary-17oct")
        throw new Error("Stalled initial entry discarded retained course input");
      await a.getByRole("button", { name: "Return to school →" }).click();
      await a.getByRole("button", { name: "Enter school", exact: true }).click();
      await a.getByText("In the school · walking", { exact: true }).waitFor();
      result.checks.push("Initial admission is cancellable with Leave and bounded on timeout, retains offline course input and permits a new attempt");
    }
    await a.getByRole("button", { name: "Leave", exact: true }).click();
    await a.getByRole("button", { name: "Enter school", exact: true }).click();
    await a.getByText("In the school · walking", { exact: true }).waitFor();
    result.checks.push("Leave and fresh admission restore standing presence");
    await a.setViewportSize({ width: 1440, height: 1050 });
    const cubeId=(await aContext.cookies()).find(cookie=>cookie.name==="fixture").value;
    await a.getByRole("button",{name:"First person",exact:true}).click();
    const scene=a.locator(".school-scene"),box=await scene.boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
    await a.mouse.move(cx,cy);await a.mouse.move(cx+210,cy,{steps:8});
    await a.bringToFront();await a.mouse.click(cx+210,cy);
    await a.waitForFunction(()=>document.pointerLockElement===document.querySelector(".school-scene"));
    await a.mouse.move(cx+240,cy,{steps:3});
    await a.keyboard.press("Escape");
    await a.waitForFunction(()=>document.pointerLockElement===null);
    await a.getByText("Click school to resume mouse look · E to interact",{exact:true}).waitFor();
    await stage.focus();await a.keyboard.press("e");
    await a.waitForTimeout(150);
    const facing={...await player(cubeId)};
    await a.keyboard.down("ArrowUp");
    try{
      const deadline=Date.now()+6000;
      while(Date.now()<deadline){const position=await player(cubeId);if(position.x>facing.x+.5&&position.z<facing.z-.5)break;await a.waitForTimeout(100);}
    }finally{await a.keyboard.up("ArrowUp");}
    await a.waitForTimeout(250);
    const walked=await player(cubeId);
    if(walked.x<=facing.x+.3||walked.z>=facing.z-.3)throw new Error("First-person forward input did not rotate with the local camera");
    await a.getByRole("button",{name:"Night sky",exact:true}).click();
    if((await a.locator(".cube-clock-heading time").textContent())!=="22:00")throw new Error("Night sky clock is not a24-hour manual selection");
    for(let i=0;i<6;i++)await a.getByRole("button",{name:"Look left",exact:true}).click();
    for(let i=0;i<4;i++)await a.getByRole("button",{name:"Look up",exact:true}).click();
    await a.waitForTimeout(1500);
    await a.locator(".campus-stage").screenshot({path:join(directory,"cube-first-person-night.png")});
    result.screenshots.push(join(directory,"cube-first-person-night.png"));
    await a.getByRole("button",{name:"Orbit view",exact:true}).click();
    await a.getByRole("button",{name:"Zoom out",exact:true}).click();
    if((await a.getByRole("button",{name:"Orbit view",exact:true}).getAttribute("aria-pressed"))!=="true")throw new Error("Orbit camera is not selectable");
    const orbitInput=async()=>shared
      ? (await shared.db.query('SELECT input_x AS x,input_z AS z,sequence AS seq FROM campus_presence WHERE campus_id=$1',[cubeId])).rows[0]
      : campus.room.world.inputs.get(cubeId);
    const waitOrbitInput=async(expected,after=-1)=>{
      const until=Date.now()+4000;
      while(Date.now()<until){const input=await orbitInput();if(input&&Number(input.seq)>Number(after)&&expected(input))return input;await a.waitForTimeout(40);}
      throw new Error('Orbit keys did not produce the expected camera-relative command');
    };
    const matches=expected=>input=>Math.hypot(input.x-expected.x,input.z-expected.z)<.001;
    const orbitPulse=async(keys,expected)=>{
      await stage.focus();const before={...await player(cubeId)},seq=(await orbitInput()).seq;
      for(const key of keys)await a.keyboard.down(key);
      let input;
      try{
        input=await waitOrbitInput(expected?matches(expected):i=>Math.hypot(i.x,i.z)>.99,seq);
        const until=Date.now()+4000;
        while(Date.now()<until){const position=await player(cubeId);if((position.x-before.x)*input.x+(position.z-before.z)*input.z>.12)break;await a.waitForTimeout(40);}
        const position=await player(cubeId);
        if((position.x-before.x)*input.x+(position.z-before.z)*input.z<=.1)throw new Error('Orbit command did not move the authoritative avatar in its intended direction');
      }finally{for(const key of keys)await a.keyboard.up(key);}
      await waitOrbitInput(matches({x:0,z:0}),input?.seq??seq);
      return input;
    };
    const baseline=await orbitPulse(['w']);
    for(let i=0;i<4;i++)await a.getByRole('button',{name:'Look right',exact:true}).click();
    const c=Math.cos(.88),s=Math.sin(.88),fw={x:baseline.x*c-baseline.z*s,z:baseline.x*s+baseline.z*c};
    const right={x:-fw.z,z:fw.x},left={x:fw.z,z:-fw.x};
    for(const [keys,expected] of [[['w'],fw],[['s'],{x:-fw.x,z:-fw.z}],[['a'],left],[['d'],right],[['w','d'],{x:(fw.x+right.x)/Math.SQRT2,z:(fw.z+right.z)/Math.SQRT2}]])await orbitPulse(keys,expected);
    // Opposite keys cancel; releasing one resumes the key still physically held.
    await stage.focus();let seq=(await orbitInput()).seq;await a.keyboard.down('w');await waitOrbitInput(matches(fw),seq);
    seq=(await orbitInput()).seq;await a.keyboard.down('s');await waitOrbitInput(matches({x:0,z:0}),seq);
    seq=(await orbitInput()).seq;await a.keyboard.up('s');await waitOrbitInput(matches(fw),seq);
    seq=(await orbitInput()).seq;await a.keyboard.down('ArrowUp');await a.keyboard.up('w');await waitOrbitInput(matches(fw),seq);
    seq=(await orbitInput()).seq;await a.keyboard.up('ArrowUp');await waitOrbitInput(matches({x:0,z:0}),seq);
    await stage.focus();await a.keyboard.down('a');await waitOrbitInput(matches(left));
    seq=(await orbitInput()).seq;await a.keyboard.down('d');await waitOrbitInput(matches({x:0,z:0}),seq);
    seq=(await orbitInput()).seq;await a.keyboard.up('d');await waitOrbitInput(matches(left),seq);
    await a.getByRole('button',{name:'Look right',exact:true}).click();await a.keyboard.up('a');
    await waitOrbitInput(matches({x:0,z:0}));
    result.checks.push('Orbit WASD follows the rotated camera, moves the authoritative avatar forward/back/left/right with normalized diagonals, cancels opposing keys, restores remaining keys/aliases on release and clears movement on control focus');
    await a.getByRole("button",{name:"The Cube",exact:true}).click();await a.waitForTimeout(1800);
    await a.locator(".campus-stage").screenshot({path:join(directory,"cube-exterior-night.png")});result.screenshots.push(join(directory,"cube-exterior-night.png"));
    await a.getByRole("button",{name:"Daylight",exact:true}).click();await a.waitForTimeout(700);
    await a.locator(".campus-stage").screenshot({path:join(directory,"cube-exterior-day.png")});result.screenshots.push(join(directory,"cube-exterior-day.png"));
    const timeRange=a.getByRole("slider",{name:"Time of day",exact:true});await timeRange.focus();await timeRange.press("Home");await timeRange.press("ArrowRight");
    if((await a.locator(".cube-clock-heading time").textContent())!=="00:15")throw new Error("Sky time slider is not keyboard operable");
    await a.getByRole("button",{name:"Live local time",exact:true}).click();
    if((await a.getByRole("button",{name:"Live local time",exact:true}).getAttribute("aria-pressed"))!=="true")throw new Error("Local24-hour clock did not resume");
    await a.getByRole("button",{name:"Daylight",exact:true}).click();
    result.checks.push("First-person hover look, click-to-lock, locked relative motion, Escape release and E without camera turning work in actual Chromium");
    result.checks.push("Glass Cube exterior, first-person camera-relative walking, look/orbit/zoom controls, keyboard sky slider, night mode and resumed local24-hour clock work without sharing camera or clock state");
    await a.getByRole("button", { name: "Whole school", exact: true }).click();
    if (await a.locator(".school-map-place").count() !== 15) throw new Error("Whole-school map is incomplete");
    await a.waitForTimeout(1800);
    await a.screenshot({ path: join(directory, "whole-school-desktop.png") });result.screenshots.push(join(directory, "whole-school-desktop.png"));
    const retainedBeforeTravel = await course.locator("#answer").inputValue();
    await a.locator(".school-map-place").filter({ hasText: "Computer lab" }).click();
    await a.getByRole("button", { name: "Walk here →", exact: true }).click();
    await a.locator(".school-camera-controls").getByRole("button", { name: "Stop walking", exact: true }).waitFor();
    await a.getByText("Arrived at Computer lab.", { exact: true }).waitFor({ timeout: 35000 });
    const travelId = (await aContext.cookies()).find(cookie => cookie.name === "fixture").value;
    await walkForwardTo(travelId, -2.3);
    await a.getByRole("button", { name: "Lab computer 2 Sit →", exact: true }).click();
    await a.waitForFunction(()=>!Array.from(document.querySelectorAll("button")).find(e=>e.textContent==="Open Study Hub")?.disabled);
    await a.getByRole("button", { name: "Open Study Hub", exact: true }).click();
    if (await course.getByRole("textbox", { name: "Practice answer" }).inputValue() !== retainedBeforeTravel) throw new Error("Travel discarded retained course work");
    await a.getByRole("button", { name: "Return to school →", exact: true }).click();
    await a.getByRole("button", { name: "Stand up", exact: true }).click();
    const overflowBefore=await a.evaluate(()=>document.body.style.overflow);
    await a.getByRole("button",{name:"Full screen",exact:true}).scrollIntoViewIfNeeded();
    const scrollBefore=await a.evaluate(()=>scrollY);
    await a.getByRole("button",{name:"Full screen",exact:true}).click();
    await a.waitForFunction(()=>document.fullscreenElement===document.querySelector(".campus-shell"));
    const assertScreen=async()=>{
      const fits=await a.locator(".campus-stage").evaluate(el=>{const r=el.getBoundingClientRect();return Math.abs(r.width-innerWidth)<2&&Math.abs(r.height-innerHeight)<2&&Math.abs(r.top)<2;});
      if(!fits)throw new Error("Fullscreen scene does not fill the viewport");
      for(const name of ["Exit full screen","Leave","Controls"]){if(!await a.getByRole("button",{name,exact:true}).isVisible())throw new Error("Fullscreen lost "+name);}
    };
    await assertScreen();
    await stage.focus();await a.keyboard.press("e");
    await a.getByText("In the school · seated",{exact:true}).waitFor();
    await a.waitForTimeout(450);await a.keyboard.press("e");
    await a.waitForFunction(()=>document.querySelector("dialog")?.open);
    if(!await a.evaluate(()=>document.fullscreenElement?.contains(document.querySelector("dialog"))))throw new Error("Study Hub escaped the fullscreen ancestor");
    if(await course.getByRole("textbox",{name:"Practice answer"}).inputValue()!==retainedBeforeTravel)throw new Error("Fullscreen discarded mounted course input");
    await course.getByRole("textbox",{name:"Practice answer"}).press("Escape");
    await a.waitForFunction(()=>!document.querySelector("dialog")?.open);
    if(!await stage.evaluate(el=>el===document.activeElement))throw new Error("Retained course Escape did not return fullscreen focus to the school");
    await a.waitForTimeout(450);await a.keyboard.press("e");
    await a.getByText("In the school · walking",{exact:true}).waitFor();
    const panelTools=[["School map","map"],["Sky & view","sky"],["Study desk","desk"],["Controls","controls"],["People & safety","people"]];
    const inspectPanels=async()=>{
      for(const [name,id] of panelTools){
        await a.getByRole("button",{name,exact:true}).click();
        const panel=a.locator(`[data-campus-panel="${id}"]`);
        if(!await panel.isVisible())throw new Error("Fullscreen missing "+id+" panel");
        if(!await panel.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&el.scrollWidth<=el.clientWidth+1;}))throw new Error("Fullscreen panel overflows viewport: "+id);
        await a.getByRole("button",{name:"Close school panel",exact:true}).click();
      }
    };
    await inspectPanels();
    await a.getByRole("button",{name:"First person",exact:true}).click();
    await a.screenshot({path:join(directory,"fullscreen-school.png")});result.screenshots.push(join(directory,"fullscreen-school.png"));
    await a.getByRole("button",{name:"Exit full screen",exact:true}).click();
    await a.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector(".campus-immersive"));
    await a.waitForFunction(({overflow,y})=>document.body.style.overflow===overflow&&Math.abs(scrollY-y)<=2,{overflow:overflowBefore,y:scrollBefore},{timeout:3000});
    await a.getByRole("button",{name:"Full screen",exact:true}).click();
    await a.waitForFunction(()=>!!document.fullscreenElement);
    await a.evaluate(()=>document.exitFullscreen());
    await a.waitForFunction(()=>!document.querySelector(".campus-immersive"));
    // A denied native request keeps the same controls in the viewport fallback.
    await a.locator(".campus-shell").evaluate(el=>{el.requestFullscreen=()=>Promise.reject(new DOMException("Denied","NotAllowedError"));});
    await a.setViewportSize({width:390,height:844});
    await a.getByRole("button",{name:"Full screen",exact:true}).click();
    await a.waitForFunction(()=>!!document.querySelector(".campus-immersive"));
    await assertScreen();await inspectPanels();
    const clearHint=await a.evaluate(()=>document.querySelector(".cube-look-hint").getBoundingClientRect().bottom<=document.querySelector(".campus-controls").getBoundingClientRect().top);
    if(!clearHint)throw new Error("Fullscreen phone controls cover mouse guidance");
    await a.screenshot({path:join(directory,"fullscreen-phone.png")});result.screenshots.push(join(directory,"fullscreen-phone.png"));
    await a.getByRole("button",{name:"Sky & view",exact:true}).click();
    await a.screenshot({path:join(directory,"fullscreen-phone-tools.png")});result.screenshots.push(join(directory,"fullscreen-phone-tools.png"));
    await a.getByRole("button",{name:"Close school panel",exact:true}).click();
    await a.setViewportSize({width:844,height:390});await assertScreen();await inspectPanels();
    await stage.focus();await a.keyboard.press("Escape");
    await a.waitForFunction(()=>!document.querySelector(".campus-immersive"));
    if(await a.evaluate(()=>document.body.style.overflow)!==overflowBefore)throw new Error("Fallback Escape exit did not restore scrolling");
    await a.locator(".campus-shell").evaluate(el=>{delete el.requestFullscreen;});
    result.checks.push("Native fullscreen contains scene, tools, E study/stand and retained course; map/sky/desk/movement/safety panels fit desktop, phone and landscape; denied-native fallback and Escape/exit restore scrolling");
    await a.getByRole("button", { name: "Whole school", exact: true }).click();
    await a.setViewportSize({ width: 390, height: 844 });
    if (await a.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw new Error("School map overflows phone width");
    await a.waitForTimeout(1800);
    await a.screenshot({path:join(directory,"whole-school-phone.png")});result.screenshots.push(join(directory,"whole-school-phone.png"));
    await a.getByRole("button", { name: "People & safety", exact: true }).click();
    if (!(await a.getByRole("region", { name: "People and safety", exact: true }).evaluate(el=>el===document.activeElement))) throw new Error("Safety shortcut did not move keyboard focus to the participant controls");
    result.checks.push("School camera has a direct safety shortcut and stop-walking control; participant safety keeps a leave action at phone width");
    result.checks.push("All 15 places are discoverable; ordinary input navigation walks through doors to the Computer lab, its study station reuses retained course work, and the school map fits phone width");
    // Play the actual shared court through ordinary movement and rendered controls.
    await a.setViewportSize({width:1440,height:1050});
    const ballState=async()=>shared?(await shared.db.query("SELECT state FROM campus_basketball")).rows[0].state:campus.room.world.basketball;
    const untilCourt=async(predicate,message,timeout=10000)=>{const end=Date.now()+timeout;while(!await predicate()){if(Date.now()>end)throw new Error(message);await a.waitForTimeout(80);}};
    const courtIds=await Promise.all([aContext,bContext].map(async context=>(await context.cookies()).find(cookie=>cookie.name==="fixture").value));
    const travel=async page=>{await page.locator(".school-map-place").filter({hasText:"Sports court"}).click();await page.getByRole("button",{name:"Walk here →",exact:true}).click();await page.getByText("Arrived at Sports court.",{exact:true}).waitFor({timeout:50000});};
    await Promise.all([travel(a),travel(b)]);
    console.log("Basketball: both peers arrived by ordinary movement");
    // Place wayfinding stops near its entrance; step toward the centre ball.
    for(const page of [a,b])await page.getByRole('button',{name:'Walk forward',exact:true}).click();
    for(const page of [a,b])await page.waitForFunction(()=>{const button=document.querySelector('.campus-interact');return button&&!button.disabled;});
    await Promise.all([a,b].map(async page=>{await page.getByRole('region',{name:/3D school/}).focus();await page.keyboard.press('e');}));
    await untilCourt(async()=>!!(await ballState()).holder,'No player acquired the shared basketball');
    const holder=(await ballState()).holder,winner=holder===courtIds[0]?a:b,loser=winner===a?b:a;
    const winnerId=winner===a?courtIds[0]:courtIds[1],loserId=loser===a?courtIds[0]:courtIds[1];
    await winner.getByRole('button',{name:'Face north hoop',exact:true}).waitFor();
    await loser.getByText('Ball in play · wait for a rebound',{exact:true}).waitFor();
    const winnerStage=winner.getByRole('region',{name:/3D school/});
    await winner.getByRole('button',{name:'Face north hoop',exact:true}).click();
    // Keep E held past the peak: lowering power must not release possession.
    await winnerStage.focus();await winner.keyboard.down('e');
    await winner.waitForFunction(()=>document.querySelector('meter[aria-label="Shot charge"]')?.value>.9);
    await winner.waitForFunction(()=>document.querySelector('meter[aria-label="Shot charge"]')?.value<.25);
    if(!await winner.evaluate(()=>Math.abs(document.querySelector('meter[aria-label="Shot charge"]').value-Number(document.querySelector('#basketball-power').value))<.006))throw new Error('Displayed slider and charge meter disagree');
    if((await ballState()).holder!==winnerId)throw new Error('A held up/down charge released the ball before E was released');
    await winner.screenshot({path:join(directory,'basketball-power-lowered.png')});result.screenshots.push(join(directory,'basketball-power-lowered.png'));
    // Escape cancels without a shot; releasing E afterward still keeps the ball.
    await winner.keyboard.press('Escape');await winner.keyboard.up('e');
    await winner.waitForTimeout(200);
    if((await ballState()).holder!==winnerId)throw new Error('Cancelling charge lost the held basketball');
    // A quick E release remains deliberately underpowered: miss and rebound.
    await winnerStage.focus();await winner.keyboard.down('e');await winner.waitForTimeout(300);await winner.keyboard.up('e');
    await untilCourt(async()=>{const ball=await ballState();return ball.holder===null&&ball.kind==='shot';},'E release did not launch the basketball');
    await untilCourt(async()=>{const ball=await ballState();return ball.y<.38&&Math.hypot(ball.vx,ball.vy,ball.vz)<.09;},'Miss did not settle into a retrievable rebound',14000);
    if((await ballState()).north+(await ballState()).south!==0)throw new Error('Underpowered miss incorrectly awarded points');
    const moveCourt=async(page,own,destination)=>{
      await page.getByRole('button',{name:'Whole school',exact:true}).click();const region=page.getByRole('region',{name:/3D school/});
      for(const axis of ['x','z']){
        const target=destination[axis],position=await player(own);
        if(Math.abs(position[axis]-target)<.7)continue;
        const sign=position[axis]>target?-1:1,key=axis==='x'?(sign<0?'ArrowLeft':'ArrowRight'):(sign<0?'ArrowUp':'ArrowDown');
        await region.focus();await page.keyboard.down(key);
        try{await untilCourt(async()=>sign*((await player(own))[axis]-target)>=-.6,'Could not walk across the court',12000);}finally{await page.keyboard.up(key);}
      }
      // Observe a stable stop so both the UI snapshot and confirmed-pose guide
      // describe the same release position before lining up a physical shot.
      let previous={...await player(own)},stableAt=Date.now();
      await untilCourt(async()=>{const position=await player(own);if(Math.hypot(position.x-previous.x,position.z-previous.z)>.01){previous={...position};stableAt=Date.now();}return Date.now()-stableAt>450;},'Court movement did not stop');
    };
    const retrieve=async(page,own)=>{
      const target=await ballState(),region=page.getByRole('region',{name:/3D school/});
      await moveCourt(page,own,{x:target.x,z:Math.min(8,target.z+.75)});
      await page.waitForFunction(()=>{const button=document.querySelector('.campus-interact');return button&&!button.disabled;});
      await region.focus();await page.keyboard.press('e');
      await untilCourt(async()=>(await ballState()).holder===own,'Rebound could not be picked up');
      await page.getByRole('button',{name:'Face north hoop',exact:true}).waitFor();
    };
    await retrieve(loser,loserId);
    // A rebound may settle behind a backboard. Carry it into the open court
    // before requiring a clear shot; do not bypass real board/rim collisions.
    await moveCourt(loser,loserId,{x:52,z:0});
    if((await ballState()).holder!==loserId)throw new Error('Walking in the court lost carried possession');
    const shooter=await player(loserId),hoop=HOOPS[0],distance=Math.hypot(shooter.x-hoop.x,shooter.z-hoop.z);
    await loser.getByRole('button',{name:'Face north hoop',exact:true}).click();
    const direction=basketballAim(Math.atan2(hoop.x-shooter.x,shooter.z-hoop.z),Math.atan2(COURT.rimY-1.67,distance));
    const angle=Math.asin(direction.dy),d=distance-Math.cos(angle)*.45,dy=COURT.rimY-(1.55+direction.dy*.45);
    const speed=Math.sqrt(COURT.gravity*d*d/(2*Math.cos(angle)**2*(d*Math.tan(angle)-dy))),power=Math.max(.12,Math.min(1,(speed-4)/9));
    const slider=loser.getByRole('slider',{name:'Shot power',exact:true});await slider.focus();await slider.press('Home');
    for(let i=0;i<Math.round((power-.12)/.005);i++)await slider.press('ArrowRight');
    await loser.screenshot({path:join(directory,'basketball-aim.png')});result.screenshots.push(join(directory,'basketball-aim.png'));
    await loser.getByRole('button',{name:'Shoot ball',exact:true}).click();
    await untilCourt(async()=>(await ballState()).north>0,'A clean physically aimed shot did not score',8000);
    const points=distance>=COURT.threePoint?3:2;
    for(const page of [a,b])await untilCourt(async()=>Number(await page.locator('.basketball-score span').first().locator('b').textContent())===points,'Peers disagree on the court score');
    await loser.screenshot({path:join(directory,'basketball-basket.png')});result.screenshots.push(join(directory,'basketball-basket.png'));
    console.log("Basketball: E miss, rebound retrieval and shared physical basket passed");
    await untilCourt(async()=>{const ball=await ballState();return ball.y<.38&&Math.hypot(ball.vx,ball.vy,ball.vz)<.09;},'Scored shot did not settle',14000);
    await retrieve(b,courtIds[1]);
    await b.getByRole('button',{name:'Put down ball',exact:true}).click();
    await untilCourt(async()=>(await ballState()).holder===null,'Put down did not release possession');
    await untilCourt(async()=>{const ball=await ballState();return ball.y<.38&&Math.hypot(ball.vx,ball.vy,ball.vz)<.09;},'Dropped ball did not settle',10000);
    await retrieve(b,courtIds[1]);
    await b.getByRole('button',{name:'Leave',exact:true}).click();
    await untilCourt(async()=>(await ballState()).holder===null,'Disconnect retained basketball ownership');
    await untilCourt(async()=>{const ball=await ballState();return ball.y<.38&&Math.hypot(ball.vx,ball.vy,ball.vz)<.09;},'Released basketball did not settle',10000);
    await retrieve(a,courtIds[0]);
    await a.setViewportSize({width:390,height:844});
    if(await a.getByRole('button',{name:'Exit full screen',exact:true}).count()){await a.getByRole('button',{name:'Exit full screen',exact:true}).click();await a.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.campus-immersive'));}
    if(await a.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Basketball HUD overflows phone layout');
    await a.getByRole('button',{name:'Full screen',exact:true}).click();
    await a.waitForFunction(()=>!!document.querySelector('.campus-immersive'));
    if(!await a.getByRole('region',{name:'Basketball court',exact:true}).isVisible())throw new Error('Basketball controls disappeared in fullscreen');
    if(await a.locator('[data-campus-panel=play]').isVisible())throw new Error('Inactive invitation tools cover the court controls');
    await a.screenshot({path:join(directory,'basketball-fullscreen-phone.png')});result.screenshots.push(join(directory,'basketball-fullscreen-phone.png'));
    const touch=await aContext.newCDPSession(a);await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
    const touchTarget=await a.locator('.campus-interact').boundingBox(),tx=touchTarget.x+touchTarget.width/2,ty=touchTarget.y+touchTarget.height/2;
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
    await a.getByText('Release E to shoot',{exact:false}).waitFor();
    await a.waitForFunction(()=>document.querySelector('meter[aria-label="Shot charge"]')?.value>.9);
    await a.waitForFunction(()=>document.querySelector('meter[aria-label="Shot charge"]')?.value<.25);
    if((await ballState()).holder!==courtIds[0])throw new Error('Touch power reduction released the ball before touch end');
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await untilCourt(async()=>{const ball=await ballState();return ball.holder===null&&ball.kind==='shot';},'Touch hold/release did not shoot the ball');
    await touch.send('Emulation.setTouchEmulationEnabled',{enabled:false});await touch.detach();
    await a.getByRole('button',{name:'Exit full screen',exact:true}).click();
    await a.waitForFunction(()=>!document.querySelector('.campus-immersive'));
    result.basketball={sharedOwnership:true,repeatSafePickup:true,heldPowerRisesAndFalls:true,lowerPowerKeepsPossession:true,cancelChargeKeepsBall:true,keyboardChargeReleaseMiss:true,retrievedRebound:true,carryDribble:true,physicalBasketPoints:points,peerScoreAgreement:true,putDown:true,disconnectRelease:true,fullscreenPhone:true,touchChargeRelease:true};
    result.checks.push('Actual court gameplay: two peers walk there, race for one ball, hold E through rising/falling power without losing possession, cancel with Escape, then release a shot; another player retrieves and scores a physical basket with shared totals. Touch also lowers power while held and shoots only on release; fullscreen controls remain visible');
    await checkLivingCube({page:a,peer:b,stage,player,id:courtIds[0],result,directory});
    }
    }
    }
    await Promise.all(ticketReads);
    if (vercel) {
      const issuedHashes = new Set(issuedTickets.map((ticket) => createHash("sha256").update(ticket).digest("hex")));
      if (!handshakeHashes.length || handshakeHashes.some((hash) => !issuedHashes.has(hash)))
        throw new Error("Protected handshake did not use a fixture-issued one-use ticket");
      result.checks.push(`${handshakeHashes.length} exact fixed-shape admission handshakes checked separately; no credentials retained in evidence`);
    }
    const combined = Buffer.concat(wireFrames);
    if (!wireFrames.length || !issuedTickets.length)
      throw new Error("Wire observation missing");
    for (const canary of [
      "board-games-retained-course-canary",
      ...(gameBackend?Array.from({length:14},(_,i)=>`30000000-0000-0000-0000-${String(i+1).padStart(12,"0")}`):[]),
      "Game Friend", "FriendOne", "FriendTwo", "FriendThree", "FriendFour", "fixture.supabase.co/storage",
      "Synthetic test course",
      "/dashboard/academy/fixture",
      "/dashboard/student",
      "campus-wire-answer-canary-17oct",
      "campus-private-dashboard-canary",
      "cameraYaw", "cameraPitch", "timeOfDay", "skyTime", "fullscreenMode", "schoolPanel", "graphicsQuality", "renderScale", "pixelRatio",
      ...issuedTickets,...gameCanaries,...issuedTickets.map(gameAccessKey),...issuedTickets.map(ticket=>createHash('sha256').update(gameAccessKey(ticket)).digest('hex')),
      'sender_connection','recipient_connection','Accept invitation','quiz-answer', 
    ])
      if (combined.includes(Buffer.from(canary)))
        throw new Error(
          "Private study data or admission ticket found in world frames",
        );
    result.checks.push(
      "Wire audit: " +
        wireFrames.length +
        " WebSocket frames inspected; no dashboard/course path, course title, answer canary, invitation identifier, game credential or issued admission ticket found",
    );
    if (errors.length) throw new Error(errors.join("\n"));
    result.checks.push("No uncaught browser errors");
    if (shared) {
      const samples = [...runtimeDurations].sort((a, b) => a - b);
      result.localSqlRuntime = { calls: samples.length, p95Ms: Math.round(samples[Math.floor(samples.length * 0.95)] || 0),
        maxMs: Math.round(samples.at(-1) || 0), intervalMs: 200,
        scope: "Local PGlite fixture only; not hosted latency, throughput or cost evidence" };
    }
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
} catch(error) {
  console.error("Campus browser failure:",error);
  if(browser){let n=0;for(const context of browser.contexts())for(const page of context.pages()){
    try{await page.screenshot({path:join(directory,`failure-${++n}.png`)});}catch{/* Retain any earlier evidence when the page already closed. */}
  }}
  console.error("Synthetic browser failure evidence:",directory);
  throw error;
} finally {
  await browser?.close();
  await campus?.close();
  await gameFixture?.db.close();
  http.closeAllConnections();
  await new Promise((resolve) => http.close(resolve));
}
