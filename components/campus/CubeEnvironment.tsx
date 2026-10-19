"use client";
import {useLayoutEffect,useMemo,useRef} from "react";
import {BackSide,BufferAttribute,BufferGeometry,Color,Object3D,type DirectionalLight,type InstancedMesh} from "three";
import {schoolSky} from "@/lib/campus/cube-experience";

const vertex=`varying vec3 skyPosition;void main(){skyPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment=`uniform vec3 topColour;uniform vec3 horizonColour;varying vec3 skyPosition;
 void main(){float height=max(0.0,normalize(skyPosition).y);gl_FragColor=vec4(mix(horizonColour,topColour,pow(height,.5)),1.0);}`;
const forest:{x:number;z:number;size:number;base?:number}[]=Array.from({length:180},(_,i)=>{
 const angle=i*2.3999632297,radius=132+(i*73%280),size=5+(i*17%90)/10;
 return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,size};
}).concat([-60,60].flatMap(x=>[-58,57].map(z=>({x,z,size:11})))).concat(
 [18,42,66,90,114,138].flatMap(base=>[-64,64].flatMap(x=>[-50,0,50].map(z=>({x,z,size:4,base})))));

function Landscape({cutaway}:{cutaway:boolean}){
 const trunks=useRef<InstancedMesh>(null),leaves=useRef<InstancedMesh>(null),hills=useRef<InstancedMesh>(null);
 useLayoutEffect(()=>{
  const matrix=new Object3D(),colour=new Color();
  forest.forEach((t,i)=>{
   const size=cutaway&&t.base!==undefined?0:t.size;
   matrix.position.set(t.x,t.size*.3+(t.base??-2),t.z);matrix.scale.set(size*.075,size*.6,size*.075);matrix.updateMatrix();trunks.current!.setMatrixAt(i,matrix.matrix);
   matrix.position.y=t.size*.77+(t.base??-2);matrix.scale.set(size*.38,size*.56,size*.38);matrix.updateMatrix();leaves.current!.setMatrixAt(i,matrix.matrix);
   leaves.current!.setColorAt(i,colour.set(["#477e6a","#5c9577","#78a38a","#37675c"][i%4]));
  });
  for(let i=0;i<9;i++){
   const angle=i*.68;matrix.position.set(Math.cos(angle)*570,-24,Math.sin(angle)*570);
   matrix.scale.set(130+(i%3)*45,60+(i%4)*32,100+(i%2)*65);matrix.updateMatrix();hills.current!.setMatrixAt(i,matrix.matrix);
  }
  for(const mesh of [trunks.current!,leaves.current!,hills.current!]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
  leaves.current!.instanceColor!.needsUpdate=true;
 },[cutaway]);
 return <>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2,0]}><planeGeometry args={[1800,1800]}/><meshLambertMaterial color="#5a8272"/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.7,0]}><ringGeometry args={[88,119,80]}/><meshPhongMaterial color="#5c9ba8" shininess={70}/></mesh>
  <instancedMesh ref={trunks} args={[undefined,undefined,forest.length]}><cylinderGeometry args={[1,1.25,1,6]}/><meshLambertMaterial color="#706656"/></instancedMesh>
  <instancedMesh ref={leaves} args={[undefined,undefined,forest.length]}><icosahedronGeometry args={[1,0]}/><meshLambertMaterial/></instancedMesh>
  <instancedMesh ref={hills} args={[undefined,undefined,9]}><sphereGeometry args={[1,14,8]}/><meshLambertMaterial color="#527d76"/></instancedMesh>
 </>;
}

export default function CubeEnvironment({hour,cutaway=false}:{hour:number;cutaway?:boolean}){
 const sky=useMemo(()=>schoolSky(hour),[hour]),light=useRef<DirectionalLight>(null);
 const uniforms=useMemo(()=>({topColour:{value:new Color(sky.zenith)},horizonColour:{value:new Color(sky.horizon)}}),[sky]);
 const stars=useMemo(()=>{
  const geometry=new BufferGeometry(),points=new Float32Array(1100*3);
  for(let i=0;i<1100;i++){
   const y=.04+((i*613)%1091)/1091*.95,angle=i*2.3999632297,r=Math.sqrt(1-y*y)*1250;
   points.set([Math.cos(angle)*r,y*1250,Math.sin(angle)*r],i*3);
  }
  geometry.setAttribute("position",new BufferAttribute(points,3));return geometry;
 },[]);
 const source=sky.sun.y>.02?sky.sun:sky.moon;
 useLayoutEffect(()=>{if(light.current)light.current.shadow.needsUpdate=true;},[hour]);
 return <>
  <fog attach="fog" args={[sky.horizon,420,1350]}/>
  <mesh renderOrder={-10}><sphereGeometry args={[1400,24,16]}/><shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={BackSide} depthWrite={false} toneMapped={false}/></mesh>
  <points name="cube-stars" geometry={stars} visible={sky.stars>.01}><pointsMaterial color="#e9f5ff" size={1.7} sizeAttenuation={false} transparent opacity={sky.stars} depthWrite={false} fog={false} toneMapped={false}/></points>
  <mesh name="cube-sun" position={[sky.sun.x*950,sky.sun.y*950,sky.sun.z*950]} visible={sky.sun.y>-.03}><sphereGeometry args={[14,16,12]}/><meshBasicMaterial color={sky.sunColour} fog={false} toneMapped={false}/></mesh>
  <mesh name="cube-moon" position={[sky.moon.x*950,sky.moon.y*950,sky.moon.z*950]} visible={sky.moon.y>-.03}><sphereGeometry args={[12,16,12]}/><meshBasicMaterial color="#e3ecff" fog={false} toneMapped={false}/></mesh>
  <ambientLight intensity={.55+sky.daylight*.95} color={sky.daylight>.3?"#e7f5ff":"#8ca5d5"}/>
  <hemisphereLight args={[sky.daylight>.3?"#d8f4ff":"#a3bbef","#485b4b",.55]}/>
  <directionalLight ref={light} position={[source.x*110,Math.max(25,source.y*110),source.z*110]} intensity={sky.daylight>.1?.4+sky.daylight*2:.5} color={sky.daylight>.1?sky.sunColour:"#b6ceff"} castShadow shadow-mapSize={[1024,1024]} shadow-normalBias={.04}
    shadow-camera-left={-95} shadow-camera-right={95} shadow-camera-top={95} shadow-camera-bottom={-95} shadow-camera-far={300} shadow-autoUpdate={false} shadow-needsUpdate={true}/>
  <Landscape cutaway={cutaway}/>
 </>;
}
