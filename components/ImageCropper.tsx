"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: any) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        }, "image/jpeg");
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl aspect-square bg-white rounded-[3rem] overflow-hidden shadow-2xl">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteInternal}
        />
      </div>
      
      <div className="mt-8 w-full max-w-md space-y-6">
        <div className="px-8 flex flex-col gap-4">
           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] text-center">Zoom Level</label>
           <input
             type="range"
             value={zoom}
             min={1}
             max={3}
             step={0.1}
             aria-labelledby="Zoom"
             onChange={(e: any) => setZoom(e.target.value)}
             className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
           />
        </div>

        <div className="flex gap-4">
          <button 
             onClick={onCancel}
             className="flex-1 py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all active:scale-95"
          >
             Cancel
          </button>
          <button 
             onClick={handleConfirm}
             className="flex-1 py-4 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:bg-accent-hover transition-all active:scale-95"
          >
             Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
