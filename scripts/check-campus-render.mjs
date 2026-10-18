/** Isolated synthetic scene probe. No auth, hosted data, or production diagnostic hooks. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "@playwright/test";

const directory = await mkdtemp(join(tmpdir(), "campus-render-"));
const slowDevice=process.argv.includes("--slow-device");
const fiber = resolve("node_modules/@react-three/fiber/dist/react-three-fiber.esm.js");
await build({
  stdin: { contents: `import React,{useState,useEffect} from 'react';
    import './components/campus/campus.css';import {createRoot} from 'react-dom/client';import Scene from './components/campus/CampusScene';
    const player={id:'40000000-0000-0000-0000-000000000001',pseudonym:'Quiet Maple aaaa01',colour:0,x:-2,z:4,rotation:0,status:'walking',seat:null};
    const unavailable=()=>{window.noWebgl=true};
    function App(){const [x,setX]=useState(-2),[view,setView]=useState("follow");useEffect(()=>{window.showOverview=()=>setView("overview");
      window.startWalk=()=>{window.sceneFrames=[];window.walkStartedAt=performance.now();window.walkArrivals=[];const gaps=[120,280,160,240,140,260,180,220];let i=0,elapsed=0;
        const step=()=>{const gap=gaps[i%gaps.length];setTimeout(()=>{elapsed+=gap;setX(-2+elapsed*.0015);
          window.walkArrivals.push(performance.now());if(++i===20){window.walkDoneAt=performance.now();window.walkDone=true;}else step();},gap);};step();};
    },[]);return <Scene snapshot={{self:player.id,players:[{...player,x}],occupied:[]}} active={true} view={view} onUnavailable={unavailable}/>;}
    createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  outfile: join(directory, "app.js"), define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "scene-observer", setup(b) {
    b.onResolve({ filter: /^@react-three\/fiber$/ }, () => ({ path: "probe", namespace: "scene-probe" }));
    b.onLoad({ filter: /.*/, namespace: "scene-probe" }, () => ({ loader: "jsx", resolveDir: process.cwd(), contents: `
      import React from 'react';import {Canvas as Base,useFrame} from ${JSON.stringify(fiber)};
      export * from ${JSON.stringify(fiber)};
      function Probe(){useFrame(({scene,gl,camera},delta)=>{
        let avatar;scene.traverse(o=>{if(o.geometry?.type==='RingGeometry')avatar=o.parent});
        if(avatar){window.sceneFrames??=[];window.sceneFrames.push({t:performance.now(),ms:delta*1000,x:avatar.position.x,dpr:gl.getPixelRatio(),shadows:gl.shadowMap.enabled,cameraX:camera.position.x,cameraY:camera.position.y,cameraZ:camera.position.z,calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries});}
        window.sceneReady=true;
      });return null;}
      export function Canvas(props){return <Base {...props}>{props.children}<Probe/></Base>}
    ` }));
  } }],
});
const http = createServer(async (req, res) => {
  if (["/app.js","/app.css"].includes(req.url)) { res.setHeader("content-type",req.url.endsWith("css")?"text/css":"text/javascript");res.end(await readFile(join(directory, req.url.slice(1)))); }
  else res.end(`<!doctype html><link rel="stylesheet" href="/app.css"><div id="root" style="width:${slowDevice?1800:900}px;height:${slowDevice?1200:600}px"></div><script type="module" src="/app.js"></script>`);
});
let browser;
try {
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ executablePath: process.env.CAMPUS_CHROMIUM_PATH || undefined, headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: slowDevice?{width:2000,height:1480}:{ width: 1000, height: 740 }, deviceScaleFactor: 2 });
  if(slowDevice){
    const session=await page.context().newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate",{rate:8});
  }
  if(process.argv.includes("--reduced-motion"))await page.emulateMedia({reducedMotion:"reduce"});
  const errors = [];page.on("pageerror", e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${http.address().port}`);
  await page.waitForFunction(() => window.sceneReady || window.noWebgl);
  assert(!(await page.evaluate(() => window.noWebgl)), "WebGL fixture unavailable");
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.startWalk());
  await page.waitForFunction(() => window.walkDone, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  const frames = await page.evaluate(() => window.sceneFrames);
  const walk=await page.evaluate(()=>({started:window.walkStartedAt,finished:window.walkDoneAt,arrivals:window.walkArrivals}));
  assert(frames.length > 10, "Missing rendered movement frames");
  // Timers on a busy software renderer can deliver the twenty targets late.
  // Compare interpolation over all twenty arrivals, including the 300ms buffer.
  const walking = frames.filter(f => f.t <= walk.finished + 300);
  const changed = walking.filter((f, i) => i && Math.abs(f.x - walking[i - 1].x) > .0001);
  const core = walking.filter(f => f.t > walk.started + 700 && f.t < walk.finished - 400);
  let lastMoveAt = core[0]?.t ?? 0, maxMovementPauseMs = 0;
  for (let i = 1; i < core.length; i++) {
    if (Math.abs(core[i].x - core[i - 1].x) > .0001) lastMoveAt = core[i].t;
    else maxMovementPauseMs = Math.max(maxMovementPauseMs, core[i].t - lastMoveAt);
  }
  const gaps = walking.slice(1).map((f,i)=>f.t-walking[i].t).sort((a,b)=>a-b);
  const result = { scope: "Synthetic actual scene, headless Chrome / SwiftShader; not hardware or hosted FPS",
    authoritativeTargetCount: walk.arrivals.length, observedWalkMs: Math.round(walk.finished-walk.started),
    observedArrivalGapsMs: walk.arrivals.map((at,i)=>Math.round(at-(i?walk.arrivals[i-1]:walk.started))),
    arrivalGapsMs: [120,280,160,240,140,260,180,220], maxMovementPauseMs: Math.round(maxMovementPauseMs),
    renderedWalkingFrames: walking.length, changingPositionFrames: changed.length,
    distinctPositions: new Set(walking.map(f=>f.x.toFixed(4))).size,
    p95FrameGapMs: Math.round(gaps[Math.ceil(gaps.length*.95)-1]),
    minimumPixelRatio: Math.min(...frames.map(f=>f.dpr)),
    decorativeShadowsDisabled: frames.some(f=>!f.shadows),
    maxDrawCalls: Math.max(...frames.map(f=>f.calls)), maxGeometries: Math.max(...frames.map(f=>f.geometries)),
    finalX: frames.at(-1).x, browserErrors: errors, evidence: join(directory, "evidence.json") };
  await writeFile(result.evidence, JSON.stringify(result, null, 2));console.log(JSON.stringify(result,null,2));
  assert.deepEqual(errors, []);
  assert.equal(result.authoritativeTargetCount,20,"Probe must observe all twenty authoritative targets");
  if(slowDevice)assert(result.minimumPixelRatio<1,"High-pixel-load, CPU-throttled probe must exercise adaptive rendering");
  if(result.minimumPixelRatio<1)assert(result.decorativeShadowsDisabled,"Slow-device fallback must disable decorative shadows");
  if(process.argv.includes("--reduced-motion")){
    assert(frames.every(f=>Math.hypot(f.cameraX-frames[0].cameraX,f.cameraY-frames[0].cameraY,f.cameraZ-frames[0].cameraZ)<.0001),"Reduced motion must keep the selected-place camera anchored");
    result.reducedMotionCameraAnchored=true;
  }
  if (!process.argv.includes("--baseline")) {
    assert(result.distinctPositions > 35, "Movement still steps only at snapshot rate");
    assert(result.maxMovementPauseMs < 80, "Character pauses between uneven snapshot arrivals");
    assert(result.maxDrawCalls < 40, "Static scene draw calls regressed");
    assert(Math.abs(result.finalX-4)<.01, "Presentation must settle at the authoritative target");
  }
  await page.screenshot({ path: join(directory, "scene.png") });
  await page.evaluate(()=>window.showOverview());await page.waitForTimeout(2500);
  await page.screenshot({path:join(directory,"whole-school.png")});
  await writeFile(result.evidence, JSON.stringify(result, null, 2));
} finally { await browser?.close();http.closeAllConnections();await new Promise(r=>http.close(r)); }
