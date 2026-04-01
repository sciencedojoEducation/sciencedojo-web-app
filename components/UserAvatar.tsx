import Image, { ImageProps } from "next/image";

interface UserAvatarProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt: string;
}

export default function UserAvatar({ src, alt, className = "", ...props }: UserAvatarProps) {
  const isMissing = !src || src === "/tutor_placeholder.webp";

  if (isMissing) {
    // Generate initials (up to 2 characters) from the alt text
    const words = alt?.trim().split(/\s+/) || [];
    let initials = "";
    if (words.length > 0) {
      initials += words[0][0];
      if (words.length > 1) {
         initials += words[1][0];
      } else if (words[0].length > 1) {
         initials += words[0][1];
      }
    }
    initials = initials.toUpperCase() || "??";

    // Use a hash of the name to pick a stable dynamic background color!
    const colors = [
      "bg-emerald-500", "bg-sky-500", "bg-amber-500", 
      "bg-violet-500", "bg-fuchsia-500", "bg-rose-500", "bg-indigo-500"
    ];
    const hash = alt?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const bgColor = colors[hash % colors.length];

    // the outer wrapper must emulate the 'fill' context if 'fill' is true, 
    // but typically UserAvatar should just span the full width/height of its parent.
    return (
      <div 
         title={alt}
         className={`flex items-center justify-center text-white font-black tracking-widest leading-none ${bgColor} ${props.fill ? "absolute inset-0 w-full h-full" : "w-full h-full"} ${className}`}
      >
        <span className="opacity-90 tracking-tighter mix-blend-plus-lighter" style={{ fontSize: 'clamp(0.5rem, 40%, 3rem)' }}>
           {initials}
        </span>
      </div>
    );
  }

  return (
    <Image 
      src={src} 
      alt={alt} 
      className={className}
      {...props} 
    />
  );
}
