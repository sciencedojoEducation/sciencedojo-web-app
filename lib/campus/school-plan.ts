/** Shared public architecture only: no accounts, courses or learning activity. */
export const SCHOOL_REVISION = "school-v3-living-cube";
export const SCHOOL_BOUNDS = { minX: -64, maxX: 64, minZ: -39, maxZ: 42, speed: 3 };
export type Place = { id: string; name: string; kind: string; x: number; z: number; width: number; depth: number; colour: string; accent: string; description: string; outdoor?: boolean; floor?: number };
const groundPlaces: readonly Place[] = [
  { id: "garden", name: "Quiet garden", kind: "garden", x: -52, z: -26, width: 20, depth: 18, colour: "#c1d3a7", accent: "#75946a", description: "A leafy place to take a quiet break.", outdoor: true },
  { id: "art", name: "Art studio", kind: "art", x: -26, z: -26, width: 20, depth: 18, colour: "#ead4c3", accent: "#b36d55", description: "Easels, colour and room for new ideas." },
  { id: "classroom-a", name: "Classroom A", kind: "classroom", x: 0, z: -26, width: 20, depth: 18, colour: "#d7dfcc", accent: "#6c8c72", description: "A bright classroom with laptop study stations." },
  { id: "music", name: "Music room", kind: "music", x: 26, z: -26, width: 20, depth: 18, colour: "#ddd3e5", accent: "#8b739b", description: "Pianos, practice spaces and a small performance corner." },
  { id: "greenhouse", name: "Greenhouse", kind: "greenhouse", x: 52, z: -26, width: 20, depth: 18, colour: "#d0dfc4", accent: "#6b9b79", description: "Explore the school's growing beds and botanical collection.", outdoor: true },
  { id: "auditorium", name: "Auditorium", kind: "auditorium", x: -52, z: 0, width: 20, depth: 18, colour: "#daccc0", accent: "#9a6358", description: "A tiered gathering space and stage." },
  { id: "science", name: "Science lab", kind: "science", x: -26, z: 0, width: 20, depth: 18, colour: "#d2e3df", accent: "#588f8a", description: "Laboratory benches, microscopes and a demonstration area." },
  { id: "library", name: "Library", kind: "library", x: 0, z: 0, width: 20, depth: 18, colour: "#ede9dc", accent: "#477a70", description: "Books, quiet company and the original four study computers." },
  { id: "computer", name: "Computer lab", kind: "computer", x: 26, z: 0, width: 20, depth: 18, colour: "#d6e0e6", accent: "#597f99", description: "Four connected workstations opening your existing learning." },
  { id: "sports", name: "Sports court", kind: "sports", x: 52, z: 0, width: 20, depth: 18, colour: "#bdcfc1", accent: "#668b77", description: "A playable shared basketball court. E picks up the ball; aim, hold E and release to shoot. Two hoops, rebounds and court scores.", outdoor: true },
  { id: "gym", name: "Sports hall", kind: "gym", x: -52, z: 26, width: 20, depth: 18, colour: "#d9c39e", accent: "#9b7a4e", description: "A school gym with court markings and training space." },
  { id: "classroom-b", name: "Classroom B", kind: "classroom", x: -26, z: 26, width: 20, depth: 18, colour: "#e4d8b9", accent: "#a18d54", description: "A second classroom for independent study and school life." },
  { id: "reception", name: "Reception", kind: "reception", x: 0, z: 26, width: 20, depth: 18, colour: "#e8dfd0", accent: "#917b61", description: "The school's welcome desk and central meeting point." },
  { id: "cafeteria", name: "Cafeteria", kind: "cafeteria", x: 26, z: 26, width: 20, depth: 18, colour: "#ead5bf", accent: "#b28460", description: "Shared tables, a serving counter and a relaxed break space." },
  { id: "courtyard", name: "Courtyard", kind: "courtyard", x: 52, z: 26, width: 20, depth: 18, colour: "#d7ddcf", accent: "#819578", description: "An open courtyard with seating, trees and a fountain.", outdoor: true },
];
export const GROUND_SEATS = [
  { id: "desk-1", x: -4.5, z: -3, name: "Desk 1", place: "library" },
  { id: "desk-2", x: -1.5, z: -3, name: "Desk 2", place: "library" },
  { id: "desk-3", x: 1.5, z: -3, name: "Desk 3", place: "library" },
  { id: "desk-4", x: 4.5, z: -3, name: "Desk 4", place: "library" },
  { id: "lab-1", x: 21.5, z: -3, name: "Lab computer 1", place: "computer" },
  { id: "lab-2", x: 24.5, z: -3, name: "Lab computer 2", place: "computer" },
  { id: "lab-3", x: 27.5, z: -3, name: "Lab computer 3", place: "computer" },
  { id: "lab-4", x: 30.5, z: -3, name: "Lab computer 4", place: "computer" },
  { id: "class-1", x: -3, z: -29, name: "Classroom laptop 1", place: "classroom-a" },
  { id: "class-2", x: 3, z: -29, name: "Classroom laptop 2", place: "classroom-a" },
] as const;

