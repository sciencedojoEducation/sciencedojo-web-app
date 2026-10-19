"use client";
import {useLayoutEffect,useMemo,useRef} from "react";
import {BoxGeometry,Color,DoubleSide,MeshBasicMaterial,MeshLambertMaterial,Object3D,type InstancedMesh} from "three";
type V=[number,number,number];
type Part={p:V;s:V;c:string};
const frame:Part[]=[],glow:Part[]=[];
const add=(p:V,s:V,c="#dce6e9")=>frame.push({p,s,c});
// A literal144×144×144 cube around the existing authoritative ground campus.
for(const x of [-72,72])for(const z of [-71,73])add([x,71.6,z],[.9,144,.9],"#355260");
for(const y of [0,24,48,72,96,120,143.6])for(const side of [-1,1]){
 add([side*72,y,1],[.45,.45,144]);add([0,y,1+side*72],[144,.45,.45]);
}
for(let n=-48;n<=48;n+=24)for(const side of [-1,1]){
 add([n,71.6,1+side*72],[.23,144,.23],"#8aa8b6");add([side*72,71.6,n+1],[.23,144,.23],"#8aa8b6");
 add([n,143.6,1],[.35,.4,144]);add([0,143.6,n+1],[144,.4,.35]);
}
for(const x of [-71.4,71.4])for(const z of [-70.4,72.4])glow.push({p:[x,71.6,z],s:[.12,144,.12],c:"#76ffed"});
// Planted perimeter terraces frame the atrium; the accessible campus is below.
for(const y of [18,42,66,90,114,138])for(const side of [-1,1]){
 add([side*64,y,1],[14,.55,140],"#d9e7e7");add([0,y,1+side*64],[114,.55,14],"#d9e7e7");
 add([side*58,y+.6,1],[1,1.2,137],"#719a87");add([0,y+.6,1+side*58],[114,1.2,1],"#719a87");
 glow.push({p:[side*57,y-.05,1],s:[.22,.22,139],c:"#baffed"},{p:[0,y-.05,1+side*57],s:[114,.22,.22],c:"#baffed"});
}
for(const z of [-13,13])for(const side of [-1,1])glow.push({p:[0,.12,z+side*2.7],s:[126,.025,.12],c:"#a2e6df"});
for(const x of [-39,-13,13,39])for(const side of [-1,1])glow.push({p:[x+side*2.7,.12,0],s:[.12,.025,77],c:"#a2e6df"});
for(const z of [-38.8,41.8])for(const x of [-64,64])add([x,.6,z],[.15,1.2,.15]);
for(const z of [-39,42])add([0,.95,z],[128,.1,.1],"#79b8c5");
for(const x of [-64,64])add([x,.95,1.5],[.1,.1,81],"#79b8c5");
add([0,-.9,1],[144,1,144],"#b7cbd3");
// Suspended orbital sculpture in the atrium; decorative, not a teaching floor.
for(const y of [68,73])for(const side of [-1,1]){
 glow.push({p:[side*2.5,y,1],s:[.1,.1,5],c:"#9effef"});glow.push({p:[0,y,1+side*2.5],s:[5,.1,.1],c:"#9effef"});
}
for(const x of [-2.5,2.5])for(const z of [-1.5,3.5])glow.push({p:[x,70.5,z],s:[.22,5,.22],c:"#9effef"});
const glazing=[{p:[-72,71.6,1] as V,s:[144,144,1] as V,ry:Math.PI/2,rx:0},{p:[72,71.6,1] as V,s:[144,144,1] as V,ry:Math.PI/2,rx:0},
 {p:[0,71.6,-71] as V,s:[144,144,1] as V,ry:0,rx:0},{p:[0,71.6,73] as V,s:[144,144,1] as V,ry:0,rx:0},{p:[0,143.6,1] as V,s:[144,144,1] as V,ry:0,rx:Math.PI/2}];

export default function CubeArchitecture({cutaway}:{cutaway:boolean}){
 const metal=useRef<InstancedMesh>(null),edges=useRef<InstancedMesh>(null),glass=useRef<InstancedMesh>(null),orbits=useRef<InstancedMesh>(null);
 const box=useMemo(()=>new BoxGeometry(1,1,1),[]);
 const metalMaterial=useMemo(()=>new MeshLambertMaterial({emissive:"#143543",emissiveIntensity:.18}),[]);
 const glassMaterial=useMemo(()=>new MeshBasicMaterial({color:"#9fd7eb",transparent:true,opacity:.085,depthWrite:false,side:DoubleSide,forceSinglePass:true}),[]);
 useLayoutEffect(()=>{
  const matrix=new Object3D(),colour=new Color();
  for(const [mesh,parts] of [[metal.current!,frame],[edges.current!,glow]] as const){
   parts.forEach((p,i)=>{matrix.position.set(...p.p);matrix.rotation.set(0,0,0);matrix.scale.set(...p.s);matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix);mesh.setColorAt(i,colour.set(p.c));});
   mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor!.needsUpdate=true;mesh.computeBoundingSphere();
  }
  glazing.forEach((p,i)=>{matrix.position.set(...p.p);matrix.rotation.set(p.rx,p.ry,0);matrix.scale.set(...p.s);matrix.updateMatrix();glass.current!.setMatrixAt(i,matrix.matrix);});
  glass.current!.instanceMatrix.needsUpdate=true;glass.current!.computeBoundingSphere();
  for(let i=0;i<3;i++){matrix.position.set(0,70.5,1);matrix.rotation.set(Math.PI/2+i*.65,i*.95,0);matrix.scale.setScalar(1);matrix.updateMatrix();orbits.current!.setMatrixAt(i,matrix.matrix);}
  orbits.current!.instanceMatrix.needsUpdate=true;orbits.current!.computeBoundingSphere();
 },[]);
 return <group name="cube-envelope" visible={!cutaway}>
  <instancedMesh ref={metal} args={[box,metalMaterial,frame.length]}/>
  <instancedMesh ref={edges} args={[box,undefined,glow.length]}><meshBasicMaterial toneMapped={false}/></instancedMesh>
  <instancedMesh ref={glass} args={[undefined,glassMaterial,glazing.length]} renderOrder={2}><planeGeometry args={[1,1]}/></instancedMesh>
  <instancedMesh ref={orbits} args={[undefined,undefined,3]}><torusGeometry args={[24,.17,4,64]}/><meshBasicMaterial color="#a7ffeb" toneMapped={false}/></instancedMesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.3,1]}><planeGeometry args={[143,143]}/><meshPhongMaterial color="#4c98a9" shininess={90}/></mesh>
 </group>;
}
