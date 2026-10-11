import type { ImageInfo } from "@/lib/design-types";
import { srcSets } from "@/lib/media";

/**
 * <picture> mit AVIF + WebP aus den vorab erzeugten Varianten.
 * `avif={false}`: nur WebP – dann steht auch der Master in voller Auflösung zur Wahl (AVIF gibt es nur bis 1280 px), z. B. für den Zoom.
 */
export function DesignImage({
  id, img, alt, sizes, className = "", priority = false, imgRef, onLoad, style, avif = true,
}: {
  id: string; img: Pick<ImageInfo, "base" | "widths" | "width" | "height" | "blur">; alt: string; sizes: string;
  className?: string; priority?: boolean; imgRef?: React.Ref<HTMLImageElement>; onLoad?: () => void; style?: React.CSSProperties; avif?: boolean;
}) {
  const s = srcSets(id, img);
  return (
    <picture>
      {avif && s.avif && <source type="image/avif" srcSet={s.avif} sizes={sizes} />}
      <img
        ref={imgRef}
        src={s.fallback}
        srcSet={s.webp}
        sizes={sizes}
        alt={alt}
        width={img.width}
        height={img.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={onLoad}
        className={className}
        style={{ backgroundImage: img.blur ? `url(${img.blur})` : undefined, backgroundSize: "cover", ...style }}
      />
    </picture>
  );
}
