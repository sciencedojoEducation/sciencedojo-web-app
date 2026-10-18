"use client";
import {memo,useLayoutEffect,useRef} from "react";
import {Color,Object3D,type InstancedMesh} from "three";
import {SCHOOL_PLACES,STUDY_SEATS,type Place} from "@/lib/campus/school-layout";
type V=[number,number,number];
type Box={position:V;size:V;colour:string;seat?:number};
const boxes:Box[]=[], trees:{x:number;z:number;scale:number}[]=[];
const box=(position:V,size:V,colour:string,seat?:number)=>boxes.push({position,size,colour,seat});
box([0,-.5,1],[134,.8,88],"#9fb797");
box([0,-.05,1],[130,.15,84],"#c6d1b9");
// A connected school: broad east/west concourses and north/south corridors.
for(const z of [-13,13,39])box([0,.015,z],[128,.13,5.7],"#e2dfd1");
for(const x of [-39,-13,13,39])box([x,.015,0],[5.7,.13,80],"#e2dfd1");
for(const z of [-13,13,39])box([0,.085,z],[124,.02,.12],"#a9b9a1");
const chair=(x:number,z:number,c="#7d9d8c")=>{box([x,.53,z],[.78,.15,.78],c);box([x,.93,z+.33],[.78,.85,.12],c);};
function table(x:number,z:number,w=2.7,d=1.5,c="#bda780"){
 box([x,1.1,z],[w,.15,d],c);for(const side of [-1,1])box([x+side*(w/2-.15),.5,z],[.13,1,d-.2],"#647b71");
}
function board(p:Place){
 box([p.x,2.25,p.z-8.7],[9,2.35,.14],"#48695e");box([p.x,1.1,p.z-8.5],[9.4,.1,.5],"#b79e7d");
 for(let i=0;i<4;i++)box([p.x-3+i*1.7,2.45,p.z-8.6],[1.1,.05,.025],"#c5dacb");
}
function room(p:Place){
 const at=(x:number,y:number,z:number):V=>[p.x+x,y,p.z+z];
 box(at(0,-.03,0),[p.width,.18,p.depth],p.colour);
 box(at(0,.07,0),[p.width-.7,.04,p.depth-.7],p.colour);
 if(!p.outdoor){
  box(at(0,1.8,-9),[20,.0+3.6,.36],"#e1e2d6");
  for(const side of [-1,1]){
   box(at(side*10,.7,0),[.36,1.4,18],"#cbd4c6");
   box(at(side*6.2,.48,9),[7.6,.96,.36],"#cbd4c6");
   for(const z of [-9,9])box(at(side*10,2.2,z),[.42,4.4,.42],p.accent);
   box(at(side*6.8,2.25,-8.75),[3.5,1.6,.08],"#a5c7c3");
  }
  box(at(0,4.25,-9),[20.6,.3,.5],p.accent);
  for(const side of [-1,1])box(at(side*2.5,1.8,9),[.25,3.6,.3],p.accent);
  box(at(0,3.7,9),[5.2,.3,.36],p.accent);
 }else{
  for(const x of [-9,9])for(const z of [-8,8])box(at(x,.4,z),[.5,.8,.5],p.accent);
 }
 if(p.kind==='library'){
  box(at(0,.11,1),[5,.02,11],"#a4bfb0");
  for(const x of [-7.2,7.2]){
   box(at(x,1.4,-6.8),[3.8,2.8,.7],"#7a6954");
   for(const y of [.5,1.3,2.1]){
    box(at(x,y,-6.3),[3.8,.08,.9],"#b49b77");
    for(let i=0;i<11;i++)box(at(x-1.5+i*.29,y+.24,-6.4),[.17,.4+i%3*.05,.35],["#477a70","#ceae70","#ac7462","#ded7bb"][i%4]);
   }
  }
  for(const x of [-7.6,7.6])for(const z of [3,6])trees.push({x:p.x+x,z:p.z+z,scale:.8});
 }
 if(p.kind==='classroom'){
  board(p);
  for(const x of [-6,-2,2,6])for(const z of [0,4]){table(p.x+x,p.z+z,2.4,1.2);chair(p.x+x,p.z+z+.95);}
  table(p.x-6,p.z-5,3,1.6);chair(p.x-6,p.z-6.3,p.accent);
  box(at(7.5,1,-6),[3,2,2],"#afbaaa");
 }
 if(p.kind==='computer'){
  board(p);
  for(const side of [-1,1]){table(p.x+side*6,p.z+4,4,1.4);chair(p.x+side*6,p.z+5.2);}
  box(at(7.5,1.25,-6.5),[2.2,2.5,1.1],"#7e969d");
  for(let i=0;i<6;i++)box(at(7.5,.4+i*.35,-5.91),[1.7,.06,.05],"#c6dbda");
 }
 if(p.kind==='science'){
  board(p);
  for(const x of [-5,5])for(const z of [-3,3]){
   table(p.x+x,p.z+z,4.6,2,"#a3bbb4");chair(p.x+x,p.z+z+1.4,"#638c83");
   box(at(x,1.6,z),[.18,.8,.18],"#445f60");box(at(x-.25,1.9,z),[.7,.15,.25],"#445f60");
   box(at(x+1.1,1.45,z),[.35,.6,.35],"#80b9ba");box(at(x+1.6,1.35,z),[.25,.4,.25],"#c8a267");
  }
  box(at(0,1,-7),[8,2,1.2],"#a2b8ac");
 }
 if(p.kind==='art'){
  for(const x of [-6,0,6])for(const z of [-3,3]){
   box(at(x,1.2,z),[.14,2.4,.3],"#a58968");box(at(x,1.75,z),[2,1.6,.14],"#f3ead5");
   box(at(x-.4,1.8,z+.1),[.8,.9,.03],p.accent);box(at(x+.4,1.6,z+.12),[.6,.6,.03],"#88ab96");
  }
  table(p.x,p.z+6,8,1.5);box(at(-8,1,-6),[2,2,3],"#b99b7a");
 }
 if(p.kind==='music'){
  for(const x of [-6,5])for(const z of [-4,3]){
   box(at(x,.8,z),[3.6,1.6,1.6],"#3e4e4d");box(at(x,1.3,z+1),[3.6,.2,.7],"#e8e7d8");
   for(let i=0;i<12;i++)box(at(x-1.55+i*.28,1.45,z+.85),[.1,.12,.4],"#344640");
   chair(p.x+x,p.z+2+z,"#7c6c84");
  }
  box(at(0,.35,-6.5),[12,.7,3],"#ad93ac");
 }
 if(p.kind==='auditorium'){
  box(at(0,.6,-6),[17,1.2,5],"#a48773");box(at(0,2.6,-8.6),[11,3,.1],"#ece8da");
  for(let row=0;row<4;row++)for(const side of [-1,1])for(let col=0;col<4;col++){
   const x=side*(1.7+col*1.9),z=-1+row*2;chair(p.x+x,p.z+z,"#aa776c");
  }
  box(at(-5,1.55,-5),[1.4,1.8,1],"#756757");
 }
 if(p.kind==='cafeteria'){
  box(at(0,1,-7),[17,2,2],"#bd9876");box(at(0,2.1,-7),[17.4,.15,2.3],"#e1c7a3");
  for(const x of [-5,5])for(const z of [-1,4]){
   table(p.x+x,p.z+z,4,1.8,"#c6a77f");for(const side of [-1,1])for(const xx of [-1.1,1.1])chair(p.x+x+xx,p.z+z+side*1.5,"#81997d");
  }
  for(let i=0;i<3;i++)box(at(-6+i*6,2.65,-8.6),[4.5,.7,.08],"#758d7b");
 }
 if(p.kind==='reception'){
  box(at(-3,1.1,-3),[9,2.2,2],"#9b8367");box(at(-3,2.25,-3),[9.3,.12,2.3],"#d8c9a7");
  box(at(-4,2.65,-3),[1.3,.8,.15],"#385a53");
  for(const x of [-6,-3,3,6])chair(p.x+x,p.z+4,"#9cae9b");
  box(at(6,2,-6.5),[4,2.5,.15],"#738c7b");
 }
 if(p.kind==='sports'||p.kind==='gym'){
  box(at(0,.12,0),[16,.02,14],p.kind==='gym'?"#c89d6a":"#6b9b8d");
  for(const side of [-1,1]){box(at(side*8,.145,0),[.12,.03,14],"#f1e9d5");box(at(0,.145,side*7),[16,.03,.12],"#f1e9d5");
   box(at(0,1.9,side*7.5),[.2,3.8,.2],"#6c7d70");box(at(0,3.4,side*7),[2.5,1.5,.15],"#e9e7d9");
   box(at(0,2.9,side*6.6),[1,.08,.8],"#bc8768");}
  box(at(0,.145,0),[16,.03,.12],"#f1e9d5");
  for(const side of [-1,1]){box(at(side*5.5,.145,0),[.12,.01,5],"#f1e9d5");for(const z of [-2.5,2.5])box(at(side*6.7,.145,z),[2.6,.01,.12],"#f1e9d5");}
 }
 if(['garden','greenhouse','courtyard'].includes(p.kind)){
  for(const x of [-6,6])for(const z of [-5,5]){
   if(p.kind==='greenhouse')box(at(x,.45,z),[4,.9,4],"#92795d");
   trees.push({x:p.x+x,z:p.z+z,scale:p.kind==='garden'?1.7:1.1});
  }
  for(const side of [-1,1]){box(at(side*5,.65,1),[3,.2,1.1],"#9a886b");box(at(side*5,1,1.5),[3,.9,.15],"#9a886b");}
  box(at(0,.11,0),[3.5,.02,15],"#e4dfce");
  if(p.kind==='courtyard'){box(at(0,.65,-4),[4,1.3,4],"#b4bfae");box(at(0,1.35,-4),[3.5,.08,3.5],"#8cb7b5");}
  if(p.kind==='greenhouse')for(const side of [-1,1]){
   box(at(side*9,2.5,0),[.15,5,17],"#89a99b");box(at(0,5.2,side*8.5),[18.4,.15,.2],"#89a99b");
  }
 }
}
SCHOOL_PLACES.forEach(room);
STUDY_SEATS.forEach((seat,i)=>{
 const at=(x:number,y:number,z:number):V=>[seat.x+x,y,seat.z+z];const laptop=i===2||i===3||i>=8;
 box(at(0,1.1,-.7),[2.3,.15,1.3],"#c5ac83");for(const x of [-.9,.9])box(at(x,.5,-.7),[.12,1,.9],"#55766b");
 box(at(0,laptop?1.45:1.58,-1),[1.05,laptop?.5:.67,.1],"#264c49");
 box(at(0,laptop?1.45:1.58,-.935),[.89,laptop?.38:.52,.02],"#a2ccba");
 box(at(0,1.21,-.65),[laptop?1.12:.8,.06,laptop?.7:.26],"#546c69");
 box(at(0,.55,0),[.8,.15,.8],"#53877b",i);box(at(0,.95,.38),[.8,.85,.12],"#53877b");
});
// Trees frame the school, leaving the connected paths open.
for(const x of [-63,63])for(const z of [-37,-20,-7,17,38])trees.push({x,z,scale:1.7});
for(const side of [-1,1]){box([side*5,2.2,40],[.7,4.4,.7],"#487469");box([side*2.7,3.9,40],[4.6,.35,.5],"#487469");}

