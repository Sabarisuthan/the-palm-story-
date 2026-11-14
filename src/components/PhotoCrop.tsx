import { ASSETS } from "@/lib/media";

const PHOTO_ASPECT = ASSETS.sweetBox.width / ASSETS.sweetBox.height;

/**
 * CSS (width/left/top, in % of the frame) for an <img> of the photo so that
 * region centre (cx, cy) of width `size` fills a frame of the given aspect.
 * Tween between two of these to move a "camera" across the photograph.
 */
export function cropStyle(cx: number, cy: number, size: number, aspect = 1) {
  const scale = 1 / size;
  const hFrac = (size / aspect) * PHOTO_ASPECT; // frame height as fraction of photo height
  return {
    width: `${scale * 100}%`,
    left: `${-(cx - size / 2) * scale * 100}%`,
    top: `${-(cy - hFrac / 2) * (scale / PHOTO_ASPECT) * aspect * 100}%`,
  };
}

/**
 * Shows a region of the ORIGINAL sweet-box photograph — a camera crop,
 * never an alteration. (cx, cy) is the region centre and `size` its width,
 * all as fractions of the photo. The frame's own aspect ratio comes from CSS.
 */
export default function PhotoCrop({
  cx,
  cy,
  size,
  aspect = 1,
  className = "",
  imgClassName = "",
  style,
  alt = "",
}: {
  cx: number;
  cy: number;
  size: number;
  aspect?: number;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
  alt?: string;
}) {
  const { width, left, top } = cropStyle(cx, cy, size, aspect);
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: String(aspect), ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.sweetBox.src}
        alt={alt}
        draggable={false}
        decoding="async"
        loading="lazy"
        className={`absolute max-w-none select-none ${imgClassName}`}
        style={{ width, left, top }}
      />
    </div>
  );
}
