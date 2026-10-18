import assert from "node:assert/strict";
import {test} from "node:test";
import {schoolSky,clockLabel,normalizeHour,boundedLook,cameraDirection} from "../lib/campus/cube-experience.ts";
import {isInput} from "../lib/campus/protocol.ts";
test("24-hour sky has an overhead noon sun and midnight moon with stars",()=>{
 const day=schoolSky(12),night=schoolSky(0);
 assert(day.sun.y>.99);assert.equal(day.daylight,1);assert.equal(day.stars,0);
 assert(night.moon.y>.99);assert.equal(night.daylight,0);assert.equal(night.stars,1);
 assert.notEqual(day.zenith,night.zenith);
});
test("sunrise/sunset and midnight wrap continuously and show a 24-hour clock",()=>{
 for(const t of [6,18])assert(Math.abs(schoolSky(t).sun.y)<1e-9);
 assert.deepEqual(schoolSky(24),schoolSky(0));assert.equal(normalizeHour(-1),23);
 assert.equal(clockLabel(23.5),"23:30");assert.equal(clockLabel(24),"00:00");
 assert.equal(normalizeHour(NaN),12);
});
test("first-person movement rotates bounded direction inputs with the camera",()=>{
 const forward=cameraDirection(0,-1,Math.PI/2);assert(Math.abs(forward.x-1)<1e-9);assert(Math.abs(forward.z)<1e-9);
 const diagonal=cameraDirection(1,-1,.72);assert(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-9);
 for(let yaw=-Math.PI;yaw<Math.PI;yaw+=.01)assert(isInput({...cameraDirection(1,-1,yaw),seq:0}));
 assert.deepEqual(cameraDirection(0,0,2),{x:0,z:0});
});
test("look controls constrain pitch and distance without preventing first-person sky views",()=>{
 assert.equal(boundedLook({yaw:0,pitch:-10,distance:999},"orbit").pitch,.16);
 const look=boundedLook({yaw:10,pitch:20,distance:-1},"first-person");
 assert.equal(look.pitch,1.35);assert.equal(look.distance,10);assert(Math.abs(look.yaw)<=Math.PI);
});
