"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView } from "motion/react";

export interface TechVideo {
  title: string;
  description: string;
  video: string;
}

interface Props {
  videos: TechVideo[];
}

const OFFSETS = [-2, -1, 0, 1, 2];
const AUTO_INTERVAL = 8000;

// 3 matching shadow layers for smooth boxShadow interpolation
const GLOW_ACTIVE =
  "0 0 0 1px rgba(6,182,212,0.32), 0 0 60px rgba(6,182,212,0.22), 0 30px 80px rgba(0,0,0,0.65)";
const GLOW_HOVER =
  "0 0 0 1px rgba(6,182,212,0.20), 0 0 35px rgba(6,182,212,0.15), 0 20px 50px rgba(0,0,0,0.50)";
const SHADOW_ADJ =
  "0 0 0 1px rgba(255,255,255,0.07), 0 0 0px rgba(6,182,212,0.00), 0 10px 30px rgba(0,0,0,0.35)";
const SHADOW_FAR =
  "0 0 0 0px rgba(255,255,255,0.00), 0 0 0px rgba(6,182,212,0.00), 0 0 0px rgba(0,0,0,0.00)";

// Spring: low bounce, deliberate feel (~700ms settling)
const SLIDE_SPRING = { type: "spring" as const, stiffness: 200, damping: 38, mass: 1.1 };

const PARTICLES = [
  { x: 12, y: 18, s: 1.5, o: 0.35, d: 4.2 },
  { x: 87, y: 11, s: 1.2, o: 0.28, d: 3.1 },
  { x:  5, y: 62, s: 1.8, o: 0.40, d: 5.0 },
  { x: 93, y: 74, s: 1.3, o: 0.32, d: 3.8 },
  { x: 45, y:  5, s: 1.6, o: 0.36, d: 4.5 },
  { x: 78, y: 88, s: 1.1, o: 0.25, d: 2.9 },
  { x: 22, y: 91, s: 1.4, o: 0.30, d: 3.5 },
  { x: 65, y: 42, s: 1.7, o: 0.38, d: 4.8 },
  { x: 33, y: 55, s: 1.2, o: 0.22, d: 6.1 },
  { x: 55, y: 78, s: 1.9, o: 0.42, d: 3.3 },
];

