"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Maximize2, Minimize2, SkipForward, Clock, BookOpen } from "lucide-react";
import FocusSoundtrack from "./FocusSoundtrack";

export default function StudentTimer() {
  const [mode, setMode] = useState<"pomodoro" | "exam">("pomodoro");
  const [pomoState, setPomoState] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [round, setRound] = useState(1);
  const [compliment, setCompliment] = useState<string | null>(null);
  
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [pomoIsActive, setPomoIsActive] = useState(false);

  const [examTimeLeft, setExamTimeLeft] = useState(1 * 3600 + 30 * 60);
  const [examIsActive, setExamIsActive] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisualFullscreen, setIsVisualFullscreen] = useState(false);

  // Exam mode specific
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(30);

  const containerRef = useRef<HTMLDivElement>(null);

  const compliments = [
    "Focused session complete.",
    "Good work. Take the next step calmly.",
    "Strong concentration.",
    "Progress through steady focus.",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomoIsActive && pomoTimeLeft > 0) {
      interval = setInterval(() => {
        setPomoTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (pomoTimeLeft === 0 && pomoIsActive) {
      handlePomoComplete();
    }
    return () => clearInterval(interval);
  }, [pomoIsActive, pomoTimeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examIsActive && examTimeLeft > 0) {
      interval = setInterval(() => {
        setExamTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (examTimeLeft === 0 && examIsActive) {
      handleExamComplete();
    }
    return () => clearInterval(interval);
  }, [examIsActive, examTimeLeft]);

  const handlePomoComplete = () => {
    setPomoIsActive(false);
    playAlarm("pomodoro");
    
    if (pomoState === "focus") {
      // Show gamified compliment
      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
      setCompliment(randomCompliment);
      setTimeout(() => setCompliment(null), 4000);

      if (round >= 4) {
        setPomoState("longBreak");
        setPomoTimeLeft(15 * 60);
        setRound(1); // Reset round count for the next cycle
      } else {
        setPomoState("shortBreak");
        setPomoTimeLeft(5 * 60);
      }
    } else {
      // Finishing a break means we return to focus, increase round count
      setRound((prev) => (pomoState === "shortBreak" ? prev + 1 : 1));
      setPomoState("focus");
      setPomoTimeLeft(25 * 60);
    }
  };

  const handleExamComplete = () => {
    setExamIsActive(false);
    playAlarm("exam");
  };

  const playAlarm = (type: "pomodoro" | "exam") => {
    // Simple Web Audio API beep for alarm
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      // Slightly higher pitch for focus completion vs break completion
      osc.frequency.setValueAtTime(pomoState === "focus" ? 1046.50 : 880, ctx.currentTime); // C6 vs A5
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gainNode);
      if (type === "pomodoro" && pomoState === "focus") {
        // Extra little double-beep rhythm
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.15); // E6
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        setTimeout(() => osc.stop(), 500);
      } else {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        setTimeout(() => osc.stop(), 500);
      }
      gainNode.connect(ctx.destination);
      osc.start();
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const toggleTimer = () => {
    if (mode === "pomodoro") setPomoIsActive(!pomoIsActive);
    else setExamIsActive(!examIsActive);
  };

  const resetTimer = () => {
    if (mode === "pomodoro") {
      setPomoIsActive(false);
      if (pomoState === "focus") setPomoTimeLeft(25 * 60);
      else if (pomoState === "shortBreak") setPomoTimeLeft(5 * 60);
      else setPomoTimeLeft(15 * 60);
    } else {
      setExamIsActive(false);
      setExamTimeLeft(customHours * 3600 + customMinutes * 60);
    }
  };

  const skipBreak = () => {
    if (mode === "pomodoro" && (pomoState === "shortBreak" || pomoState === "longBreak")) {
      setPomoIsActive(false);
      setRound((prev) => (pomoState === "shortBreak" ? prev + 1 : 1));
      setPomoState("focus");
      setPomoTimeLeft(25 * 60);
    }
  };

  const toggleFullscreen = async () => {
    const element = containerRef.current;

    if (document.fullscreenElement || isVisualFullscreen) {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch((err) => console.log(err));
      }
      setIsVisualFullscreen(false);
      setIsFullscreen(false);
      return;
    }

    try {
      if (element?.requestFullscreen) {
        await element.requestFullscreen();
        setIsFullscreen(true);
      } else {
        setIsVisualFullscreen(true);
        setIsFullscreen(true);
      }
    } catch (err) {
      console.log(err);
      setIsVisualFullscreen(true);
      setIsFullscreen(true);
    }
  };

  // Sync state if user exits fullscreen with ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const nativeFullscreenActive = !!document.fullscreenElement;
      setIsFullscreen(nativeFullscreenActive || isVisualFullscreen);
      if (nativeFullscreenActive) setIsVisualFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isVisualFullscreen]);

  const changeMode = (newMode: "pomodoro" | "exam") => {
    setMode(newMode);
    setCompliment(null);
    // Don't stop or reset the timers when changing views!
  };

  const applyCustomExamTime = () => {
    setExamIsActive(false);
    setExamTimeLeft(customHours * 3600 + customMinutes * 60);
  };

  // Formatting Time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Background and glow colors based on state
  const getThemeVars = () => {
    if (mode === "pomodoro") {
      if (pomoState === "shortBreak") {
        return {
          bg: "bg-[linear-gradient(135deg,#06392f,#0f5c50)]",
          ring: "ring-emerald-300/20",
          text: "text-emerald-100",
          btn: "bg-emerald-100 hover:bg-white text-emerald-950",
          panelBg: "bg-emerald-950/30",
        };
      }
      if (pomoState === "longBreak") {
        return {
          bg: "bg-[linear-gradient(135deg,#062f45,#0d4d64)]",
          ring: "ring-cyan-200/20",
          text: "text-cyan-100",
          btn: "bg-cyan-100 hover:bg-white text-cyan-950",
          panelBg: "bg-cyan-950/30",
        };
      }
    }
    if (mode === "exam") {
      return {
        bg: "bg-[linear-gradient(135deg,#071a35,#102d62)]",
        ring: "ring-indigo-200/20",
        text: "text-indigo-100",
        btn: "bg-indigo-100 hover:bg-white text-indigo-950",
        panelBg: "bg-indigo-950/30",
      };
    }
    // Default Pomodoro Focus
    return {
      bg: "bg-[linear-gradient(135deg,#06172f,#0a3d68)]",
      ring: "ring-cyan-200/20",
      text: "text-white",
      btn: "bg-white hover:bg-cyan-50 text-navy",
      panelBg: "bg-slate-950/30",
    };
  };

  const theme = getThemeVars();

  return (
    <div 
      ref={containerRef}
      className={`relative flex w-full items-center justify-center overflow-hidden font-sans tracking-tight transition-colors duration-1000 ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'min-h-[560px] rounded-[2rem] md:min-h-[640px] md:rounded-[3rem]'} ${theme.bg}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.22))]" />

      {/* Mode Switcher */}
      <div className="absolute left-1/2 top-4 z-40 flex -translate-x-1/2 rounded-full border border-white/10 bg-black/20 p-1 shadow-lg backdrop-blur-md md:top-8">
        <button
          type="button"
          onClick={() => changeMode("pomodoro")}
          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all md:px-6 md:text-xs ${mode === "pomodoro" ? "bg-white/12 text-white" : "text-white/45 hover:text-white/70"}`}
        >
          Focus
        </button>
        <button
          type="button"
          onClick={() => changeMode("exam")}
          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all md:px-6 md:text-xs ${mode === "exam" ? "bg-white/12 text-white" : "text-white/45 hover:text-white/70"}`}
        >
          Exam
        </button>
      </div>

      {/* Fullscreen Toggle */}
      <button 
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-4 top-4 z-40 rounded-full border border-white/10 bg-black/20 p-3 text-white/55 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white md:right-8 md:top-8"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Main Content */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center px-4 pb-6 pt-20 md:pb-10 md:pt-28">
        
        {/* Status Indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode + pomoState}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-6 flex items-center gap-2 text-white/55 md:mb-8"
          >
            {mode === "exam" ? (
              <><BookOpen size={18} /> <span className="text-xs font-bold uppercase tracking-widest md:text-sm">Exam timing environment</span></>
            ) : pomoState === "focus" ? (
              <><Clock size={18} /> <span className="text-xs font-bold uppercase tracking-widest md:text-sm">Focused study • Round {round}/4</span></>
            ) : pomoState === "longBreak" ? (
              <><Clock size={18} /> <span className="text-xs font-bold uppercase tracking-widest md:text-sm">Long break • Reset calmly</span></>
            ) : (
              <><Clock size={18} /> <span className="text-xs font-bold uppercase tracking-widest md:text-sm">Short break • Breathe</span></>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gamified Compliment Overlay */}
        <AnimatePresence>
          {compliment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute top-[58%] z-20 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-navy shadow-xl md:text-sm"
            >
              {compliment}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer Ring */}
        <div className={`relative mb-8 flex h-64 w-64 items-center justify-center rounded-full bg-black/12 shadow-xl ring-2 backdrop-blur-xl ${theme.ring} md:mb-12 md:h-80 md:w-80 md:ring-4`}>
           <div className={`text-5xl font-black tabular-nums tracking-tighter ${theme.text} drop-shadow-[0_0_24px_rgba(255,255,255,0.08)] md:text-7xl`}>
             {formatTime(mode === "pomodoro" ? pomoTimeLeft : examTimeLeft)}
           </div>
           
           {/* Decorative Outer Glow */}
           <div className={`pointer-events-none absolute inset-0 rounded-full blur-3xl opacity-20 ${theme.bg}`} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 md:gap-6">
           <button 
             type="button"
             onClick={resetTimer}
             className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/55 transition-all hover:bg-white/10 hover:text-white active:scale-95 md:h-14 md:w-14"
           >
             <RotateCcw size={24} />
           </button>
           
           <button 
             type="button"
             onClick={toggleTimer}
             className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] shadow-lg transition-all active:scale-95 md:h-24 md:w-24 md:rounded-3xl md:shadow-xl ${theme.btn}`}
           >
             {(mode === "pomodoro" ? pomoIsActive : examIsActive) ? <Pause size={40} className="fill-current" /> : <Play size={40} className="fill-current ml-2" />}
           </button>

           {mode === "pomodoro" && (pomoState === "shortBreak" || pomoState === "longBreak") ? (
              <button 
                type="button"
                onClick={skipBreak}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/55 transition-all hover:bg-white/10 hover:text-white active:scale-95 md:h-14 md:w-14"
              >
                <SkipForward size={24} />
              </button>
           ) : (
              <div className="h-12 w-12 md:h-14 md:w-14" /> /* Spacer to keep Play button centered */
           )}
        </div>

        {mode === "pomodoro" && <FocusSoundtrack isFullscreen={isFullscreen} />}

        {/* Exam Mode Settings */}
        {mode === "exam" && !examIsActive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 flex flex-wrap items-end justify-center gap-3 rounded-3xl border border-white/10 p-4 backdrop-blur-md md:mt-12 md:p-6 ${theme.panelBg}`}
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">Hours</label>
              <input 
                type="number" 
                value={customHours} 
                onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))} 
                className="w-20 rounded-xl border border-white/10 bg-black/30 px-4 py-2 font-bold text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">Minutes</label>
              <input 
                type="number" 
                value={customMinutes} 
                onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))} 
                className="w-20 rounded-xl border border-white/10 bg-black/30 px-4 py-2 font-bold text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <button 
              type="button"
              onClick={applyCustomExamTime}
              className="min-h-10 rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/20"
            >
              Set Time
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
