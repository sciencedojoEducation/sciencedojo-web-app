import assert from "node:assert/strict";
import {test} from "node:test";
import {createRenderBudget,reduceRenderQuality} from "../lib/campus/render-budget.ts";

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
