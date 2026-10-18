"use client";
import {useEffect,useRef} from "react";
import {currentShotPower,suggestedShot,type BasketballSnapshot,type CourtPlayer,type ShotControl} from "@/lib/campus/basketball";
export default function BasketballHud({ball,self,charge,charging,power,target,onPower,onFace,onShoot,onDrop}:{
 ball:BasketballSnapshot;self:CourtPlayer;charge:{current:ShotControl};charging:boolean;power:number;target:'north'|'south';
 onPower:(power:number)=>void;onFace:(side:'north'|'south')=>void;onShoot:()=>void;onDrop:()=>void;
}){
 const meter=useRef<HTMLMeterElement>(null),readout=useRef<HTMLSpanElement>(null);
 const mine=ball.holder===self.id,suggested=suggestedShot(self,1.67,target);
 useEffect(()=>{
  if(!charging){if(meter.current)meter.current.value=power;if(readout.current)readout.current.textContent=`${Math.round(power*100)}%`;return;}
  let frame=0;
  const update=()=>{
   const value=currentShotPower(charge.current,performance.now());
   if(meter.current)meter.current.value=value;
   if(readout.current)readout.current.textContent=`${Math.round(value*100)}%`;
   frame=requestAnimationFrame(update);
  };
  frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);
 },[charging,charge,power]);
 const result=ball.kind==='basket'?`${ball.points} points · ${ball.hoop==='north'?'North':'South'} hoop`:
  ball.kind==='out'?'Out of bounds · ball returned to centre':mine?'Your ball · aim, hold E, release to shoot':ball.mode==='held'?'Ball in play · wait for a rebound':'Find the ball · E to pick up';
 return <section className="basketball-hud" aria-label="Basketball court">
  <div className="basketball-score"><span>North <b>{ball.north}</b></span><strong>Basketball</strong><span>South <b>{ball.south}</b></span></div>
  <p className="basketball-result" role="status">{result}</p>
  {ball.mode==='loose'&&<small className="basketball-distance">Ball {Math.hypot(self.x-ball.x,self.z-ball.z).toFixed(1)} m away · look for the gold ring</small>}
  {mine&&<>
   <div className="basketball-power"><label htmlFor="basketball-power">Shot power</label><span ref={readout}>{Math.round(power*100)}%</span><div className="basketball-power-bar"><meter ref={meter} aria-label="Shot charge" min="0" max="1" value={power}/>{suggested.clear&&<i aria-hidden="true" style={{left:`${suggested.power*100}%`}}/>}</div></div>
   <input id="basketball-power" aria-label="Shot power" type="range" min=".12" max="1" step=".005" value={power} disabled={charging} onChange={event=>onPower(Number(event.target.value))}/>
   <small>{suggested.clear?`Face ${target} hoop: about ${Math.round(suggested.power*100)}%. Follow the dotted arc.`:`Move back into the court, in front of the ${target} hoop.`}</small>
   <div className="basketball-buttons"><button className="secondary" onClick={()=>onFace('north')}>Face north hoop</button><button className="secondary" onClick={()=>onFace('south')}>Face south hoop</button><button onClick={onShoot} disabled={charging}>Shoot ball</button><button className="secondary" onClick={onDrop}>Put down ball</button></div>
  </>}
 </section>;
}
