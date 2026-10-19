import {SCHOOL_PLACES,STUDY_SEATS,SCHOOL_TRANSPORT_SHAFTS,floorHeight,glassSwitch,type Place} from "./school-plan.ts";
export type V=[number,number,number];
export type Box={position:V;size:V;colour:string;seat?:number;section:number;floor:number};
export const boxes:Box[]=[], trees:{x:number;z:number;scale:number;y?:number}[]=[];
export const beanbags:{x:number;y:number;z:number;colour:string;back?:boolean}[]=[];
export const glazing:{position:V;size:V;room:string}[]=[];
let section=0,base=0,solid=false;
export const furniture:{minX:number;maxX:number;minZ:number;maxZ:number;floor:number}[]=[];
const box=(position:V,size:V,colour:string,seat?:number)=>{
 if(solid&&size[1]>.06&&position[1]-size[1]/2>=.16&&position[1]-size[1]/2<2.7)
  furniture.push({minX:position[0]-size[0]/2,maxX:position[0]+size[0]/2,minZ:position[2]-size[2]/2,maxZ:position[2]+size[2]/2,floor:Math.round(base/12)});
 boxes.push({position:[position[0],position[1]+base,position[2]],size,colour,seat,section,floor:Math.round(base/12)});
};
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
 base=floorHeight(p.floor);solid=false;
 const at=(x:number,y:number,z:number):V=>[p.x+x,y,p.z+z];
 const floor=p.outdoor?p.colour:p.kind==='gym'?p.colour:"#e5eef0";
 box(at(0,-.03,0),[p.width,.18,p.depth],floor);
 box(at(0,.07,0),[p.width-.7,.04,p.depth-.7],floor);
 if(!p.outdoor){
  box(at(0,.12,-9),[20,.24,.36],"#c4d6dd");
  glazing.push({position:at(0,2.2,-9),size:[20,4.2,.06],room:p.id});
  for(const side of [-1,1]){
   box(at(side*10,.12,0),[.36,.24,18],"#c4d6dd");
   glazing.push({position:at(side*10,2.2,0),size:[.06,4.2,18],room:p.id},{position:at(side*6.2,2.2,9),size:[7.6,4.2,.06],room:p.id});
   box(at(side*6.2,.12,9),[7.6,.24,.36],"#c4d6dd");
   for(const z of [-9,9])box(at(side*10,2.2,z),[.42,4.4,.42],p.accent);
   box(at(side*10,4.25,0),[.25,.3,18.4],"#92acb7");
  }
  box(at(0,4.25,-9),[20.6,.3,.5],p.accent);
  for(const side of [-1,1])box(at(side*2.5,1.8,9),[.25,3.6,.3],p.accent);
  box(at(0,3.7,9),[5.2,.3,.36],p.accent);
 }else{
  for(const x of [-9,9])for(const z of [-8,8])box(at(x,.4,z),[.5,.8,.5],p.accent);
 }
 solid=true;
 if(p.kind==='library'){
  box(at(0,.11,1),[5,.02,11],"#a4bfb0");
  for(const x of [-7.2,7.2]){
   box(at(x,1.4,-6.8),[3.8,2.8,.7],"#7a6954");
   for(const y of [.5,1.3,2.1]){
    box(at(x,y,-6.3),[3.8,.08,.9],"#b49b77");
    for(let i=0;i<11;i++)box(at(x-1.5+i*.29,y+.24,-6.4),[.17,.4+i%3*.05,.35],["#477a70","#ceae70","#ac7462","#ded7bb"][i%4]);
   }
  }
  for(const x of [-7.6,7.6])for(const z of [3,6])trees.push({y:base,x:p.x+x,z:p.z+z,scale:.8});
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
   if(p.kind==='gym')box(at(0,2.9,side*6.6),[1,.08,.8],"#bc8768");}
  box(at(0,.145,0),[16,.03,.12],"#f1e9d5");
  for(const side of [-1,1]){box(at(side*5.5,.145,0),[.12,.01,5],"#f1e9d5");for(const z of [-2.5,2.5])box(at(side*6.7,.145,z),[2.6,.01,.12],"#f1e9d5");}
 }
 if(['garden','greenhouse','courtyard'].includes(p.kind)){
  for(const x of [-6,6])for(const z of [-5,5]){
   if(p.kind==='greenhouse')box(at(x,.45,z),[4,.9,4],"#92795d");
   trees.push({y:base,x:p.x+x,z:p.z+z,scale:p.kind==='garden'?1.7:1.1});
  }
  for(const side of [-1,1]){box(at(side*5,.65,1),[3,.2,1.1],"#9a886b");box(at(side*5,1,1.5),[3,.9,.15],"#9a886b");}
  box(at(0,.11,0),[3.5,.02,15],"#e4dfce");
  if(p.kind==='courtyard'){box(at(0,.65,-4),[4,1.3,4],"#b4bfae");box(at(0,1.35,-4),[3.5,.08,3.5],"#8cb7b5");}
  if(p.kind==='greenhouse')for(const side of [-1,1]){
   box(at(side*9,2.5,0),[.15,5,17],"#89a99b");box(at(0,5.2,side*8.5),[18.4,.15,.2],"#89a99b");
  }
 }
 if(p.kind==='lounge'){
  box(at(0,.12,1),[12,.04,11],"#a5b6a0");
  for(const x of [-6,6])for(const z of [-4,3]){
   beanbags.push({x:p.x+x,y:base+.48,z:p.z+z,colour:p.accent},{x:p.x+x,y:base+.8,z:p.z+z+.55,colour:p.accent,back:true});
   furniture.push({minX:p.x+x-1.2,maxX:p.x+x+1.2,minZ:p.z+z-1.15,maxZ:p.z+z+1.15,floor:p.floor??0});
   box(at(x+.7,.44,z-.7),[.7,.8,.7],"#c6b18c");
   trees.push({x:p.x+x,z:p.z-7,scale:1,y:base});
  }
  for(const x of [-7,7])box(at(x,1.2,-7),[3,2.4,.8],"#9a896c");
 }
 if(p.kind==='fitness'){
  for(const x of [-6,0,6]){
   box(at(x,.32,-3),[2,.6,4],"#64877c");box(at(x,1.3,-4.5),[2,.2,.2],"#46615c");
   for(const side of [-1,1])box(at(x+side*.8,.85,-4.5),[.12,1.2,.12],"#46615c");
   box(at(x,.13,4),[2.7,.14,4],"#a5b8a3");
  }
  box(at(0,1,-7),[9,1.8,1.3],"#778d85");
 }

}
SCHOOL_PLACES.forEach((place,i)=>{
 section=i+1;room(place);
 if(!place.outdoor){solid=false;const sw=glassSwitch(place);box([sw.x,1.35,sw.z],[.45,.6,.15],"#406d67");box([sw.x,1.4,sw.z+.09],[.24,.19,.04],"#b7ead7");}
});
STUDY_SEATS.forEach((seat,i)=>{
 section=SCHOOL_PLACES.findIndex(p=>p.id===seat.place)+1;base=floorHeight(seat.floor);solid=true;
 const at=(x:number,y:number,z:number):V=>[seat.x+x,y,seat.z+z];const laptop=i===2||i===3||i>=8;
 box(at(0,1.1,-.7),[2.3,.15,1.3],"#c5ac83");for(const x of [-.9,.9])box(at(x,.5,-.7),[.12,1,.9],"#55766b");
 box(at(0,laptop?1.45:1.58,-1),[1.05,laptop?.5:.67,.1],"#264c49");
 box(at(0,laptop?1.45:1.58,-.935),[.89,laptop?.38:.52,.02],"#a2ccba");
 box(at(0,1.21,-.65),[laptop?1.12:.8,.06,laptop?.7:.26],"#546c69");
 box(at(0,.55,0),[.8,.15,.8],"#53877b",i);box(at(0,.95,.38),[.8,.85,.12],"#53877b");
});
section=0;base=0;solid=false;
// Trees frame the school, leaving the connected paths open.
for(const x of [-63,63])for(const z of [-37,-20,-7,17,38])trees.push({x,z,scale:1.7});
for(const side of [-1,1]){box([side*5,2.2,40],[.7,4.4,.7],"#487469");box([side*2.7,3.9,40],[4.6,.35,.5],"#487469");}


