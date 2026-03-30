"use client";

import { TutorProfile } from "@/lib/supabase-queries";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useState, useRef } from "react";
import { updateTutorProfile, updateTutorAvailability } from "@/app/tutor/actions";
import ImageCropper from "@/components/ImageCropper";

interface TutorSettingsFormProps {
  tutor: TutorProfile;
  initialAvailability: boolean;
}

export default function TutorSettingsForm({ tutor, initialAvailability }: TutorSettingsFormProps) {
  const [isLive, setIsLive] = useState(initialAvailability);
  const [previewUrl, setPreviewUrl] = useState<string | null>(tutor.avatar_url);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>(tutor.avatar_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [chatAvailability, setChatAvailability] = useState<any>(tutor.chat_availability || {
    mon: [9, 17], tue: [9, 17], wed: [9, 17], thu: [9, 17], fri: [9, 17], sat: [10, 14], sun: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload image directly from the browser to Supabase Storage.
  // This bypasses the Next.js 1MB Server Action body size limit — only
  // the resulting public URL is ever sent through the Server Action form.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setPreviewUrl(URL.createObjectURL(blob));
    setUploadError(null);
    setIsUploading(true);
    setCropImage(null);

    try {
      const supabase = createClient();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setUploadedAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setUploadError("Photo upload failed. Please try again.");
      setPreviewUrl(tutor.avatar_url);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleAvailability = async () => {
    const newStatus = !isLive;
    setIsLive(newStatus);
    const formData = new FormData();
    formData.append("isAvailable", String(newStatus));
    await updateTutorAvailability(formData);
  };

  return (
    <div className="space-y-8">
      {/* Availability Toggle */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-secondary/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-secondary mb-1">Live Availability</h2>
          <p className="text-sm text-secondary/60 max-w-sm">When toggled on, your profile will show a green "Available Now" badge in the directory.</p>
        </div>
        <button
          onClick={handleToggleAvailability}
          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${isLive ? "bg-green-500" : "bg-secondary/20"}`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isLive ? "translate-x-9" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Public Profile Form */}
      <div className="bg-white p-8 rounded-3xl border border-secondary/10 shadow-sm">
        <h2 className="text-xl font-bold text-secondary mb-8">Public Directory Information</h2>

        <form
          action={updateTutorProfile}
          onSubmit={() => setIsSaving(true)}
        >
          {/* Hidden field carries only the URL — no binary data through the Server Action */}
          <input type="hidden" name="avatarUrl" value={uploadedAvatarUrl} />

          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 relative rounded-full overflow-hidden border-4 border-surface shadow-md bg-slate-100 flex items-center justify-center">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-xs text-secondary/60">Uploading…</span>
                  </div>
                ) : previewUrl ? (
                  <Image src={previewUrl} alt={tutor.full_name} fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>

              {/* File input — triggers client-side upload, never submitted through the form */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {isUploading ? "Uploading…" : "Upload New Photo"}
              </button>

              {uploadError && (
                <p className="text-xs text-red-500 text-center max-w-[8rem]">{uploadError}</p>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">Display Name</label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={tutor.full_name}
                  className="w-full p-3 rounded-xl border border-secondary/20 bg-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary mb-1">Primary Subject</label>
                  <input
                    type="text"
                    name="subjects"
                    defaultValue={tutor.subjects.join(", ")}
                    placeholder="Math, Physics…"
                    className="w-full p-3 rounded-xl border border-secondary/20 bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary mb-1">Hourly Rate (£)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    defaultValue={tutor.hourly_rate}
                    className="w-full p-3 rounded-xl border border-secondary/20 bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-secondary mb-1">YouTube Introduction URL</label>
                <input
                  type="text"
                  name="youtubeIntroUrl"
                  defaultValue={tutor.youtube_intro_url || ""}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-3 rounded-xl border border-secondary/20 bg-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-secondary/40 mt-1 font-bold italic">Showcase your teaching style with a 1-2 minute video.</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-secondary mb-4 uppercase tracking-widest text-primary/60">Chat Availability (Office Hours)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(chatAvailability).map((day) => (
                <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-secondary/5">
                  <span className="text-xs font-black uppercase text-secondary/60 w-12">{day}</span>
                  <div className="flex items-center gap-2">
                    {chatAvailability[day] ? (
                      <>
                        <input 
                          type="number" 
                          min="0" max="23"
                          value={chatAvailability[day][0]}
                          onChange={(e) => setChatAvailability({...chatAvailability, [day]: [parseInt(e.target.value), chatAvailability[day][1]]})}
                          className="w-12 p-1 bg-white border border-secondary/10 rounded text-center text-xs font-bold"
                        />
                        <span className="text-xs font-bold">:00 –</span>
                        <input 
                          type="number" 
                          min="0" max="23"
                          value={chatAvailability[day][1]}
                          onChange={(e) => setChatAvailability({...chatAvailability, [day]: [chatAvailability[day][0], parseInt(e.target.value)]})}
                          className="w-12 p-1 bg-white border border-secondary/10 rounded text-center text-xs font-bold"
                        />
                        <span className="text-xs font-bold">:00</span>
                        <button 
                          type="button"
                          onClick={() => setChatAvailability({...chatAvailability, [day]: null})}
                          className="ml-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase"
                        >
                          Off
                        </button>
                      </>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setChatAvailability({...chatAvailability, [day]: [9, 17]})}
                        className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-lg"
                      >
                        Set Hours
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-secondary mb-1">Teaching Philosophy &amp; Bio</label>
            <textarea
              name="bio"
              rows={5}
              defaultValue={tutor.bio}
              className="w-full p-3 rounded-xl border border-secondary/20 bg-surface focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-secondary/50 mt-2">This is the first thing students read. Make it compelling!</p>
          </div>

          {/* Hidden serialization of office hours */}
          <input type="hidden" name="chatAvailability" value={JSON.stringify(chatAvailability)} />

          <button
            type="submit"
            disabled={isUploading || isSaving}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save Profile Changes"}
          </button>
        </form>
      </div>

      {cropImage && (
        <ImageCropper 
          image={cropImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropImage(null)} 
        />
      )}
    </div>
  );
}