const SchoolModel=memo(function SchoolModel({occupied}:{occupied:number}){
 const mesh=useRef<InstancedMesh>(null),trunks=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  const transform=new Object3D();
  boxes.forEach((b,i)=>{transform.position.set(...b.position);transform.scale.set(...b.size);transform.updateMatrix();mesh.current!.setMatrixAt(i,transform.matrix);});
  mesh.current!.instanceMatrix.needsUpdate=true;mesh.current!.computeBoundingSphere();
  trees.forEach((tree,i)=>{
   transform.position.set(tree.x,.65*tree.scale,tree.z);transform.scale.set(tree.scale,tree.scale,tree.scale);transform.updateMatrix();trunks.current!.setMatrixAt(i,transform.matrix);
   transform.position.set(tree.x,2.1*tree.scale,tree.z);transform.updateMatrix();leaves.current!.setMatrixAt(i,transform.matrix);
  });
  for(const m of [trunks.current!,leaves.current!]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}
 },[]);
 useLayoutEffect(()=>{
  const colour=new Color();boxes.forEach((b,i)=>mesh.current!.setColorAt(i,colour.set(b.seat!==undefined&&(occupied&(1<<b.seat))?"#ae8965":b.colour)));
  mesh.current!.instanceColor!.needsUpdate=true;
 },[occupied]);
 return <>
  <color attach="background" args={["#d7e2d8"]}/><fog attach="fog" args={["#d7e2d8",200,400]}/>
  <ambientLight intensity={1.5}/><directionalLight position={[25,65,35]} intensity={2.4} castShadow shadow-mapSize={[2048,2048]}
    shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={70} shadow-camera-bottom={-70} shadow-camera-far={180}
    shadow-autoUpdate={false} shadow-needsUpdate={true}/>
  <instancedMesh ref={mesh} args={[undefined,undefined,boxes.length]} castShadow receiveShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial roughness={.85}/></instancedMesh>
  <instancedMesh ref={trunks} args={[undefined,undefined,trees.length]} castShadow><cylinderGeometry args={[.38,.5,1.3,7]}/><meshStandardMaterial color="#a28465"/></instancedMesh>
  <instancedMesh ref={leaves} args={[undefined,undefined,trees.length]} castShadow><icosahedronGeometry args={[1.35,1]}/><meshStandardMaterial color="#799c75"/></instancedMesh>
 </>;
});
export default SchoolModel;
