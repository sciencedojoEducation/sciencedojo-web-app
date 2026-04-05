"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Maximize2, Minimize2, SkipForward, Clock, BookOpen } from "lucide-react";

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

  // Exam mode specific
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(30);

  const containerRef = useRef<HTMLDivElement>(null);

  const compliments = [
    "Incredible focus!", "You're crushing it!", "Masterful session!", 
    "One step closer to greatness!", "Outstanding discipline!", "Brain gains!"
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync state if user exits fullscreen with ESC key
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const changeMode = (newMode: "pomodoro" | "exam") => {
    setMode(newMode);
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
          bg: "bg-emerald-950",
          ring: "ring-emerald-500/30",
          text: "text-emerald-400",
          btn: "bg-emerald-500 hover:bg-emerald-400 text-emerald-950",
          panelBg: "bg-emerald-900/40",
        };
      }
      if (pomoState === "longBreak") {
        return {
          bg: "bg-cyan-950",
          ring: "ring-cyan-500/30",
          text: "text-cyan-400",
          btn: "bg-cyan-500 hover:bg-cyan-400 text-cyan-950",
          panelBg: "bg-cyan-900/40",
        };
      }
    }
    if (mode === "exam") {
      return {
        bg: "bg-indigo-950",
        ring: "ring-indigo-500/30",
        text: "text-indigo-400",
        btn: "bg-indigo-500 hover:bg-indigo-400 text-indigo-950",
        panelBg: "bg-indigo-900/40",
      };
    }
    // Default Pomodoro Focus
    return {
      bg: "bg-rose-950",
      ring: "ring-rose-500/30",
      text: "text-rose-400",
      btn: "bg-rose-500 hover:bg-rose-400 text-rose-950",
      panelBg: "bg-rose-900/40",
    };
  };

  const theme = getThemeVars();

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen fixed inset-0 z-50' : 'h-[80vh] min-h-[600px] rounded-[3rem] overflow-hidden'} transition-colors duration-1000 ${theme.bg} flex items-center justify-center font-sans tracking-tight`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/0 via-black/40 to-black/80 pointer-events-none" />

      {/* Mode Switcher */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
        <button
          onClick={() => changeMode("pomodoro")}
          className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === "pomodoro" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => changeMode("exam")}
          className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === "exam" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
        >
          Exam Mode
        </button>
      </div>

      {/* Fullscreen Toggle */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-8 right-8 z-10 p-3 rounded-full bg-black/40 border border-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
      >
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Status Indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode + pomoState}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 mb-8 text-white/50"
          >
            {mode === "exam" ? (
              <><BookOpen size={18} /> <span className="font-bold tracking-widest uppercase text-sm">Exam Simulation</span></>
            ) : pomoState === "focus" ? (
              <><Clock size={18} /> <span className="font-bold tracking-widest uppercase text-sm">Deep Focus • Round {round}/4</span></>
            ) : pomoState === "longBreak" ? (
              <><Clock size={18} /> <span className="font-bold tracking-widest uppercase text-sm">Long Recovery • Well Earned</span></>
            ) : (
              <><Clock size={18} /> <span className="font-bold tracking-widest uppercase text-sm">Short Rest • Recharge</span></>
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
              className="absolute z-20 top-[60%] bg-white text-rose-600 px-6 py-3 rounded-full shadow-2xl font-black uppercase tracking-widest text-sm"
            >
              {compliment}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer Ring */}
        <div className={`relative flex items-center justify-center w-80 h-80 rounded-full ring-4 ${theme.ring} bg-black/20 backdrop-blur-xl shadow-2xl mb-12`}>
           <div className={`text-7xl font-black tabular-nums tracking-tighter ${theme.text} drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]`}>
             {formatTime(mode === "pomodoro" ? pomoTimeLeft : examTimeLeft)}
           </div>
           
           {/* Decorative Outer Glow */}
           <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 ${theme.bg}`} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
           <button 
             onClick={resetTimer}
             className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"
           >
             <RotateCcw size={24} />
           </button>
           
           <button 
             onClick={toggleTimer}
             className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${theme.btn}`}
           >
             {(mode === "pomodoro" ? pomoIsActive : examIsActive) ? <Pause size={40} className="fill-current" /> : <Play size={40} className="fill-current ml-2" />}
           </button>

           {mode === "pomodoro" && (pomoState === "shortBreak" || pomoState === "longBreak") ? (
              <button 
                onClick={skipBreak}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <SkipForward size={24} />
              </button>
           ) : (
              <div className="w-14 h-14" /> /* Spacer to keep Play button centered */
           )}
        </div>

        {/* Exam Mode Settings */}
        {mode === "exam" && !examIsActive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-12 p-6 rounded-3xl ${theme.panelBg} border border-white/10 flex gap-4 items-center backdrop-blur-md`}
          >
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">Hours</label>
              <input 
                type="number" 
                value={customHours} 
                onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))} 
                className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-2 w-20 font-bold outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-200/50 uppercase tracking-widest">Minutes</label>
              <input 
                type="number" 
                value={customMinutes} 
                onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))} 
                className="bg-black/40 text-white border border-white/10 rounded-xl px-4 py-2 w-20 font-bold outline-none focus:border-indigo-500/50"
              />
            </div>
            <button 
              onClick={applyCustomExamTime}
              className="mt-5 px-6 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all"
            >
              Set Time
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
