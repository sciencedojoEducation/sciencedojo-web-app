"use client";

import { useState } from "react";
import Image from "next/image";

interface YouTubeLiteProps {
  url: string;
  poster?: string;
}

export default function YouTubeLite({ url, poster }: YouTubeLiteProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID from common YouTube URL formats
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) return null;

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-secondary/5">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-secondary/5 cursor-pointer group"
      onClick={() => setIsPlaying(true)}
    >
      <Image 
        src={thumbnailUrl} 
        alt="Video Thumbnail" 
        fill 
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-secondary/20 group-hover:bg-secondary/10 transition-colors"></div>

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-primary/95 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-active:scale-95 border-4 border-white/20 backdrop-blur-sm">
          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4.516 2.103c.125-.078.271-.12.42-.12h.023c.15 0 .296.042.42.12l11.023 6.894c.243.152.38.411.38.694s-.137.542-.38.694l-11.023 6.894c-.125.078-.271.12-.42.12h-.023c-.15 0-.296-.042-.42-.12a.854.854 0 01-.43-.746V2.85c0-.317.165-.602.43-.747z" />
          </svg>
        </div>
      </div>

      {/* Intro Label */}
      <div className="absolute bottom-6 left-6 right-6">
        <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-secondary shadow-lg">
           Watch Intro Video
        </span>
      </div>
    </div>
  );
}
