"use client";

import { useState } from "react";
import { Tutor } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

interface BookingWizardProps {
  tutor: Tutor;
}

export default function BookingWizard({ tutor }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState({ name: "", goals: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          tutorName: tutor.name,
          hourlyRate: tutor.hourlyRate,
          time: selectedTime,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.assign(data.url);
      } else {
        // Fallback or display error natively if using dummy keys
        alert(data.error || "Please set up your Stripe API keys in .env.local");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-3xl p-10 shadow-sm border border-secondary/10 flex flex-col items-center text-center">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
         </div>
         <h2 className="text-3xl font-bold text-secondary mb-4">Booking Confirmed!</h2>
         <p className="text-lg text-secondary/70 mb-8 max-w-md">
            You're all set! A calendar invite with the Zoom meeting link has been sent to your email.
         </p>
         
         <div className="p-6 bg-surface rounded-2xl border border-secondary/10 w-full max-w-sm mb-8">
            <h3 className="font-bold text-secondary mb-2">Session Details</h3>
            <div className="flex justify-between text-sm mb-1 text-secondary/80">
              <span>Tutor:</span> <span className="font-medium text-secondary">{tutor.name}</span>
            </div>
            <div className="flex justify-between text-sm text-secondary/80">
              <span>Time:</span> <span className="font-medium text-secondary">{selectedTime}</span>
            </div>
         </div>

         <Link 
            href="/"
            className="px-8 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-colors"
         >
            Back to Dashboard
         </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-secondary/10 overflow-hidden flex flex-col md:flex-row">
       {/* Sidebar Summary */}
       <div className="w-full md:w-1/3 bg-surface p-8 border-b md:border-b-0 md:border-r border-secondary/10">
          <h3 className="font-bold text-secondary mb-6 text-xl">Booking Summary</h3>
          <div className="flex items-center gap-4 mb-6">
             <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <Image src={tutor.imageUrl} alt={tutor.name} fill className="object-cover"/>
             </div>
             <div>
                <h4 className="font-bold text-secondary">{tutor.name}</h4>
                <p className="text-xs font-semibold text-primary">{tutor.subject}</p>
             </div>
          </div>
          
          <div className="space-y-4 text-sm text-secondary/80 pt-6 border-t border-secondary/10 mb-6">
             <div className="flex justify-between">
                <span>Rate</span>
                <span className="font-medium text-secondary">${tutor.hourlyRate}/hr</span>
             </div>
             <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium text-secondary">60 Mins</span>
             </div>
             {selectedTime && (
                <div className="flex justify-between items-center text-primary font-bold">
                   <span>Selected Time</span>
                   <span>{selectedTime}</span>
                </div>
             )}
          </div>

          {step === 3 && (
            <div className="p-4 bg-primary/10 rounded-xl">
               <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>${tutor.hourlyRate}</span>
               </div>
            </div>
          )}
       </div>

       {/* Form Steps */}
       <div className="w-full md:w-2/3 p-8">
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-8 relative">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-secondary/10 -z-10 -translate-y-1/2 rounded-full"></div>
              {[1, 2, 3].map((num) => (
                 <div 
                   key={num} 
                   className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm ${
                     step >= num ? 'bg-primary text-white' : 'bg-surface text-secondary/40 border border-secondary/10'
                   }`}
                 >
                   {num}
                 </div>
              ))}
          </div>

          {/* Render Step Content */}
          <div className="min-h-[300px]">
             {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <h2 className="text-2xl font-bold text-secondary mb-6">Select a Time</h2>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {["Tomorrow, 10:00 AM", "Tomorrow, 1:00 PM", "Tomorrow, 4:00 PM", "Monday, 9:00 AM", "Monday, 2:00 PM", "Tuesday, 11:00 AM"].map((time) => (
                         <button
                           key={time}
                           onClick={() => setSelectedTime(time)}
                           className={`p-4 rounded-xl text-center text-sm font-medium transition-all ${
                             selectedTime === time 
                               ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105' 
                               : 'bg-surface border border-secondary/10 text-secondary hover:border-primary/50'
                           }`}
                         >
                           {time}
                         </button>
                      ))}
                   </div>
                </div>
             )}

             {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <h2 className="text-2xl font-bold text-secondary mb-6">Student Details</h2>
                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-secondary mb-1">Student Name</label>
                         <input 
                           type="text" 
                           placeholder="John Doe"
                           className="w-full p-4 bg-surface rounded-xl border border-secondary/10 text-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                           value={studentDetails.name}
                           onChange={(e) => setStudentDetails({...studentDetails, name: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-secondary mb-1">What do you want to achieve?</label>
                         <textarea 
                           placeholder="I need help preparing for my upcoming calculus exam..."
                           rows={4}
                           className="w-full p-4 bg-surface rounded-xl border border-secondary/10 text-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                           value={studentDetails.goals}
                           onChange={(e) => setStudentDetails({...studentDetails, goals: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
             )}

             {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                   <h2 className="text-2xl font-bold text-secondary mb-6">Payment Preview</h2>
                   <p className="text-secondary/70 mb-8">
                     You are about to book {tutor.name} for a 60-minute session. A hold will be placed on your card, but you won't be charged until the session is complete. 
                   </p>

                   {/* Mock Stripe Form */}
                   <div className="p-6 border border-secondary/10 rounded-2xl bg-surface mb-6">
                      <div className="flex justify-between items-center mb-4">
                         <span className="font-bold text-secondary">Credit Card</span>
                         <div className="flex gap-1">
                            <div className="w-8 h-5 bg-blue-100 rounded-sm"></div>
                            <div className="w-8 h-5 bg-orange-100 rounded-sm"></div>
                         </div>
                      </div>
                      <input type="text" placeholder="Card Number" className="w-full p-3 bg-white border border-secondary/10 rounded-lg mb-3 outline-none" disabled />
                      <div className="grid grid-cols-2 gap-3">
                         <input type="text" placeholder="MM/YY" className="w-full p-3 bg-white border border-secondary/10 rounded-lg outline-none" disabled />
                         <input type="text" placeholder="CVC" className="w-full p-3 bg-white border border-secondary/10 rounded-lg outline-none" disabled />
                      </div>
                   </div>
                </div>
             )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between border-t border-secondary/10 pt-6">
             {step > 1 ? (
               <button 
                 onClick={handleBack}
                 className="px-6 py-3 font-bold text-secondary bg-surface rounded-xl hover:bg-secondary/10 transition-colors"
               >
                  Back
               </button>
             ) : <div></div>}

             {step < 3 ? (
               <button 
                 onClick={handleNext}
                 disabled={step === 1 && !selectedTime}
                 className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
               >
                  Next Step
               </button>
             ) : (
               <button 
                 onClick={handleConfirm}
                 disabled={isLoading}
                 className="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-colors shadow-lg flex items-center justify-center gap-2 min-w-[160px]"
               >
                 {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : "Confirm & Pay"}
               </button>
             )}
          </div>
       </div>
    </div>
  );
}
