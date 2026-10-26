import Image from "next/image";
import { Home } from "lucide-react";

interface PropertyImageProps {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  emptyLabel?: string;
}

/** Cloudinary photo with an elegant placeholder when a listing has no image yet. */
export default function PropertyImage({ src, alt, sizes, priority, className = "", emptyLabel }: PropertyImageProps) {
  if (!src) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-obsidian via-brand-obsidian to-brand-gold/10 text-brand-gold/50 ${className}`}>
        <Home className="h-8 w-8" aria-hidden="true" />
        {emptyLabel && <span className="text-xs">{emptyLabel}</span>}
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
}
