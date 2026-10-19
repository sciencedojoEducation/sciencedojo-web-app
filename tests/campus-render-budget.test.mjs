import assert from "node:assert/strict";
import {test} from "node:test";
import {createRenderBudget,initialRenderScale,reduceRenderQuality,renderPixelRatio} from "../lib/campus/render-budget.ts";

test("Auto restores full resolution at rest while manual quality overrides motion fallback",()=>{
  assert.equal(renderPixelRatio("auto",true,.45,2),.45);
  assert.equal(renderPixelRatio("auto",false,.45,2),1);
  assert.equal(renderPixelRatio("auto",true,1,2),1);
  for(const moving of [true,false]){
    assert.equal(renderPixelRatio("sharp",moving,.45,2),2);
    assert.equal(renderPixelRatio("sharp",moving,.45,3),2);
    assert.equal(renderPixelRatio("sharp",moving,.45,1),1);
    assert.equal(renderPixelRatio("sharp",moving,.45,NaN),1);
    assert.equal(renderPixelRatio("performance",moving,1,2),.45);
  }
});

test("software rasterizers select a light motion profile; hardware and unknown renderers retain quality",()=>{
  for(const name of ["ANGLE (Google, SwiftShader Device)","llvmpipe (LLVM)","softpipe","Software Rasterizer","Microsoft Basic Render Driver"])
    assert.equal(initialRenderScale(name),.45);
  for(const name of ["","WebKit WebGL","ANGLE (Apple, Metal)","Intel UHD Graphics"])
    assert.equal(initialRenderScale(name),1);
});

test("idle and five-Hz snapshot redraws preserve quality on a demand canvas",()=>{
  const sample=createRenderBudget();
  for(let i=0;i<100;i++)assert.equal(reduceRenderQuality(sample,.2,false),false);
  assert.equal(reduceRenderQuality(sample,10,false),false);
  for(let i=0;i<120;i++)assert.equal(reduceRenderQuality(sample,1/60,true),false);
});

test("sustained slow animation requests one quality reduction per level",()=>{
  const sample=createRenderBudget();let requests=0,firstRequestAt=Infinity;
  for(let i=0;i<30;i++)if(reduceRenderQuality(sample,.1,true)){requests++;firstRequestAt=Math.min(firstRequestAt,(i+1)*.1);}
  assert.equal(requests,1);
  assert.equal(sample.requested,true);
  assert(firstRequestAt<=.9,"Sustained ten-FPS animation must adapt within its first second");
});

test("recovered or interrupted animation does not accumulate old slow time",()=>{
  const sample=createRenderBudget();
  for(let i=0;i<5;i++)assert.equal(reduceRenderQuality(sample,.1,true),false);
  for(let i=0;i<120;i++)assert.equal(reduceRenderQuality(sample,1/60,true),false);
  assert.equal(reduceRenderQuality(sample,.25,true),false);
  assert.equal(reduceRenderQuality(sample,10,false),false);
  assert.equal(sample.slowSeconds,0);
});
