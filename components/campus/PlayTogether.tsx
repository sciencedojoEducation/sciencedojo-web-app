"use client";
import {useEffect,useRef,useState} from "react";
import {GAME_TABLES,type GameKind} from "@/lib/campus/board-games";
import type {PlayState} from "@/lib/campus/game-location";
import "./play-together.css";
export default function PlayTogether({connected,suppressed,onOpen,onNavigate,onSafety,gameHeaders}: {
  gameHeaders:()=>Record<string,string>;connected:boolean;suppressed:boolean;onOpen:()=>void;onNavigate:(table:GameKind)=>void;
  onSafety:(target:string,action:"block"|"report")=>void;
}){
  const [state,setState]=useState<PlayState>({invitation:null,nearby:[]});
  const [game,setGame]=useState<GameKind>("four"),[muted,setMuted]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
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
        if(response.ok){setState(next);if(body)setMessage("");}
        else {setState({invitation:null,nearby:[]});if(body)setMessage(next.error||"Unable to update invitation.");}
      }catch{if(!stopped){setState({invitation:null,nearby:[]});if(body)setMessage("Play invitations are temporarily unavailable.");}}
      finally{running=false;if(!stopped){setBusy(false);if(queued){const next=queued;queued=undefined;void request(next);}}}
    }
    action.current=body=>{onOpen();void request(body);};
    const poll=async()=>{if(!document.hidden)await request();if(!stopped)timer=setTimeout(poll,1500);};
    void request({action:'mute',muted:mute.current}).then(poll);
    return()=>{stopped=true;controller.abort();clearTimeout(timer);action.current=()=>{};};
  },[connected,onOpen,gameHeaders]);
  if(!connected||suppressed)return null;
  const invite=state.invitation,table=GAME_TABLES.find(t=>t.id===invite?.table);
  return <aside className="campus-play-together" aria-label="Play together">
    <details><summary onClick={onOpen}>Play together{invite?" · invitation":state.nearby.length?` · ${state.nearby.length} nearby`:""}</summary>
      <label><input type="checkbox" checked={muted} onChange={e=>{setMuted(e.target.checked);action.current({action:"mute",muted:e.target.checked});}}/>Mute play invitations</label>
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
  </aside>;
}
