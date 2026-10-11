"use client";

import * as React from "react";

/**
 * Curved, sliced-image carousel inspired by the supplied TiltedGridHero.
 * Each of the 16 strips is a facet of the same cylindrical image surface.
 * Unlike a decorative CSS marquee, the selected image can be opened and
 * the position responds to the mouse wheel, trackpad, arrows and swipes.
 * Normal vertical page scrolling is deliberately never prevented.
 */
const SLICES = 16;
const CAMERA = 1.6;
const MAX_WIDTH = 55;

function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

type Layout = { width: number; height: number; tileH: number; tileW: number; radius: number; unit: number; pitch: number };

function measure(width: number, height: number, tileHeight: number, aspectRatio: number, gap: number, curve: number): Layout {
  const safeW = Math.max(width, 1);
  const safeH = Math.max(height, 1);
  const aspect = Math.max(0.5, aspectRatio);
  const bend = Math.min(85, Math.max(5, curve)) * Math.PI / 180;
  const tileH = Math.min((tileHeight / 100) * safeH, ((MAX_WIDTH / 100) * safeW) / aspect);
  const radius = Math.max(1, safeW * arc(bend));
  const unit = tileH / radius * 180 / Math.PI;
  return {
    width: safeW,
    height: safeH,
    tileH,
    tileW: tileH * aspect,
    radius,
    unit,
    pitch: Math.min(41, (aspect + gap / 100) * unit),
  };
}

export type TiltedGridImage = {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
};

