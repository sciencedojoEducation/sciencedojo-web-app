"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  showLogo?: boolean;
  maxWidth?: string;
}

export default function AuthCard({ 
  children, 
  title, 
  subtitle, 
  footer, 
  showLogo = true,
  maxWidth = "max-w-[480px]"
}: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen w-full items-start justify-center overflow-x-hidden bg-[#F8FAFC] px-3 py-6 sm:px-4 sm:py-8 md:min-h-[calc(100dvh-5rem)] md:items-center md:p-6">
      {/* Premium Digital Dojo Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        
        {/* Cinematic Grain Overlay */}
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.03] pointer-events-none">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" pointerEvents="none" />
        </svg>

        {/* Dynamic Digital Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #001A3D 1px, transparent 1px), linear-gradient(to bottom, #001A3D 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem'
          }} 
        />

        {/* Floating Glowing Orbs (Wow Factor) */}
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-mint/10 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" 
        />
        
        {/* High-Fidelity SVG Vectors with Motion */}
        {/* Atom Orbital - Slow rotation */}
        <motion.svg 
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] right-[10%] w-32 h-32 text-primary/10" 
          viewBox="0 0 100 100"
        >
          <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 50 50)" />
          <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-45 50 50)" />
          <circle cx="50" cy="50" r="4" fill="currentColor" />
        </motion.svg>

        {/* Wavy Line - Floating & Pulse */}
        <motion.svg 
          animate={{ x: [0, 10, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-40 h-20 text-mint/20" 
          viewBox="0 0 100 100"
        >
           <path d="M0,50 Q12.5,25 25,50 T50,50 T75,50 T100,50" fill="none" stroke="currentColor" strokeWidth="3" />
        </motion.svg>
        
        {/* Dotted Circle - Breathing scaling */}
        <motion.svg 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-48 h-48 text-primary/10 opacity-30" 
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 12" />
        </motion.svg>

        {/* Floating Triangle */}
        <motion.svg 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[5%] w-16 h-16 text-primary/5" 
          viewBox="0 0 100 100"
        >
          <path d="M50,20 L80,80 L20,80 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        </motion.svg>

        {/* Pulse Markers */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[30%] w-4 h-4 text-mint/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </motion.div>

        {/* Living Dots */}
        <motion.div 
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[40%] w-2 h-2 bg-mint/40 rounded-full" 
        />
        <motion.div 
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] right-[30%] w-2.5 h-2.5 bg-primary/20 rounded-full" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full ${maxWidth}`}
      >
        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-7 md:rounded-[3rem] md:p-12">
          
          {showLogo && (
            <div className="mb-4 flex justify-center md:mb-8">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-2xl shadow-navy/20 ring-4 ring-white md:h-20 md:w-20"
              >
                <Image 
                  src="/images/sciencedojo-logo-brand.jpg" 
                  alt="ScienceDojo Logo" 
                  fill 
                  className="object-cover"
                />
              </motion.div>
            </div>
          )}

          <div className="mb-5 text-center md:mb-10">
            <h1 className="mb-1 text-2xl font-black tracking-tight text-navy md:mb-2 md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-navy/40 font-bold uppercase tracking-[0.2em] text-[10px]">
                {subtitle}
              </p>
            )}
          </div>

          <div className="space-y-4 md:space-y-6">
            {children}
          </div>

          {footer && (
            <div className="mt-6 border-t border-navy/5 pt-5 text-center md:mt-12 md:pt-8">
              {footer}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function RoleCard({ 
  title, 
  description, 
  onClick, 
  iconColor = "bg-primary/10", 
  arrowColor = "text-primary" 
}: { 
  title: string; 
  description: string; 
  onClick: () => void;
  iconColor?: string;
  arrowColor?: string;
}) {
  return (
    <motion.button 
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left p-6 rounded-[2rem] bg-navy/5 border-2 border-transparent hover:border-navy/10 hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between"
    >
      <div className="space-y-1">
        <h3 className="text-xl font-black text-navy">{title}</h3>
        <p className="text-sm font-medium text-navy/40">{description}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${iconColor} flex items-center justify-center transition-all group-hover:bg-navy group-hover:text-white`}>
        <ArrowRight size={20} className={arrowColor + " group-hover:text-white"} />
      </div>
    </motion.button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="relative py-3 md:py-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-navy/5"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-navy/20">
          {label}
        </span>
      </div>
    </div>
  );
}