for(const panel of glazing){const room=SCHOOL_PLACES.find(p=>p.id===panel.room)!;panel.position[1]+=floorHeight(room.floor);}
for(const tree of trees)furniture.push({minX:tree.x-.5*tree.scale,maxX:tree.x+.5*tree.scale,minZ:tree.z-.5*tree.scale,maxZ:tree.z+.5*tree.scale,floor:Math.round((tree.y??0)/12)});
// Real upper slabs; safe bounded edges and a skylit central atrium.
for(const floor of [1,2]){
 base=floorHeight(floor);section=0;solid=false;
 // Subtract all transport shafts, including the top slide passing level 1.
 type Rect={l:number;r:number;b:number;f:number};
 const holes:Rect[]=SCHOOL_TRANSPORT_SHAFTS.map(s=>({l:s.minX,r:s.maxX,b:s.minZ,f:s.maxZ}));
 let slabs:Rect[]=[{l:-64,r:64,b:-39,f:3},{l:-64,r:-26,b:3,f:22},{l:26,r:64,b:3,f:22},{l:-64,r:64,b:22,f:42}];
 for(const hole of holes)slabs=slabs.flatMap(r=>{
  const l=Math.max(r.l,hole.l),right=Math.min(r.r,hole.r),b=Math.max(r.b,hole.b),f=Math.min(r.f,hole.f);
  if(l>=right||b>=f)return [r];
  return [{l:r.l,r:r.r,b:r.b,f:b},{l:r.l,r:r.r,b:f,f:r.f},{l:r.l,r:l,b,f},{l:right,r:r.r,b,f}].filter(r=>r.r>r.l&&r.f>r.b);
 });
 for(const r of slabs)box([(r.l+r.r)/2,-.27,(r.b+r.f)/2],[r.r-r.l,.5,r.f-r.b],"#dce3d7");
 // Railings protect the atrium and outer floor edges.
 for(const x of [-64,64])box([x,.65,1.5],[.14,1.3,81],"#8ca79c");
 for(const z of [-39,42])box([0,.65,z],[128,1.3,.14],"#8ca79c");
 for(const x of [-26,26])box([x,.65,12.5],[.14,1.3,19],"#8ca79c");
 for(const z of [3,22])box([0,.65,z],[52,1.3,.14],"#8ca79c");
}
base=0;
