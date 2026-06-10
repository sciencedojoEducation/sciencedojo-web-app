"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CheckSquare, ScrollText } from "lucide-react";

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  title: string;
  type: "gdpr" | "terms";
}

export default function ComplianceModal({ isOpen, onClose, onAccept, title, type }: ComplianceModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  const gdprContent = (
    <div className="space-y-6 text-navy/70 font-medium leading-relaxed">
      <p>ScienceDojo collects and processes your personal data to manage your tutor application, verify your identity, and ensure platform safety.</p>
      
      <div className="space-y-2">
        <p className="font-black text-navy uppercase text-[10px] tracking-widest">This includes:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Personal information (name, contact details)</li>
          <li>Uploaded documents (ID, certificates, background checks)</li>
          <li>Application and evaluation data</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-black text-navy uppercase text-[10px] tracking-widest">Your data is:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Stored securely</li>
          <li>Used only for recruitment and platform operations</li>
          <li>Not shared unless required by law</li>
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-black text-navy uppercase text-[10px] tracking-widest">You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Access your data</li>
          <li>Request correction or deletion</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </div>
    </div>
  );

  const termsContent = (
    <div className="space-y-8 text-navy/70 font-medium leading-relaxed pb-10">
      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Professional Conduct</h4>
        <p className="text-sm">Tutors must maintain professionalism, respect, and integrity at all times within the ScienceDojo platform.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Teaching Standards</h4>
        <p className="text-sm">Deliver clear, structured, and student-focused lessons that align with ScienceDojo teaching standards.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Communication</h4>
        <p className="text-sm">Maintain clear, timely, and supportive communication with students and administration.</p>
      </section>

      <section className="space-y-2 border-l-4 border-red-500/20 pl-4 py-1">
        <h4 className="font-black text-red-600 text-sm uppercase tracking-tight">Safety & Ethics</h4>
        <p className="text-sm italic font-bold">Any misconduct or breach of safety policies may result in platform removal.</p>
      </section>

      <section className="space-y-3 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
        <h4 className="font-black text-blue-600 text-[10px] uppercase tracking-[0.2em]">Platform Engagement Policy</h4>
        <p className="text-xs leading-relaxed">ScienceDojo operates as a trusted learning environment. To maintain fairness and platform integrity, all lessons, communication, and transactions must take place within the ScienceDojo platform.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Off-Platform Communication & Solicitation</h4>
        <p className="text-sm">Tutors must not share personal contact details (phone numbers, emails, social media) for the purpose of conducting lessons outside the platform. Any attempt to move sessions, payments, or communication outside ScienceDojo is strictly prohibited.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Client Relationship Protection</h4>
        <p className="text-sm">Tutors agree not to independently engage, solicit, or accept private arrangements with students or families introduced through ScienceDojo.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Payment & Session Policy</h4>
        <p className="text-sm">All payments and scheduled sessions must be conducted exclusively through ScienceDojo. This guarantees transparency, security, and proper support.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Platform Integrity</h4>
        <p className="text-sm">Tutors must not bypass the platform or misrepresent academic qualifications, experience, or credentials.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Compliance</h4>
        <p className="text-sm">Tutors agree to provide accurate information and valid documentation for verification.</p>
      </section>

      <section className="space-y-2 border-t border-navy/5 pt-6">
        <h4 className="font-black text-red-600 text-[10px] uppercase tracking-[0.2em]">Policy Violation</h4>
        <p className="text-xs italic">Any violation of platform integrity policies may result in immediate suspension and permanent removal. ScienceDojo reserves the right to take appropriate action to protect its community.</p>
      </section>

      <section className="space-y-2">
        <h4 className="font-black text-navy text-sm uppercase tracking-tight">Community Values</h4>
        <p className="text-sm">At ScienceDojo, we believe in building a respectful, supportive, and growth-focused learning environment. Tutors are expected to act in a way that reflects these values.</p>
      </section>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-10 border-b border-navy/5 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    {type === "gdpr" ? <ShieldCheck size={24} /> : <ScrollText size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-navy tracking-tight">{title}</h2>
                    <p className="text-[10px] font-black text-navy/20 uppercase tracking-[0.2em]">Agreement v1.0</p>
                  </div>
               </div>
               <button 
                  onClick={onClose}
                  className="p-3 hover:bg-navy/5 rounded-full text-navy/20 hover:text-navy transition-all"
               >
                  <X size={24} />
               </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
               {type === "gdpr" ? gdprContent : termsContent}
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-navy/5 bg-white shrink-0 space-y-6">
               <label className="flex items-start gap-4 cursor-pointer group">
                  <div 
                    onClick={() => setIsChecked(!isChecked)}
                    className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isChecked ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20" : "border-navy/10 bg-navy/5 group-hover:border-navy/20"
                    }`}
                  >
                     {isChecked && <CheckSquare size={16} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-bold text-navy/60 group-hover:text-navy transition-colors">
                    I have read and agree to the {type === "gdpr" ? "GDPR Data Processing terms" : "ScienceDojo Tutor Agreement"}
                  </span>
               </label>

               <button
                  onClick={() => {
                    if (isChecked) {
                      onAccept();
                      onClose();
                    }
                  }}
                  disabled={!isChecked}
                  className={`w-full py-6 rounded-[2rem] font-black text-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                    isChecked 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-500" 
                      : "bg-blue-50 text-blue-200 cursor-not-allowed opacity-60"
                  }`}
               >
                  Accept & Continue
                  <ShieldCheck size={20} />
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
