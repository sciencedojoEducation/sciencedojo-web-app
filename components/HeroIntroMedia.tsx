"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type HeroIntroMediaProps = {
  imageSrc: string;
  imageAlt: string;
  videoSrc: string;
};

export default function HeroIntroMedia({ imageSrc, imageAlt, videoSrc }: HeroIntroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      return;
    }

    setShouldPlayVideo(true);
    setIsVideoVisible(true);
  }, []);

  useEffect(() => {
    if (!shouldPlayVideo || !videoRef.current) {
      return;
    }

    const playPromise = videoRef.current.play();

    if (playPromise) {
      playPromise.catch(() => {
        setIsVideoVisible(false);
      });
    }
  }, [shouldPlayVideo]);

  return (
    <>
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="(max-width: 1024px) 92vw, 54vw"
        className="object-cover scale-[1.04]"
      />
      {shouldPlayVideo && (
        <video
          ref={videoRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full scale-[1.04] object-cover transition-opacity duration-700 ${
            isVideoVisible ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          preload="metadata"
          poster={imageSrc}
          onEnded={() => setIsVideoVisible(false)}
          onError={() => setIsVideoVisible(false)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </>
  );
}