export default function TechnologyShowcase({ videos }: Props) {
  const n = videos.length;
  const sectionRef  = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs   = useRef<Map<string, HTMLVideoElement>>(new Map());
  const isInView    = useInView(sectionRef, { margin: "-10% 0px -10% 0px" });

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredOffset, setHoveredOffset] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 1024;

  // Active card: 70% desktop, 75% tablet, 88% mobile
  // Visible side = (containerWidth - activeWidth) / 2 ≈ 12–15% on desktop/tablet
  const activeWidth = isMobile
    ? containerWidth * 0.88
    : isTablet
    ? containerWidth * 0.75
    : containerWidth * 0.70;

  const cardHeight = activeWidth > 0 ? activeWidth * (9 / 16) : 400;

  // stepX must be large enough that side cards extend past container edges
  // (so the visible portion is purely the gap: (W - activeWidth) / 2)
  // Desktop: 15% visible → stepX ≥ 0.63W (no overlap between active & side card)
  // Tablet: 12.5% visible → stepX ≥ 0.68W
  // Mobile: full swap
  const stepX = isMobile
    ? containerWidth
    : isTablet
    ? containerWidth * 0.68
    : containerWidth * 0.64;

  const navigate = useCallback((dir: 1 | -1) => {
    setHoveredOffset(null);
    currentIndexRef.current += dir;
    setCurrentIndex(currentIndexRef.current);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navigate(1), AUTO_INTERVAL);
  }, [navigate]);

  useEffect(() => {
    if (isInView) startTimer();
    else if (timerRef.current) clearTimeout(timerRef.current);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, isInView, startTimer]);

  useEffect(() => {
    videoRefs.current.forEach((vid) => {
      if (isInView) vid.play().catch(() => {});
      else vid.pause();
    });
  }, [isInView]);

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { navigate(dx > 0 ? 1 : -1); startTimer(); }
    touchStartX.current = null;
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { navigate(1);  startTimer(); }
      if (e.key === "ArrowLeft")  { navigate(-1); startTimer(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [navigate, startTimer]);

  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 lg:py-28"
      style={{ background: "linear-gradient(180deg,#050d1a 0%,#060e1e 50%,#050d1a 100%)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,1) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,1) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "70%",
          height: "70%",
          background: "radial-gradient(ellipse,rgba(37,99,235,0.09) 0%,transparent 70%)",
        }}
      />

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s * 2,
              height: p.s * 2,
              background: "rgba(6,182,212,1)",
            }}
            animate={{ opacity: [p.o * 0.4, p.o, p.o * 0.4], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: p.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}
      </div>

      {/* Header */}
      <div ref={headerRef} className="relative z-10 mx-auto mb-14 max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-cyan-400">
              Technology Showcase
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white lg:text-5xl">
            Наши{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#2563eb,#06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Решения
            </span>{" "}
            в действии
          </h2>
          <p className="mx-auto max-w-2xl text-base text-white/50 lg:text-lg">
            Передовые технологии искусственного интеллекта для трансформации вашего бизнеса
          </p>
        </motion.div>
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        className="relative z-10 w-full"
        style={{ height: cardHeight || 400 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {containerWidth > 0 && (
          <div
            className="absolute inset-0"
            style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
          >
            {OFFSETS.map((offset) => {
              const absolutePos = currentIndex + offset;
              const videoIdx    = ((absolutePos % n) + n) % n;
              const isActive    = offset === 0;
              const isAdj       = Math.abs(offset) === 1;
              const isHovered   = hoveredOffset === offset && isAdj;

              // Drive all state through animate (no whileHover) for full spring control
              const scale = isActive ? 1 : isHovered ? 0.88 : isAdj ? 0.80 : 0.68;
              const opacity = isActive ? 1 : isHovered ? 0.75 : isAdj ? 0.45 : 0;
              const shadow = isActive
                ? GLOW_ACTIVE
                : isHovered
                ? GLOW_HOVER
                : isAdj
                ? SHADOW_ADJ
                : SHADOW_FAR;

              // Filter on the VIDEO element (not the card container)
              // to preserve 3D perspective + rotateY (CSS filter flattens 3D if on container)
              const videoFilter = isActive
                ? "brightness(1)"
                : isHovered
                ? "blur(0px) brightness(1)"
                : isAdj
                ? "blur(2px) brightness(0.85)"
                : "blur(4px) brightness(0.6)";

              return (
                <motion.div
                  key={String(absolutePos)}
                  className="absolute top-0"
                  style={{
                    left: "50%",
                    marginLeft: -activeWidth / 2,
                    width: activeWidth,
                    height: cardHeight,
                    borderRadius: 24,
                    overflow: "hidden",
                    willChange: "transform, opacity, box-shadow",
                    cursor: isAdj ? "pointer" : "default",
                  }}
                  animate={{
                    x: offset * stepX,
                    scale,
                    opacity,
                    rotateY: isMobile ? 0 : offset < 0 ? 8 : offset > 0 ? -8 : 0,
                    z: isMobile ? 0 : isActive ? 0 : isAdj ? -120 : -220,
                    boxShadow: shadow,
                  }}
                  transition={{
                    x:         SLIDE_SPRING,
                    scale:     SLIDE_SPRING,
                    rotateY:   SLIDE_SPRING,
                    z:         SLIDE_SPRING,
                    opacity:   { duration: 0.5, ease: "easeOut" },
                    boxShadow: { duration: 0.4, ease: "easeOut" },
                  }}
                  onMouseEnter={() => { if (isAdj) setHoveredOffset(offset); }}
                  onMouseLeave={() => setHoveredOffset(null)}
                  onClick={() => {
                    if (isAdj) { navigate(offset > 0 ? 1 : -1); startTimer(); }
                  }}
                >
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(String(absolutePos), el);
                      else    videoRefs.current.delete(String(absolutePos));
                    }}
                    src={videos[videoIdx].video}
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                    disablePictureInPicture
                    className="ts-video pointer-events-none h-full w-full select-none object-cover"
                    style={{
                      filter: videoFilter,
                      transition: "filter 400ms ease",
                    }}
                  />

                  {/* Active card overlays */}
                  {isActive && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-28"
                        style={{
                          background:
                            "linear-gradient(180deg,rgba(6,182,212,0.07) 0%,transparent 100%)",
                        }}
                      />
                      {/* Corner brackets */}
                      <div
                        className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-cyan-400/55"
                        style={{ borderTopLeftRadius: 4 }}
                      />
                      <div
                        className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-cyan-400/55"
                        style={{ borderTopRightRadius: 4 }}
                      />
                      <div
                        className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-cyan-400/55"
                        style={{ borderBottomLeftRadius: 4 }}
                      />
                      <div
                        className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-cyan-400/55"
                        style={{ borderBottomRightRadius: 4 }}
                      />
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Left arrow */}
        <motion.button
          aria-label="Previous"
          className="absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md lg:left-10"
          style={{ width: 52, height: 52 }}
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(6,182,212,0.18)",
            borderColor: "rgba(6,182,212,0.45)",
          }}
          whileTap={{ scale: 0.93 }}
          onClick={() => { navigate(-1); startTimer(); }}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-white/75"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>

        {/* Right arrow */}
        <motion.button
          aria-label="Next"
          className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 backdrop-blur-md lg:right-10"
          style={{ width: 52, height: 52 }}
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(6,182,212,0.18)",
            borderColor: "rgba(6,182,212,0.45)",
          }}
          whileTap={{ scale: 0.93 }}
          onClick={() => { navigate(1); startTimer(); }}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-white/75"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>

      {/* Dots */}
      <div className="relative z-10 mt-8 flex justify-center gap-2">
        {videos.map((_, i) => {
          const isActive = ((currentIndex % n) + n) % n === i;
          return (
            <motion.button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full"
              style={{
                width: isActive ? 28 : 7,
                height: 7,
                background: isActive ? "#06b6d4" : "rgba(255,255,255,0.20)",
                transition: "width 350ms ease, background 350ms ease",
              }}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const cur = ((currentIndexRef.current % n) + n) % n;
                const diff = i - cur;
                const wrapped = diff > n / 2 ? diff - n : diff < -n / 2 ? diff + n : diff;
                currentIndexRef.current += wrapped;
                setCurrentIndex(currentIndexRef.current);
                startTimer();
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
