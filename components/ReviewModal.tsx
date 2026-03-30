'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewModalProps {
  bookingId: string;
  tutorId: string;
  tutorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ bookingId, tutorId, tutorName, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating from 1 to 5 stars.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, tutorId, rating, comment }),
      });
      
      const data = await res.json();

      if (!res.ok) {
         throw new Error(data.error || 'Failed to submit review');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black text-secondary mb-2">Rate Your Session</h2>
        <p className="text-sm font-bold text-secondary/60 mb-6">How was your lesson with {tutorName}?</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                (hoverRating || rating) >= star 
                  ? 'bg-yellow-100 text-yellow-500 scale-110 shadow-sm' 
                  : 'bg-secondary/5 text-secondary/20 hover:scale-105 hover:bg-secondary/10'
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>

        <div className="mb-8">
          <label className="block text-xs font-black text-secondary/40 uppercase tracking-widest mb-2">Leave a comment (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            placeholder="What went well? How was their teaching style?"
            className="w-full p-4 bg-secondary/5 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl transition-all resize-none h-32 text-sm text-secondary font-medium"
          ></textarea>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-secondary/5 text-secondary font-bold rounded-2xl hover:bg-secondary/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 py-3 px-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary-hover disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center"
          >
            {isSubmitting ? (
               <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