export type TiltedGridHeroProps = {
  images: TiltedGridImage[];
  /** Selected tile; leave undefined to let the component manage selection. */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onImageSelect?: (image: TiltedGridImage, index: number, element: HTMLElement | null) => void;
  /** Wrap index at the ends. Defaults to true for image galleries. */
  loop?: boolean;
  /** Automatically advance when visible until the visitor interacts. */
  autoPlay?: boolean;
  /** Seconds between cards in automatic mode, as in the original component. */
  speed?: number;
  tileHeight?: number;
  aspectRatio?: number;
  gap?: number;
  axis?: number;
  curve?: number;
  fade?: number;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  wheelHint?: string;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Positioned image facets stay together when the parent tile rotates.
 * Only nearby cards are mounted; this matters for hundreds of gallery items.
 */
export function TiltedGridHero({
  images,
  activeIndex,
  onActiveIndexChange,
  onImageSelect,
  loop = true,
  autoPlay = false,
  speed = 4,
  tileHeight = 40,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 50,
  curve = 80,
  fade = 7,
  label = "3D-Bildgalerie",
  previousLabel = "Zurück",
  nextLabel = "Weiter",
  wheelHint = "Mausrad, Wischen oder Pfeiltasten zum Blättern",
  children,
  className = "",
  ...rest
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const [layout, setLayout] = React.useState<Layout | null>(null);
  const [internalIndex, setInternalIndex] = React.useState(0);
  const [motionReduced, setMotionReduced] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const touched = React.useRef(false);
  const wheelSum = React.useRef(0);
  const lastWheel = React.useRef(0);
  const touch = React.useRef({ x: 0, y: 0, active: false, moved: false });
  const ignoreClick = React.useRef(false);
  const count = images.length;
  const chosen = activeIndex ?? internalIndex;
  const index = count ? (loop ? ((chosen % count) + count) % count : Math.min(count - 1, Math.max(0, chosen))) : 0;
  const liveIndex = React.useRef(index);
  liveIndex.current = index;

  React.useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setLayout(measure(width, height, tileHeight, aspectRatio, gap, curve));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [tileHeight, aspectRatio, gap, curve]);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const moveTo = React.useCallback((requested: number) => {
    if (!count) return;
    const next = loop ? ((requested % count) + count) % count : Math.min(count - 1, Math.max(0, requested));
    if (next === liveIndex.current) return;
    liveIndex.current = next;
    if (activeIndex === undefined) setInternalIndex(next);
    onActiveIndexChange?.(next);
  }, [activeIndex, count, loop, onActiveIndexChange]);

  const advance = React.useCallback((direction: number) => moveTo(liveIndex.current + direction), [moveTo]);
  React.useEffect(() => {
    if (!autoPlay || motionReduced || isHovered || !isVisible || !loop || count < 2) return;
    const timer = window.setInterval(() => {
      if (!touched.current && !document.hidden) advance(1);
    }, Math.max(1500, speed * 1000));
    return () => window.clearInterval(timer);
  }, [autoPlay, motionReduced, isHovered, isVisible, loop, count, speed, advance]);

  React.useEffect(() => {
    if (!autoPlay) return;
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [autoPlay]);

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    // Never preventDefault: the page continues scrolling naturally.
    // Trackpads send dozens of tiny deltas; group them into one logical step.
    if (event.ctrlKey || event.metaKey || !count) return;
    touched.current = true;
    const scale = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 300 : 1;
    const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * scale;
    const now = performance.now();
    if (now - lastWheel.current > 500) wheelSum.current = 0;
    wheelSum.current += delta;
    if (Math.abs(wheelSum.current) >= 65 && now - lastWheel.current >= 130) {
      advance(wheelSum.current > 0 ? 1 : -1);
      wheelSum.current = 0;
      lastWheel.current = now;
    }
  };

  const size = layout ?? measure(1100, 430, tileHeight, aspectRatio, gap, curve);
  const radius = size.radius;
  const turn = (degree: number) => "translateZ(" + radius + "px) rotateY(" + degree + "deg) translateZ(-" + radius + "px)";
  const partW = size.tileW / SLICES;
  const stripTurn = size.unit / SLICES * aspectRatio;
  const cards: { image: TiltedGridImage; i: number; distance: number }[] = [];
  for (let i = 0; i < count; i++) {
    let distance = i - index;
    if (loop && count > 1) {
      if (distance > count / 2) distance -= count;
      if (distance < -count / 2) distance += count;
    }
    if (Math.abs(distance) <= 2) cards.push({ image: images[i], i, distance });
  }

  return (
    <div
      ref={host}
      {...rest}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      className={"relative isolate w-full overflow-hidden rounded-2xl border border-line bg-bg-raised outline-none focus-visible:ring-2 focus-visible:ring-accent " + className}
      style={{ ...rest.style, touchAction: "pan-y" }}
      onWheel={onWheel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsHovered(false); }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "ArrowRight") { event.preventDefault(); touched.current = true; advance(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); touched.current = true; advance(-1); }
        if (event.key === "Home") { event.preventDefault(); touched.current = true; moveTo(0); }
        if (event.key === "End") { event.preventDefault(); touched.current = true; moveTo(count - 1); }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        touch.current = { x: event.clientX, y: event.clientY, active: true, moved: false };
      }}
      onPointerUp={(event) => {
        const drag = touch.current;
        if (!drag.active) return;
        drag.active = false;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          ignoreClick.current = true;
          touched.current = true;
          advance(dx < 0 ? 1 : -1);
          window.setTimeout(() => { ignoreClick.current = false; }, 0);
        }
      }}
      onPointerCancel={() => { touch.current.active = false; }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, color-mix(in oklab, var(--accent) 7%, transparent), transparent 66%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          zIndex: 1,
          maskImage: "linear-gradient(90deg, transparent 0%, black " + fade + "%, black " + (100 - fade) + "%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black " + fade + "%, black " + (100 - fade) + "%, transparent 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 z-10 h-[calc(100%-76px)] overflow-hidden"
        style={{
          perspective: radius * CAMERA + "px",
          perspectiveOrigin: "50% " + axis + "%",
          maskImage: "linear-gradient(90deg, transparent, black " + fade + "%, black " + (100 - fade) + "%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black " + fade + "%, black " + (100 - fade) + "%, transparent)",
        }}>
        {cards.map(({ image, i, distance }) => {
          const selected = distance === 0;
          const yaw = distance * size.pitch;
          return (
            <button
              key={image.id}
              type="button"
              data-tilted-card={image.id}
              aria-current={selected ? "true" : undefined}
              aria-label={(i + 1) + " / " + count + ": " + (image.title || image.alt || image.id)}
              onClick={(event) => {
                if (ignoreClick.current) { ignoreClick.current = false; return; }
                touched.current = true;
                onImageSelect?.(image, i, event.currentTarget.querySelector("img"));
                if (!onImageSelect) moveTo(i);
              }}
              className="group absolute cursor-pointer border-0 bg-transparent p-0 text-left text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              style={{
                left: "50%",
                top: axis + "%",
                width: size.tileW,
                height: size.tileH,
                transform: "translate(-50%, -50%) " + turn(yaw),
                transformStyle: "preserve-3d",
                zIndex: 10 - Math.abs(distance),
                opacity: layout ? Math.max(0.22, 1 - Math.abs(distance) * 0.27) : selected ? 1 : 0,
                transition: motionReduced ? "none" : "transform 620ms cubic-bezier(.22,1,.36,1), opacity 620ms ease",
                backfaceVisibility: "hidden",
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <span
                  key={k}
                  aria-hidden="true"
                  className="absolute top-0 overflow-hidden bg-bg"
                  style={{
                    left: (size.tileW - partW) / 2,
                    width: k === SLICES - 1 ? partW : partW + 1,
                    height: size.tileH,
                    transform: turn((SLICES / 2 - (k + 0.5)) * stripTurn),
                    backfaceVisibility: "hidden",
                    borderRadius: k === 0 ? "12px 0 0 12px" : k === SLICES - 1 ? "0 12px 12px 0" : undefined,
                  }}
                >
                  <img src={image.src} alt="" loading={selected ? "eager" : "lazy"} decoding="async"
                    draggable={false} width={1280} height={720}
                    className="absolute top-0 max-w-none object-cover"
                    style={{ left: -k * partW, width: size.tileW, height: size.tileH }}
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </span>
              ))}
              <span className="pointer-events-none absolute inset-x-3 bottom-3 z-20 max-w-full truncate text-sm font-semibold drop-shadow-lg md:text-base" style={{ transform: "translateZ(4px)" }}>
                {image.title}
              </span>
            </button>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-[76px] items-center justify-center gap-5 bg-gradient-to-t from-bg-raised to-transparent px-4">
        <button type="button" onClick={() => { touched.current = true; advance(-1); }} disabled={!loop && index === 0}
          aria-label={previousLabel}
          className="grid size-11 place-items-center rounded-full border border-line-strong bg-bg/80 text-xl hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-35">←</button>
        <span className="tabular min-w-20 text-center text-sm text-fg-muted" aria-live="polite">
          <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
          {" / " + String(count).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => { touched.current = true; advance(1); }} disabled={!loop && index === count - 1}
          aria-label={nextLabel}
          className="grid size-11 place-items-center rounded-full border border-line-strong bg-bg/80 text-xl hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-35">→</button>
      </div>
      <span className="pointer-events-none absolute bottom-2 left-4 z-20 hidden text-[10px] text-fg-subtle lg:block">{wheelHint}</span>
      {children}
    </div>
  );
}

export default TiltedGridHero;
