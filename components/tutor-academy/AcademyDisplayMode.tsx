"use client";

import {useEffect,useSyncExternalStore} from 'react';
import "./academy-display-mode.css";
import {Moon,Sun} from 'lucide-react';
const key='academy-display-mode';
const event='academy-display-mode-change';
let preference:'light'|'dark'|undefined;
function snapshot(){
 if(typeof window==='undefined')return false;
 let stored=preference;
 if(!stored)try{const value=window.localStorage.getItem(key);if(value==='light'||value==='dark')stored=value;}catch{}
 return stored ? stored==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function subscribe(callback:()=>void){
 const media=window.matchMedia('(prefers-color-scheme: dark)');
 const storage=()=>{preference=undefined;callback();};
 window.addEventListener(event,callback);window.addEventListener('storage',storage);media.addEventListener('change',callback);
 return ()=>{window.removeEventListener(event,callback);window.removeEventListener('storage',storage);media.removeEventListener('change',callback);};
}
export default function AcademyDisplayMode(){
 const dark=useSyncExternalStore(subscribe,snapshot,()=>false);
 useEffect(()=>{document.documentElement.dataset.academyMode=dark?'dark':'light';return ()=>{delete document.documentElement.dataset.academyMode;};},[dark]);
 const label=dark?'Switch to light mode · Heller Modus':'Switch to dark mode · Dunkler Modus';
 return <button type="button" title={label} aria-label={label} aria-pressed={dark}
   onClick={()=>{preference=dark?'light':'dark';try{window.localStorage.setItem(key,preference);}catch{}window.dispatchEvent(new Event(event));}}
   className="fixed top-[calc(50%-3.75rem)] z-40 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#B8CADA] bg-white text-[#344B60] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
   style={{right:'max(0.75rem, env(safe-area-inset-right))'}}>
   {dark?<Sun size={22} aria-hidden="true"/>:<Moon size={22} aria-hidden="true"/>}
 </button>;
}
