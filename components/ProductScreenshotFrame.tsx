import Image from "next/image";

type ProductScreenshotFrameProps = {
  src: string;
  alt: string;
  sizes: string;
  width: number;
  height: number;
  mobileSrc?: string;
  loading?: "eager" | "lazy";
};

export default function ProductScreenshotFrame({
  src,
  alt,
  sizes,
  width,
  height,
  mobileSrc,
  loading,
}: ProductScreenshotFrameProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#cbd9e5] bg-white shadow-[0_18px_38px_rgba(7,41,75,.13)]">
      <div className="flex h-8 items-center gap-1.5 border-b border-[#e7edf3] bg-[#fbfcfe] px-3" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6059]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      {mobileSrc ? <>
        <Image src={mobileSrc} alt={alt} width={560} height={800} sizes="(max-width: 640px) 100vw, 1px" loading={loading} className="h-auto w-full sm:hidden" />
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} loading={loading} className="hidden h-auto w-full sm:block" />
      </> : <Image src={src} alt={alt} width={width} height={height} sizes={sizes} loading={loading} className="h-auto w-full" />}
    </div>
  );
}
