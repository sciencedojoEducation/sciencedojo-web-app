"use client";
import {useEffect, useRef, useState, type CSSProperties} from "react";
import {GAME_TABLES, type GameKind, type GameSnapshot} from "@/lib/campus/board-games";
import "./board-games.css";
import WortQuest, {type WortMode} from "./WortQuest";

const colours = ["#167c79", "#b95e47", "#7461a2", "#8c710e"];
const symbols = ["A", "B", "C", "D"];
function Picture({url,name,gameHeaders}: {url:string | null;name:string;gameHeaders:()=>Record<string,string>}) {
  const [source,setSource]=useState<string|null>(null);
  useEffect(()=>{if(!url)return;const controller=new AbortController();let objectUrl:string|undefined;
    const load=()=>fetch(url,{cache:"no-store",headers:gameHeaders(),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])});
    void load().then(async response=>{
      if(response.status===403){await new Promise(resolve=>setTimeout(resolve,250));if(controller.signal.aborted)return;response=await load();}
      if(!response.ok)throw new Error("Picture unavailable");const blob=await response.blob();if(controller.signal.aborted)return;
      objectUrl=URL.createObjectURL(blob);setSource(objectUrl);
    }).catch(()=>{});
    return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[url,gameHeaders]);
  return <span className="game-picture">{source ?
    // Private authorized fetches avoid putting the connection credential in image URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={source} alt={`${name}'s profile picture`} onError={() => setSource(null)}/> :
    <span aria-label={`${name}, initials`}>{name.trim().slice(0,2).toUpperCase()}</span>}</span>;
}
export default function BoardGames({initialTable,connected,onClose,onLeaveSchool,onSafety,gameHeaders}: {
  gameHeaders:()=>Record<string,string>;initialTable:GameKind; connected:boolean; onClose:() => void; onLeaveSchool:() => void; onSafety:() => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const table = initialTable;
  const [wortMode,setWortMode]=useState<WortMode>("study");
  const [game,setGame] = useState<GameSnapshot | null>(null);
  const [profile,setProfile] = useState<{username:string;photo:boolean} | null>(null);
  const [username,setUsername] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [reason,setReason] = useState("harassment");
  const inflight = useRef<AbortController | null>(null), requestAction = useRef<(body:object) => Promise<void>>(async () => {});
  const generation = useRef(0);
  const nextWrite = useRef(0);
  const leavingSchool = useRef(false);
  const memberRef=useRef<string|null>(null);memberRef.current=game?.self??null;
  useEffect(()=>()=>{if(leavingSchool.current)return;void fetch(`/api/campus/games?table=${initialTable}`,{method:"POST",headers:{...gameHeaders(),"Content-Type":"application/json"},
    body:JSON.stringify({action:"leave",member:memberRef.current}),credentials:"same-origin",keepalive:true,signal:AbortSignal.timeout(3000)}).catch(()=>{});},[initialTable,gameHeaders]);
  const online = useRef(connected); online.current = connected;
  useEffect(() => {const el=dialog.current; el?.showModal(); return () => el?.close();},[]);
  useEffect(() => {
    const attempt = ++generation.current;
    let queued:object|undefined;
    let stopped = false, timer: ReturnType<typeof setTimeout>;
    const endpoint = `/api/campus/games?table=${table}`;
    async function request(body?: object) {
      if (stopped || leavingSchool.current || !online.current) return;
      if (inflight.current) {if(body){queued=body;setBusy(true);}return;}
      const controller = new AbortController(); inflight.current = controller;
      const deadline = setTimeout(() => controller.abort(),8000);
      if (body) setBusy(true);
      try {
        // A completed box grants an immediate extra turn. Briefly schedule that
        // next click rather than rejecting a quick legal move at the server limit.
        if(body){
          const wait=Math.max(0,nextWrite.current-Date.now());
          if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
          if(stopped||controller.signal.aborted)return;
        }
        const fetchGame=()=>fetch(endpoint,{method:body ? "POST" : "GET",cache:"no-store",credentials:"same-origin",
          headers:{...gameHeaders(),...(body ? {"Content-Type":"application/json"} : {})},
          body:body ? JSON.stringify(body) : undefined,signal:controller.signal});
        let response=await fetchGame();
        // A duration handover rotates the private key atomically. Give its ready
        // handshake one short, bounded retry before treating a 403 as final.
        if(response.status===403&&online.current){await new Promise(resolve=>setTimeout(resolve,250));if(stopped)return;response=await fetchGame();}
        const result = await response.json();
        if (stopped || attempt !== generation.current) return;
        if (!response.ok) {
          if (response.status === 403 || response.status === 503) {setGame(null);if(response.status===403)onClose();}
          setMessage(result.error || "Unable to update this game.");
          return;
        }
        setGame(result.game);
        if(table==="wortquest"&&result.game?.self)setWortMode("friends");
        if (result.profile) {setProfile(result.profile); setUsername(previous => previous || result.profile.username);}
        if(body && "action" in body && body.action==="block")onSafety();
        if (body) setMessage("action" in body && body.action === "report" ? "Report saved for the session moderator." : "");
      } catch {
        if (!stopped && attempt === generation.current) {setGame(null);setMessage("Connection interrupted. Reopen the table to try again. Inactive seats are released after 45 seconds.");}
      } finally {
        if(body)nextWrite.current=Date.now()+180;
        clearTimeout(deadline);
        if (inflight.current === controller) inflight.current = null;
        if (!stopped&&!leavingSchool.current) {setBusy(false); if(queued){const next=queued;queued=undefined;void request(next);}}
      }
    }
    requestAction.current = request;
    const poll = async () => {
      if (stopped) return;
      if (!document.hidden) await request();
      if (!stopped) timer = setTimeout(poll,1500);
    };
    void poll();
    return () => {stopped=true; clearTimeout(timer); inflight.current?.abort(); inflight.current=null;};
  },[table,onSafety,onClose,gameHeaders]);
  const send = (body:object) => {void requestAction.current(body);};
  const leaveSchool=async()=>{
    if(leavingSchool.current)return;
    leavingSchool.current=true;
    setBusy(true);inflight.current?.abort();
    try{await fetch(`/api/campus/games?table=${table}`,{method:"POST",headers:{...gameHeaders(),"Content-Type":"application/json"},body:JSON.stringify({action:"leave"}),credentials:"same-origin",keepalive:true,signal:AbortSignal.timeout(3000)});}catch{/* A lost connection expires the seat. */}
    finally{onLeaveSchool();}
  };
  const current = GAME_TABLES.find(t => t.id === table)!;
  const member = game?.members.find(m => m.id === game.self);
  const state = game?.state, playing = state?.phase === "playing";
  const turn = state && game?.members.find(m => m.id === state.players[state.turn]);
  const myTurn = playing && state?.players[state.turn] === game?.self;
  const stamp = {round:game?.round,version:game?.version};
  const move = (move:number) => send({action:"move",...stamp,move});
  const canPlay = !!myTurn && !busy && connected;
  const status = !connected ? "School connection lost. Re-enter the school before playing." :
    !game ? "Loading the table…" : !member ? `${game.count} / ${current.capacity} seats occupied` :
    !state ? "Get ready, then start when everyone has joined." :
    playing ? `${turn?.username ?? "Player"}'s turn${myTurn ? " · your turn" : ""}` :
    state.phase === "abandoned" ? "Round ended because a player left or became unavailable." :
    state.winners.length === 0 ? "Draw — well played!" :
    `${state.winners.map(i => game.members.find(m => m.id === state.players[i])?.username ?? "Player").join(" & ")}${state.winners.length > 1 ? " tie" : " wins"}!`;
  const roster=game&&member?<div className="game-roster" aria-label="Players at this table">{game.members.map((m,i) => <article key={m.id} className={turn?.id === m.id && playing ? "is-turn" : ""} style={{"--player-colour":colours[i]} as CSSProperties}>
        <Picture gameHeaders={gameHeaders} name={m.username} url={m.photo ? `/api/campus/games/photo?table=${table}&player=${m.id}` : null}/>
        <div><strong>{m.username}{m.id === game.self ? " · you" : ""}</strong><span>{table==="wortquest" ? game.quiz ? `${game.quiz.scores[i]} / 100 points` : m.ready ? "Level confirmed" : "Not ready" : <>Piece {symbols[i]}{playing ? turn?.id === m.id ? " · playing" : " · waiting" : m.ready ? " · ready" : " · not ready"}</>}</span>
        {state?.kind === "boxes" && <span>{state.scores[state.players.indexOf(m.id)] ?? 0} boxes</span>}</div>
      </article>)}</div>:null;
  return <dialog ref={dialog} className="campus-games" aria-label="Games Lounge" onCancel={event => {event.preventDefault();onClose();}}>
    <header><div><p className="campus-eyebrow">SKY COMMONS · LEVEL 2</p><h2>Games Lounge</h2></div><button onClick={onClose}>Return to school →</button></header>
    <nav aria-label="Board games">{GAME_TABLES.map(t => <button key={t.id} aria-pressed={table === t.id}
      disabled={t.id !== table}>{t.name}<small>{t.id === "four" ? "2 players" : t.id === "wortquest" ? "Cards · solo or 2–4 friends" : "2–4 players"}</small></button>)}</nav>
    <p className="game-live" role="status" aria-live="polite">{table === "wortquest" ? "WortQuest · German vocabulary" : status}</p>
    {table==="wortquest"&&roster}
    {table==="wortquest"&&game&&<WortQuest game={game} mode={wortMode} onMode={setWortMode} busy={busy} connected={connected} send={send}/>}
    {message && <p role="alert" className="game-message">{message}</p>}
    {!connected ? <p>Inactive game seats expire after 45 seconds. Your course work stays open.</p> :
    game && !member && (table!=="wortquest"||wortMode==="friends") ? <section className="game-join">
      <Picture gameHeaders={gameHeaders} key={`${table}-self`} name={username || "Player"} url={profile?.photo ? `/api/campus/games/photo?table=${table}&player=self` : null}/>
      <div><h3>Choose how your friends see you</h3><label>Game username<input value={username} maxLength={24} autoComplete="off" onChange={event => setUsername(event.target.value)}/></label>
      <p>Joining shares this username and your existing profile picture with the players at this table. Your campus pseudonym stays in the school.</p>
      <button disabled={busy || !username.trim() || game.count >= current.capacity} onClick={() => send({action:"join",username})}>Join {current.name}</button></div>
    </section> : member && game && <>
      {table!=="wortquest"&&roster}
      {table!=="wortquest" && !playing && <div className="game-round-actions"><button disabled={busy} aria-pressed={member.ready} onClick={() => send({action:"ready",...stamp,ready:!member.ready})}>{member.ready ? "Not ready" : state ? "Ready for rematch" : "Ready to play"}</button>
        <button disabled={busy || game.members.length < 2 || !game.members.every(m => m.ready)} onClick={() => send({action:"start",...stamp})}>{state ? "Start rematch" : "Start game"}</button><span>Everyone must be ready.</span></div>}
      {state && <div className="game-board-wrap">
        {state.kind === "four" ? <div className="game-four" aria-label="Four in a Row board">
          <div className="game-four-drops">{Array.from({length:7},(_,col) => <button key={col} disabled={!canPlay || state.board[col] !== -1} aria-label={`Drop in column ${col+1}`} onClick={() => move(col)}>↓ {col+1}</button>)}</div>
          <div className="game-four-cells">{state.board.map((owner,i) => <span key={i} aria-label={`Row ${Math.floor(i/7)+1}, column ${i%7+1}: ${owner < 0 ? "empty" : `piece ${symbols[owner]}`}`} style={{background:owner < 0 ? "#edf1e9" : colours[owner]}}>{owner < 0 ? "" : symbols[owner]}</span>)}</div>
        </div> : <div className="game-boxes" aria-label="Dots and Boxes board">{Array.from({length:81},(_,i) => {
          const r=Math.floor(i/9), c=i%9;
          if (r%2 === 0 && c%2 === 0) return <span className="game-dot" key={i}/>;
          if (r%2 === 1 && c%2 === 1) {
            const owner=state.boxes[(r-1)/2*4+(c-1)/2];
            return <span key={i} className="game-box" style={{color:owner < 0 ? "transparent" : colours[owner]}}>{owner < 0 ? "" : symbols[owner]}</span>;
          }
          const horizontal=r%2 === 0, edge=horizontal ? r/2*4+(c-1)/2 : 20+(r-1)/2*5+c/2, owner=state.board[edge];
          return <button key={i} className={`game-edge ${horizontal ? "horizontal" : "vertical"} ${owner >= 0 ? "drawn" : ""}`} disabled={!canPlay || owner >= 0}
            style={{"--edge-colour":owner < 0 ? "#a6b6aa" : colours[owner]} as CSSProperties}
            aria-label={`${horizontal ? "Horizontal" : "Vertical"} edge ${edge+1}${owner < 0 ? "" : `, piece ${symbols[owner]}`}`} onClick={() => move(edge)}/>;
        })}</div>}
      </div>}
      <div className="game-leave"><button disabled={busy} onClick={() => send({action:"leave"})}>Leave table</button><p>Returning to school releases your seat. Leaving during play ends the round.</p></div>
      <details className="game-safety"><summary>Report or block a player</summary><label>Report reason<select value={reason} onChange={event => setReason(event.target.value)}><option value="harassment">Harassment</option><option value="inappropriate-behaviour">Inappropriate behaviour</option><option value="technical">Technical problem</option><option value="other">Other</option></select></label>
        {game.members.filter(m => m.id !== game.self).map(m => <div key={m.id}><span>{m.username}</span><button disabled={busy} onClick={() => send({action:"report",player:m.id,reason})}>Report {m.username}</button><button disabled={busy} onClick={() => send({action:"block",player:m.id})}>Block {m.username}</button></div>)}
        <p>Contact the supervisor named in your invitation for immediate help.</p></details>
    </>}
    <details className="game-rules"><summary>How to play {current.name}</summary><p>{table==="wortquest" ? "Study word cards, then try a ten-card quiz. Correct answers earn ten points. Friend quizzes use the same level and cards for everyone; explanations and updated points appear after everyone answers. There is no speed bonus." : table === "four" ? "Take turns dropping a piece into a column. Four connected pieces horizontally, vertically or diagonally win. A full board without four is a draw." : "Take turns drawing one edge between two dots. Complete a box to claim it and play again. You can close two boxes with one edge. After all sixteen boxes are claimed, the most boxes wins; equal scores tie."}</p></details>
    <footer><span>Pictures and usernames are shared only with players at your table.</span><button className="secondary" disabled={busy} onClick={()=>void leaveSchool()}>Leave school</button></footer>
  </dialog>;
}
