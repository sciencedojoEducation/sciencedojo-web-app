"use client";

import { useMemo, useState } from "react";

type DashboardAvatarProps = {
  src?: string | null;
  name?: string | null;
  fallbackLabel?: string | null;
  imgClassName?: string;
  fallbackClassName?: string;
};

const PLACEHOLDER_AVATAR_PATHS = new Set([
  "/tutor_placeholder.webp",
  "/profile-placeholder.png",
  "/avatar-placeholder.png",
]);

function normalizeAvatarUrl(src?: string | null) {
  const trimmed = src?.trim();

  if (!trimmed || PLACEHOLDER_AVATAR_PATHS.has(trimmed)) {
    return null;
  }

  return trimmed;
}

function getInitial(name?: string | null, fallbackLabel?: string | null) {
  const source = name?.trim() || fallbackLabel?.trim() || "User";
  return Array.from(source)[0]?.toUpperCase() || "U";
}

export default function DashboardAvatar({
  src,
  name,
  fallbackLabel,
  imgClassName = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center text-sm font-black",
}: DashboardAvatarProps) {
  const normalizedSrc = useMemo(() => normalizeAvatarUrl(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageFailed = Boolean(normalizedSrc && failedSrc === normalizedSrc);

  if (normalizedSrc && !imageFailed) {
    return (
      <img
        src={normalizedSrc}
        alt={name?.trim() || "Profile"}
        className={imgClassName}
        onError={() => setFailedSrc(normalizedSrc)}
      />
    );
  }

  return (
    <div className={fallbackClassName} aria-label={name?.trim() || "Profile"}>
      {getInitial(name, fallbackLabel)}
    </div>
  );
}
