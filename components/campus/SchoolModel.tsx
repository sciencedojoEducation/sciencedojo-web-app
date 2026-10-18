"use client";
import {memo,useLayoutEffect,useMemo,useRef} from "react";
import {BoxGeometry,Color,MeshBasicMaterial,MeshLambertMaterial,Object3D,Sphere,type InstancedMesh} from "three";
import {boxes,trees,glazing,beanbags} from "@/lib/campus/school-geometry";
// Five contiguous school columns plus the global paths, sharing one geometry/material.
const batches=Array.from({length:6},(_,i)=>boxes.filter(b=>b.section===0?i===0:(b.section-1)%5+1===i));
const SchoolModel=memo(function SchoolModel({occupied,detailedShadows=true,frosted=[],visibleFloor=2}:{occupied:number;detailedShadows?:boolean;frosted?:string[];visibleFloor?:number}){
 const bags=useRef<InstancedMesh>(null);
 const glass=useRef<InstancedMesh>(null),screens=useRef<InstancedMesh>(null);
 const glassMaterial=useMemo(()=>new MeshBasicMaterial({color:"#a5dce5",transparent:true,opacity:.1,depthWrite:false}),[]);
 const meshes=useRef<(InstancedMesh|null)[]>([]),trunks=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null);
 // Diffuse props need no per-fragment metal/roughness calculations.
 const geometry=useMemo(()=>new BoxGeometry(1,1,1),[]),material=useMemo(()=>new MeshLambertMaterial(),[]);
 useLayoutEffect(()=>{
  const transform=new Object3D();
  batches.forEach((batch,section)=>{
   const mesh=meshes.current[section]!;
   batch.forEach((b,i)=>{transform.position.set(...b.position);transform.scale.set(...b.size);if(b.floor>visibleFloor)transform.scale.setScalar(0);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();
   mesh.boundingSphere=mesh.boundingBox!.getBoundingSphere(new Sphere());
  });
  glazing.forEach((p,i)=>{transform.position.set(...p.position);transform.scale.set(...p.size);if(p.position[1]>visibleFloor*12+6)transform.scale.setScalar(0);transform.updateMatrix();glass.current!.setMatrixAt(i,transform.matrix);});
  glass.current!.instanceMatrix.needsUpdate=true;glass.current!.computeBoundingSphere();
  trees.forEach((tree,i)=>{
   transform.position.set(tree.x,(tree.y??0)+.65*tree.scale,tree.z);transform.scale.setScalar((tree.y??0)>visibleFloor*12?0:tree.scale);transform.updateMatrix();trunks.current!.setMatrixAt(i,transform.matrix);
   transform.position.set(tree.x,(tree.y??0)+2.1*tree.scale,tree.z);transform.updateMatrix();leaves.current!.setMatrixAt(i,transform.matrix);
  });
  const tint=new Color();beanbags.forEach((p,i)=>{transform.position.set(p.x,p.y,p.z);transform.rotation.set(0,0,0);transform.scale.set(p.back?1.12:1.25,p.back?.55:.65,p.back?.7:1.15);if(p.y>visibleFloor*12+3)transform.scale.setScalar(0);transform.updateMatrix();bags.current!.setMatrixAt(i,transform.matrix);bags.current!.setColorAt(i,tint.set(p.colour));});bags.current!.instanceMatrix.needsUpdate=true;bags.current!.instanceColor!.needsUpdate=true;bags.current!.computeBoundingSphere();
  for(const m of [trunks.current!,leaves.current!]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}
 },[visibleFloor]);
 useLayoutEffect(()=>{
  const colour=new Color();batches.forEach((batch,section)=>{
   const mesh=meshes.current[section]!;
   batch.forEach((b,i)=>mesh.setColorAt(i,colour.set(b.seat!==undefined&&(occupied&(1<<b.seat))?"#ae8965":b.colour)));
   mesh.instanceColor!.needsUpdate=true;
  });
 },[occupied]);
 useLayoutEffect(()=>{const t=new Object3D();glazing.forEach((p,i)=>{t.position.set(...p.position);t.scale.set(...p.size);if(!frosted.includes(p.room)||p.position[1]>visibleFloor*12+6)t.scale.setScalar(0);t.updateMatrix();screens.current!.setMatrixAt(i,t.matrix);});screens.current!.instanceMatrix.needsUpdate=true;screens.current!.computeBoundingSphere();},[frosted,visibleFloor]);
 return <>
  {/* Toggle the receiveShadow uniform, keeping the cached shader/map pipeline warm. */}
  {batches.map((batch,i)=><instancedMesh key={i} ref={el=>{meshes.current[i]=el;}} args={[geometry,material,batch.length]} castShadow receiveShadow={detailedShadows}/>)}
  <instancedMesh name="room-focus-glass" ref={screens} args={[geometry,undefined,glazing.length]}><meshLambertMaterial color="#b8cfbe"/></instancedMesh>
  <instancedMesh ref={glass} args={[geometry,glassMaterial,glazing.length]} renderOrder={1}/>
  <instancedMesh name="campus-beanbags" ref={bags} args={[undefined,undefined,beanbags.length]}><icosahedronGeometry args={[1,2]}/><meshLambertMaterial/></instancedMesh>
  <instancedMesh ref={trunks} args={[undefined,undefined,trees.length]} castShadow><cylinderGeometry args={[.38,.5,1.3,7]}/><meshLambertMaterial color="#a28465"/></instancedMesh>
  <instancedMesh ref={leaves} args={[undefined,undefined,trees.length]} castShadow><icosahedronGeometry args={[1.35,1]}/><meshLambertMaterial color="#799c75"/></instancedMesh>
 </>;
});
export default SchoolModel;