export const SCHOOL_FLOORS = [{id:0,name:"Ground · School life",y:0},{id:1,name:"Level 1 · Learning & discovery",y:12},{id:2,name:"Level 2 · Nature & wellbeing",y:24}] as const;
const upper = [
 ["seminar","Seminar classroom","classroom",-26,-26,1,"A bright classroom. Its laptops open your existing authorized lessons."],
 ["physics","Physics studio","science",0,-26,1,"Experiment benches and a quiet scientific setting."],
 ["reading","Reading lounge","lounge",26,-26,1,"Beanbags, books and plants for a slower study rhythm."],
 ["project","Project classroom","classroom",-52,0,1,"Independent learning with your own courses and progress."],
 ["digital","Digital study lab","computer",52,0,1,"Connected workstations for your existing learning."],
 ["tea","Tea garden","lounge",26,26,1,"A planted, cozy break between lessons."],
 ["astronomy","Astronomy classroom","classroom",-26,-26,2,"A science classroom under the Cube’s changing sky."],
 ["botany","Botanical studio","science",0,-26,2,"A natural science room with laboratory benches."],
 ["quiet","Quiet study lounge","lounge",26,-26,2,"Soft beanbags, greenery and quiet laptop study."],
 ["fitness","Fitness studio","fitness",-52,0,2,"Training mats, treadmills and strength equipment for a break."],
 ["conservatory","Sky conservatory","garden",52,0,2,"Trees, comfortable benches and views across the school."],
 ["commons","Sky Commons · Games Lounge","lounge",26,26,2,"Four in a Row and Dots & Boxes, beanbag seats and leafy views. Press E near a game table."]
] as const;
// Fixed room identifiers and geometry only; no lesson choices or learner data.
export const SCHOOL_PLACES:readonly Place[]=[...groundPlaces,...upper.map(([id,name,kind,x,z,floor,description])=>({id,name,kind,x,z,floor,description,width:20,depth:18,colour:floor===1?"#dce5d7":"#dedbc8",accent:floor===1?"#668d83":"#82946a",outdoor:kind==="garden"}))];
export const STUDY_SEATS: readonly {id:string;x:number;z:number;name:string;place:string;floor?:number}[] = [
 ...GROUND_SEATS,
 ...["seminar","project","digital","astronomy","quiet"].flatMap(id=>{
  const room=SCHOOL_PLACES.find(p=>p.id===id)!;
  return [-3,3].map((x,i)=>({id:`${id}-${i+1}`,x:room.x+x,z:room.z-3,name:`${room.name} laptop ${i+1}`,place:id,floor:room.floor}));
 })
];
export const floorHeight=(floor=0)=>SCHOOL_FLOORS[floor]?.y??0;
export type Stance="stand"|"crouch"|"prone";
export const movementSpeed=(stance:Stance="stand",run=false)=>stance==="prone"?.8:stance==="crouch"?1.45:run?5.5:3;
export const postureEye=(stance:Stance="stand")=>stance==="prone"?.4:stance==="crouch"?1.05:1.67;
export type Connector={id:"lift"|"escalator"|"slide";name:string;x:number;z:number;exitX:number;exitZ:number;duration:number;shaftX?:number};
export const SCHOOL_CONNECTORS:readonly Connector[]=[
 {id:"lift",name:"Glass elevator",x:-17,z:39,exitX:-17,exitZ:39,duration:3500,shaftX:-13},
 {id:"escalator",name:"Moving escalator",x:39,z:13,exitX:39,exitZ:-13,duration:6500},
 {id:"slide",name:"Garden slide",x:-39,z:13,exitX:-39,exitZ:39,duration:4500}
];
export const glassSwitch=(room:Place)=>({x:room.x+3.3,z:room.z+7.8,floor:room.floor??0});

/** Shared floor voids: renderer subtraction, authority and SQL collision parity. */
export const SCHOOL_TRANSPORT_SHAFTS=[
 {minX:37.5,maxX:40.5,minZ:-12.4,maxZ:12.4},
 {minX:-40.2,maxX:-37.8,minZ:14,maxZ:38},
 {minX:-14.7,maxX:-11.3,minZ:37.2,maxZ:40.8}
] as const;
