"use client";
import {useEffect,useRef,useState,type RefObject} from "react";
import {createPortal} from "react-dom";
import {GAME_TABLES,type GameKind} from "@/lib/campus/board-games";
import type {PlayState,PlayInvitation} from "@/lib/campus/game-location";
import "./play-together.css";
export default function PlayTogether({connected,suppressed,onOpen,onNavigate,onSafety,gameHeaders,anchor,immersive,expanded}: {
  immersive:boolean;expanded:boolean;anchor:RefObject<HTMLSpanElement|null>;gameHeaders:()=>Record<string,string>;connected:boolean;suppressed:boolean;onOpen:()=>void;onNavigate:(table:GameKind)=>void;
  onSafety:(target:string,action:"block"|"report")=>void;
}){
  const panel=useRef<HTMLElement>(null),choices=useRef<HTMLDetailsElement>(null);
  const [state,setState]=useState<PlayState>({invitation:null,nearby:[]});
  const [game,setGame]=useState<GameKind>("four"),[muted,setMuted]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const previous=useRef<PlayInvitation|null>(null),quiet=useRef(suppressed);quiet.current=suppressed;
  const availability=useRef<(value:boolean)=>void>(()=>{});
  const action=useRef<(body:object)=>void>(()=>{}),mute=useRef(false);mute.current=muted;
  useEffect(()=>{
    if(!connected)return;
    let stopped=false,running=false,queued:object|undefined,timer:ReturnType<typeof setTimeout>;
    const controller=new AbortController();
    async function request(body?:object){
      if(stopped)return;
      if(running){if(body)queued=body;return;}
      running=true;if(body)setBusy(true);
      try{
        const response=await fetch('/api/campus/play',{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',
          headers:{...gameHeaders(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,
          signal:AbortSignal.any([controller.signal,AbortSignal.timeout(5000)])});
        const next=await response.json();if(stopped)return;
        if(response.ok){
          if(previous.current&&!next.invitation&&!body&&!quiet.current)setMessage(new Date(previous.current.expires).getTime()<=Date.now()?
            previous.current.state==='accepted'?"Table reservation expired. You can arrange another game.":"Invitation expired. You can invite again.":"Invitation ended or the other player became unavailable.");
          if(body||(next.invitation&&next.invitation.id!==previous.current?.id))setMessage("");
          previous.current=next.invitation;setState(next);
        }
        else {setState({invitation:null,nearby:[]});if(body)setMessage(next.error||"Unable to update invitation.");}
      }catch{if(!stopped){setState({invitation:null,nearby:[]});if(body)setMessage("Play invitations are temporarily unavailable.");}}
      finally{running=false;if(!stopped){setBusy(false);if(queued){const next=queued;queued=undefined;void request(next);}}}
    }
    action.current=body=>{onOpen();void request(body);};
    let applied=mute.current||quiet.current;
    availability.current=value=>{if(value===applied)return;applied=value;void request({action:'mute',muted:value});};
    const poll=async()=>{if(!document.hidden)await request();if(!stopped)timer=setTimeout(poll,1500);};
    void request({action:'mute',muted:applied}).then(poll);
    return()=>{stopped=true;controller.abort();clearTimeout(timer);action.current=()=>{};availability.current=()=>{};};
  },[connected,onOpen,gameHeaders]);
  useEffect(()=>{if(connected)availability.current(muted||suppressed);},[connected,muted,suppressed]);
  if(!connected||suppressed)return null;
  const invite=state.invitation,table=GAME_TABLES.find(t=>t.id===invite?.table);
  return <>{anchor.current&&createPortal(<button className="secondary" aria-live="polite" title={invite?.incoming?`${invite.pseudonym} invites you to ${table?.name}`:"Invite a nearby player"} onClick={()=>{onOpen();if(choices.current)choices.current.open=true;panel.current?.scrollIntoView({block:"nearest"});panel.current?.focus({preventScroll:true});}}>Play together{invite?.state==='pending'&&invite.incoming?" · New invite":invite?.state==='accepted'?" · Meet at table":""}</button>,anchor.current)}
  <aside ref={panel} data-campus-panel="play" hidden={immersive&&!expanded} tabIndex={-1} className="campus-play-together" aria-label="Play together">
    <details ref={choices}><summary onClick={onOpen}>Play together{invite?" · invitation":state.nearby.length?` · ${state.nearby.length} nearby`:""}</summary>
      <label><input type="checkbox" checked={muted} onChange={e=>{onOpen();setMuted(e.target.checked);}}/>Mute play invitations</label>
      {!invite&&<><p>Meet someone nearby and invite them to a table in the Level 2 Games Lounge.</p>
        <label>Invitation game<select value={game} onChange={e=>setGame(e.target.value as GameKind)}>{GAME_TABLES.map(t=><option key={t.id} value={t.id}>{t.name} · {t.id==='four'?'2':'2–4'} players</option>)}</select></label>
        {!state.nearby.length&&<p>No available players nearby.</p>}
        {state.nearby.map(p=><button key={p.id} disabled={busy} onClick={()=>action.current({action:"send",target:p.id,table:game})}>Play together with {p.pseudonym}</button>)}
      </>}
    </details>
    {invite&&<div className="campus-play-card" role="status" aria-live="polite">
      <strong>{invite.state==='accepted'?`Meet ${invite.pseudonym} at ${table?.name}`:invite.incoming?`${invite.pseudonym} invites you to ${table?.name}`:`Invitation sent to ${invite.pseudonym}`}</strong>
      <p>{invite.state==='accepted'?"Level 2 · Sky Commons. Walk to your table and press E, then choose Join. Your profile is shared only after Join.":"Invitation lasts 30 seconds. You choose whether to play."}</p>
      <div>{invite.state==='pending'&&invite.incoming?<><button disabled={busy||muted} onClick={()=>action.current({action:'accept',id:invite.id})}>Accept invitation</button><button disabled={busy} onClick={()=>action.current({action:'decline',id:invite.id})}>Decline invitation</button></>:
        <>{invite.state==='accepted'&&<button onClick={()=>{onOpen();onNavigate(invite.table);}}>Walk to reserved table</button>}<button disabled={busy} onClick={()=>action.current({action:'cancel',id:invite.id})}>Cancel invitation</button></>}</div>
      <small>{invite.state==='accepted'?'Reservation ends':'Reply before'} {new Date(invite.expires).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small>
      <details><summary onClick={onOpen}>Report or block inviter</summary><button onClick={()=>{onOpen();onSafety(invite.peer,'report');}}>Report invitation</button><button onClick={()=>{onOpen();onSafety(invite.peer,'block');}}>Block player</button></details>
    </div>}
    {message&&<p role="alert">{message}</p>}
  </aside></>;
}
