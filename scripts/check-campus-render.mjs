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
    import {createBasketball,basketballAction,advanceBasketball,basketballSnapshot,basketballAim,suggestedShot} from './lib/campus/basketball';
    const player={id:'40000000-0000-0000-0000-000000000001',pseudonym:'Quiet Maple aaaa01',colour:0,x:-2,z:4,rotation:0,status:'walking',seat:null};
    const unavailable=()=>{window.noWebgl=true};
    function App(){const [x,setX]=useState(-2),[z,setZ]=useState(4),[view,setView]=useState("follow"),[hour,setHour]=useState(12),[active,setActive]=useState(true),[ball,setBall]=useState(undefined),[look,setLook]=useState({yaw:0,pitch:.55,distance:36});useEffect(()=>{window.showOverview=()=>setView("overview");
      window.showExterior=()=>{setView("exterior");setHour(12)};window.showNight=()=>setHour(22);window.pauseScene=()=>setActive(false);window.resumeScene=()=>setActive(true);
      window.showFirst=()=>{setZ(26);setView("first-person");setLook({yaw:-.64,pitch:.72,distance:36})};
      window.refreshSnapshot=()=>setX(x=>x+.2);
      const courtPlayer={...player,x:52,z:0};let courtBall;
      window.showCourt=()=>{setX(52);setZ(0);setHour(12);setView('first-person');const aim=suggestedShot(courtPlayer);setLook({yaw:aim.yaw,pitch:aim.pitch,distance:36});courtBall=basketballAction(createBasketball(performance.now()),courtPlayer,{action:'take'},performance.now());setBall(basketballSnapshot(courtBall,[courtPlayer]));};
      window.shootCourt=()=>{const aim=suggestedShot(courtPlayer);window.courtFrames=[];window.courtCapture=true;courtBall=basketballAction(courtBall,courtPlayer,{action:'shoot',...basketballAim(aim.yaw,aim.pitch),power:aim.power},performance.now());setBall(basketballSnapshot(courtBall,[courtPlayer]));const started=performance.now();const timer=setInterval(()=>{courtBall=advanceBasketball(courtBall,[courtPlayer],performance.now());setBall(basketballSnapshot(courtBall,[courtPlayer]));if(courtBall.north>0)window.courtScored=true;if(performance.now()-started>3500)clearInterval(timer);},100);};
      window.startWalk=()=>{window.sceneFrames=[];window.walkStartedAt=performance.now();window.walkArrivals=[];const gaps=[120,280,160,240,140,260,180,220];let i=0,elapsed=0;
        const step=()=>{const gap=gaps[i%gaps.length];setTimeout(()=>{elapsed+=gap;setX(-2+elapsed*.0015);
          window.walkArrivals.push(performance.now());if(++i===20){window.walkDoneAt=performance.now();window.walkDone=true;}else step();},gap);};step();};
    },[]);return <Scene snapshot={{self:player.id,players:[{...player,x,z}],occupied:[],...(ball?{basketball:ball}:{})}} active={active} view={view} hour={hour} look={look} onUnavailable={unavailable} onLookChange={next=>{window.lastLook=next;window.lookHistory??=[];window.lookHistory.push(next.yaw);}}/>;}
    createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, platform: "browser", format: "esm", jsx: "automatic",
  outfile: join(directory, "app.js"), define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "scene-observer", setup(b) {
    b.onResolve({ filter: /^@react-three\/fiber$/ }, () => ({ path: "probe", namespace: "scene-probe" }));
    b.onLoad({ filter: /.*/, namespace: "scene-probe" }, () => ({ loader: "jsx", resolveDir: process.cwd(), contents: `
      import React from 'react';import {Canvas as Base,useFrame} from ${JSON.stringify(fiber)};
      export * from ${JSON.stringify(fiber)};
      function Probe(){useFrame(({scene,gl,camera},delta)=>{
        const avatar=scene.getObjectByName('campus-self-avatar');let receivingShadows=false;scene.traverse(o=>{if(o.isMesh&&o.receiveShadow)receivingShadows=true;});
        if(avatar){window.sceneFrames??=[];window.sceneFrames.push({t:performance.now(),ms:delta*1000,x:avatar.position.x,dpr:gl.getPixelRatio(),shadows:receivingShadows,shadowPipeline:gl.shadowMap.enabled,cameraX:camera.position.x,cameraY:camera.position.y,cameraZ:camera.position.z,calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries});}
        window.cameraQuaternion=camera.quaternion.toArray();
        window.cameraForward={x:-camera.matrixWorld.elements[8],y:-camera.matrixWorld.elements[9],z:-camera.matrixWorld.elements[10]};
        window.cubeDiagnostics={eye:camera.position.y,fov:camera.fov,selfVisible:avatar?.visible,
          stars:scene.getObjectByName('cube-stars')?.visible,moon:scene.getObjectByName('cube-moon')?.visible,
          sun:scene.getObjectByName('cube-sun')?.visible,envelope:scene.getObjectByName('cube-envelope')?.visible};
        const ball=scene.getObjectByName('basketball'),guide=scene.getObjectByName('basketball-shot-guide');
        const ballProjection=ball?.position.clone().project(camera);
        window.courtDiagnostics={foregroundVisible:!!ballProjection&&Math.abs(ballProjection.x)<1&&Math.abs(ballProjection.y)<1&&ballProjection.z>-1&&ballProjection.z<1,rims:scene.getObjectByName('basketball-rims')?.count,nets:scene.getObjectByName('basketball-nets')?.count,visible:ball?.visible,guideVisible:guide?.visible,guidePoints:guide?.count};
        if(window.courtCapture&&ball){window.courtFrames??=[];window.courtFrames.push({t:performance.now(),x:ball.position.x,y:ball.position.y,z:ball.position.z,calls:gl.info.render.calls});}
        window.sceneReady=true;
      });return null;}
      export function Canvas(props){return <Base {...props} onCreated={state=>{
        // The dedicated stress run exercises the dynamic fallback even when
        // its actual software GPU would normally select the light profile.
        if(${slowDevice}){
          const context=state.gl.getContext(),info=context.getExtension('WEBGL_debug_renderer_info');
          if(info){const getParameter=context.getParameter.bind(context);context.getParameter=p=>p===info.UNMASKED_RENDERER_WEBGL?'Synthetic hardware profile':getParameter(p);}
        }
        props.onCreated?.(state);
      }}>{props.children}<Probe/></Base>}
    ` }));
  } }],
});
const http = createServer(async (req, res) => {
  if (["/app.js","/app.css"].includes(req.url)) { res.setHeader("content-type",req.url.endsWith("css")?"text/css":"text/javascript");res.end(await readFile(join(directory, req.url.slice(1)))); }
  else res.end(`<!doctype html><link rel="stylesheet" href="/app.css"><div id="root" style="width:${slowDevice?1800:900}px;height:${slowDevice?1200:600}px"></div><script type="module" src="/app.js"></script>`);
});
let browser,page;
try {
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ executablePath: process.env.CAMPUS_CHROMIUM_PATH || undefined, headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  page = await browser.newPage({ viewport: slowDevice?{width:2000,height:1480}:{ width: 1000, height: 740 }, deviceScaleFactor: 2 });
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
  // Observe actual terminal presentation, rather than racing a fixed Node-side
  // delay against the browser's React commit, 300ms buffer and software GPU.
  // Walking continuity still uses the original arrival-based window below.
  await page.waitForFunction(() => {
    const frame=window.sceneFrames?.at(-1);
    return frame&&frame.t>=window.walkDoneAt+300&&Math.abs(frame.x-4)<.000001;
  }, null, { timeout: 3000 });
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
    initialPixelRatio:frames[0].dpr,minimumPixelRatio: Math.min(...frames.map(f=>f.dpr)),
    capabilityOverride:slowDevice?"Hardware classification only; actual software GPU and CPU throttling remain":null,
    qualityTransitions: frames.filter((f,i)=>!i||f.dpr!==frames[i-1].dpr||f.shadows!==frames[i-1].shadows)
      .map(f=>({afterStartMs:Math.round(f.t-walk.started),pixelRatio:f.dpr,shadows:f.shadows})),
    decorativeShadowsDisabled: frames.some(f=>!f.shadows),
    shadowPipelineStable: frames.every(f=>f.shadowPipeline),
    maxDrawCalls: Math.max(...frames.map(f=>f.calls)), maxGeometries: Math.max(...frames.map(f=>f.geometries)),
    finalX: frames.at(-1).x, terminalFrameAfterLastTargetMs:Math.round(frames.at(-1).t-walk.finished),
    browserErrors: errors, evidence: join(directory, "evidence.json") };
  await writeFile(result.evidence, JSON.stringify(result, null, 2));console.log(JSON.stringify(result,null,2));
  assert.deepEqual(errors, []);
  assert.equal(result.authoritativeTargetCount,20,"Probe must observe all twenty authoritative targets");
  assert(result.shadowPipelineStable,"Adaptive quality must retain the cached shadow shader pipeline");
  if(slowDevice){
    assert.equal(result.initialPixelRatio,1,"Stress probe must start at full quality to exercise dynamic adaptation");
    assert(result.minimumPixelRatio<1,"High-pixel-load, CPU-throttled probe must exercise adaptive rendering");
  }
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
  assert.equal((await page.evaluate(()=>window.cubeDiagnostics)).envelope,false,"Aerial cutaway must keep all ground destinations visible");
  await page.evaluate(()=>window.showExterior());await page.waitForTimeout(2200);
  const noon=await page.evaluate(()=>window.cubeDiagnostics);assert(noon.envelope&&noon.sun&&!noon.stars,"Daylight exterior must show the glass Cube and sun without stars");
  await page.screenshot({path:join(directory,"cube-day.png")});
  await page.evaluate(()=>window.showNight());await page.waitForTimeout(1000);
  const night=await page.evaluate(()=>window.cubeDiagnostics);assert(night.stars&&night.moon&&!night.sun,"Night must show stars and moon, with the sun below the horizon");
  await page.screenshot({path:join(directory,"cube-night.png")});
  await page.evaluate(()=>window.showFirst());await page.waitForTimeout(700);
  const eyes=await page.evaluate(()=>window.cubeDiagnostics);
  console.log(JSON.stringify({cubeCamera:eyes}));
  assert(Math.abs(eyes.eye-1.67)<.01&&Math.abs(eyes.fov-70)<.01&&!eyes.selfVisible,"First-person camera must be at eye level with the self avatar hidden");
  await page.screenshot({path:join(directory,"cube-first-person-night.png")});
  result.cubeViews={daylight:true,nightMoonStars:true,aerialCutaway:true,firstPersonEyeHeight:eyes.eye,firstPersonFov:eyes.fov};
  const orientation=()=>page.evaluate(()=>window.cameraQuaternion);
  const moved=async(before)=>{await page.waitForFunction(before=>window.cameraQuaternion.some((v,i)=>Math.abs(v-before[i])>.0001),before);};
  await page.mouse.move(430,300);const beforeHover=await orientation();
  await page.mouse.move(510,320,{steps:6});await moved(beforeHover);
  await page.mouse.click(510,320);
  await page.waitForFunction(()=>document.pointerLockElement===document.querySelector(".school-scene"));
  const beforeLocked=await orientation();await page.mouse.move(560,330,{steps:4});await moved(beforeLocked);
  // Exercise real captured mouse movement, including beyond viewport bounds.
  await page.mouse.move(560,-2000);
  await page.waitForFunction(()=>window.cameraForward.y>.9998);
  await page.screenshot({path:join(directory,'mouse-look-up.png')});
  await page.mouse.move(560,4000);
  await page.waitForFunction(()=>window.cameraForward.y<-.9998);
  await page.screenshot({path:join(directory,'mouse-look-down.png')});
  await page.evaluate(()=>window.showFirst());
  const agrees=()=>page.waitForFunction(()=>{
    const a=window.lastLook,d=window.cameraForward;
    if(!a||!d)return false;
    const yaw=Math.atan2(d.x,-d.z),pitch=Math.asin(Math.max(-1,Math.min(1,d.y)));
    // Check yaw separately: near a vertical pole, a direction dot product
    // barely changes even if the last horizontal input has not rendered yet.
    return Math.abs(Math.atan2(Math.sin(yaw-a.yaw),Math.cos(yaw-a.yaw)))<1e-6&&Math.abs(pitch-a.pitch)<1e-6;
  });
  let mouseX=560;
  for(const sign of [-1,1]){
    let turn=0,previous=await page.evaluate(()=>Math.atan2(window.cameraForward.x,-window.cameraForward.z));
    for(let n=0;n<16;n++){
      mouseX+=sign*140;await page.mouse.move(mouseX,4000);await agrees();
      const yaw=await page.evaluate(()=>Math.atan2(window.cameraForward.x,-window.cameraForward.z));
      turn+=Math.atan2(Math.sin(yaw-previous),Math.cos(yaw-previous));previous=yaw;
    }
    assert(sign*turn>Math.PI*2,'Captured mouse must turn a full circle in either direction without a seam or input/render divergence');
  }
  const beforeSnapshot=await orientation();await page.evaluate(()=>window.refreshSnapshot());
  await page.waitForFunction(()=>Math.abs(window.sceneFrames.at(-1).cameraX-4.2)<.001);
  assert.deepEqual(await orientation(),beforeSnapshot,'Unrelated scene updates must not reset the mouse-facing direction');
  await page.keyboard.press("Escape");await page.waitForFunction(()=>!document.pointerLockElement);
  const beforePaused=await orientation();await page.mouse.move(600,350);await page.waitForTimeout(200);
  assert.deepEqual(await orientation(),beforePaused,"Escape must pause hover look for UI access");
  await page.mouse.click(600,350);await page.waitForFunction(()=>!!document.pointerLockElement);
  const beforeHubPause=await orientation();
  await page.evaluate(()=>window.pauseScene());await page.waitForFunction(()=>!document.pointerLockElement);
  await page.evaluate(()=>window.resumeScene());await page.waitForTimeout(200);
  assert.deepEqual(await orientation(),beforeHubPause,"Returning from the Hub must retain the mouse-facing direction");
  await page.mouse.click(600,350);await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.evaluate(()=>window.showOverview());await page.waitForFunction(()=>!document.pointerLockElement);
  await page.evaluate(()=>window.showFirst());await page.waitForTimeout(200);
  // Simulate a browser denying pointer lock, without changing production behavior.
  await page.locator(".school-scene").evaluate(el=>{el.requestPointerLock=()=>Promise.reject(new DOMException("Denied","NotAllowedError"));});
  await page.mouse.click(500,300);const beforeFallback=await orientation();
  await page.mouse.move(550,300,{steps:4});await moved(beforeFallback);
  assert.equal(await page.evaluate(()=>document.pointerLockElement),null);
  assert.deepEqual(errors,[],"Mouse-lock denial must retain hover look without uncaught errors");
  const sceneBounds=await page.locator('.school-scene').boundingBox();
  const unwrappedTurn=()=>page.evaluate(()=>window.lookHistory.reduce((total,yaw,i,all)=>i?total+Math.atan2(Math.sin(yaw-all[i-1]),Math.cos(yaw-all[i-1])):0,0));
  for(const sign of [-1,1]){
    await page.mouse.move(sceneBounds.x+sceneBounds.width/2,sceneBounds.y+sceneBounds.height/2);
    await page.evaluate(()=>window.lookHistory=[]);
    await page.mouse.move(sceneBounds.x+(sign<0?2:sceneBounds.width-2),sceneBounds.y+sceneBounds.height/2);
    await page.waitForFunction(sign=>sign*window.lookHistory.reduce((total,yaw,i,all)=>i?total+Math.atan2(Math.sin(yaw-all[i-1]),Math.cos(yaw-all[i-1])):0,0)>Math.PI*2,sign,{timeout:20000});
    assert(sign*await unwrappedTurn()>Math.PI*2);
    await page.mouse.move(sceneBounds.x+sceneBounds.width/2,sceneBounds.y+sceneBounds.height/2);await agrees();
  }
  await page.mouse.move(sceneBounds.x+sceneBounds.width/2,sceneBounds.y+2);
  await page.waitForFunction(()=>window.cameraForward.y>.9998);
  await page.mouse.move(sceneBounds.x+sceneBounds.width/2,sceneBounds.y+sceneBounds.height-2);
  await page.waitForFunction(()=>window.cameraForward.y<-.9998);
  // Leaving the canvas and Escape must cancel the fallback, including its RAF.
  await page.mouse.move(sceneBounds.x+sceneBounds.width+10,sceneBounds.y+sceneBounds.height/2);
  await agrees();
  const beforeLeave=await orientation();await page.waitForTimeout(250);assert.deepEqual(await orientation(),beforeLeave);
  await page.mouse.move(sceneBounds.x+2,sceneBounds.y+sceneBounds.height/2);await moved(beforeLeave);
  await page.keyboard.press('Escape');await agrees();const beforeEdgePause=await orientation();await page.waitForTimeout(250);assert.deepEqual(await orientation(),beforeEdgePause);
  await page.mouse.click(sceneBounds.x+sceneBounds.width/2,sceneBounds.y+sceneBounds.height/2);
  await page.mouse.move(sceneBounds.x+2,sceneBounds.y+sceneBounds.height/2);await moved(beforeEdgePause);
  await page.evaluate(()=>window.pauseScene());await page.waitForTimeout(100);
  const pausedLook=await page.evaluate(()=>window.lastLook);await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>window.lastLook),pausedLook,'Hub pause must stop uncaptured edge turning');
  await page.evaluate(()=>window.resumeScene());await agrees();const beforeEdgeHub=await orientation();
  await page.mouse.move(sceneBounds.x+sceneBounds.width/2,sceneBounds.y+sceneBounds.height/2);await page.waitForTimeout(100);
  assert.deepEqual(await orientation(),beforeEdgeHub,'The first mouse event after a Hub pause must establish a fresh cursor baseline');
  result.mouseLook={hover:true,lockedRelativeMovement:true,fullCapturedTurnsBothDirections:true,nearVerticalBothDirections:true,inputRenderAgreement:true,sceneUpdateFacingRetained:true,escapeReleaseAndPause:true,hubPauseRelease:true,viewChangeRelease:true,deniedLockHoverFallback:true,fullUncapturedEdgeTurnsBothDirections:true,edgeLeaveEscapeHubStop:true};
  await page.evaluate(()=>window.showCourt());
  await page.waitForFunction(()=>window.courtDiagnostics?.guideVisible&&window.courtDiagnostics.guidePoints>5);
  await page.waitForTimeout(600);
  const court=await page.evaluate(()=>window.courtDiagnostics);
  assert.equal(court.rims,2);assert.equal(court.nets,2);assert(court.visible&&court.foregroundVisible&&court.guideVisible&&court.guidePoints<=24,'Actual court must render ball, two real rims/nets and a bounded local shot guide');
  await page.screenshot({path:join(directory,'basketball-court-aim.png')});
  await page.evaluate(()=>window.shootCourt());
  await page.waitForFunction(()=>window.courtScored,undefined,{timeout:7000});await page.waitForTimeout(450);
  const ballFrames=await page.evaluate(()=>window.courtFrames);
  const ballPositions=new Set(ballFrames.map(f=>[f.x,f.y,f.z].map(n=>n.toFixed(3)).join(','))).size;
  const courtCalls=Math.max(...ballFrames.map(f=>f.calls));
  assert(ballPositions>12,'Ball flight must render intermediate confirmed positions');assert(courtCalls<40,'Playable court exceeded the existing draw-call budget');
  assert.deepEqual(errors,[],'Playable court must not introduce browser errors');
  result.basketballRendering={rims:2,nets:2,firstPersonHeldBallVisible:true,localTrajectory:true,physicalBasket:true,distinctBallPositions:ballPositions,maxDrawCalls:courtCalls,reducedMotion:process.argv.includes('--reduced-motion')};
  await page.screenshot({path:join(directory,'basketball-court-flight.png')});
  await writeFile(result.evidence, JSON.stringify(result, null, 2));
} catch(error) {
  if(page){await writeFile(join(directory,'mouse-look-failure.json'),JSON.stringify(await page.evaluate(()=>({look:window.lastLook,forward:window.cameraForward,turns:window.lookHistory,locked:!!document.pointerLockElement})),null,2));console.error('Camera failure evidence:',directory);}
  throw error;
} finally { await browser?.close();http.closeAllConnections();await new Promise(r=>http.close(r)); }
