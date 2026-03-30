"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { uploadAvatarOnly } from "@/app/login/actions";

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
}

export default function AvatarUploader({ currentAvatarUrl }: AvatarUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleApplyCrop = async () => {
    if (!image || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg");
      
      const response = await uploadAvatarOnly(formData);
      
      if (response?.error) {
        alert("Upload failed: " + response.error);
      } else {
        setImage(null);
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred during cropping.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6 pb-6 border-b border-secondary/5">
      <div className="w-20 h-20 rounded-full bg-secondary/5 border border-secondary/10 overflow-hidden relative shadow-inner flex items-center justify-center">
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="text-3xl">👤</div>
        )}
      </div>

      <div className="flex-1">
        <label className="block text-sm font-bold text-secondary mb-2">Profile Photo</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-primary/10 text-primary text-xs font-black rounded-full hover:bg-primary/20 transition-colors"
        >
          {isUploading ? "Uploading..." : "Change Photo"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onSelectFile}
          accept="image/*"
          className="hidden"
        />
        <p className="text-[10px] text-secondary/40 mt-1 uppercase font-bold tracking-tight">Recommended: Square image, Max 2MB.</p>
      </div>

      {image && (
        <div className="fixed inset-0 z-50 bg-secondary/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-secondary mb-6 text-center">Crop Your Photo</h3>
            
            <div className="relative w-full h-[300px] mb-8 bg-surface rounded-2xl overflow-hidden border border-secondary/10">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="mb-8 bg-surface p-4 rounded-2xl border border-secondary/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-widest">Zoom Scale</label>
                <span className="text-[10px] font-black text-secondary/60 bg-secondary/5 px-2 py-0.5 rounded-full">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                className="w-full h-1.5 bg-secondary/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setImage(null)}
                className="px-6 py-2 text-secondary font-bold hover:bg-secondary/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isUploading}
                className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-all"
              >
                {isUploading ? "Applying..." : "Save Selection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
