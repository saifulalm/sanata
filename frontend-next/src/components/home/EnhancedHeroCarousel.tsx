"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { HeroCarouselScene } from "./HeroSceneCarousel";

interface EnhancedHeroCarouselProps {
  scenes: HeroCarouselScene[];
  label?: string;
  intervalMs?: number;
}

// Floating particle
function Particle({
  x,
  y,
  size,
  duration,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-cyan-400/30"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
      }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

// Animated building bars
function BuildingBars() {
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-3 px-8">
      {[65, 95, 120, 85, 140, 100, 75, 110, 90, 130, 80, 105].map((height, index) => (
        <motion.div
          key={index}
          className="w-6 rounded-t-lg border border-cyan-300/20 bg-gradient-to-b from-cyan-200/20 via-cyan-300/15 to-cyan-500/30"
          initial={{ height: 0 }}
          animate={{ height: `${height}px` }}
          transition={{
            duration: 1.2,
            delay: index * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

// Animated circuit lines
function CircuitLines() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-20">
      <motion.path
        d="M0,50 Q100,20 200,50 T400,50 T600,50"
        stroke="rgba(56,189,248,0.4)"
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.path
        d="M0,150 Q150,120 300,150 T600,150"
        stroke="rgba(56,189,248,0.3)"
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
      />
      <motion.path
        d="M0,250 Q80,220 160,250 T320,250 T480,250"
        stroke="rgba(56,189,248,0.2)"
        strokeWidth="1"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1 }}
      />
    </svg>
  );
}

export function EnhancedHeroCarousel({
  scenes,
  label = "Live 4D Carousel",
  intervalMs = 4500,
}: EnhancedHeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; size: number; duration: number; delay: number }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % scenes.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, scenes.length, intervalMs]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + scenes.length) % scenes.length);
  }, [scenes.length]);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % scenes.length);
  }, [scenes.length]);

  const scene = scenes[current] ?? scenes[0];

  return (
    <div
      ref={containerRef}
      className="relative h-[480px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </div>

      {/* Circuit lines */}
      <CircuitLines />

      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${scene.accentClass}`}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col justify-end p-6"
        >
          {/* Label */}
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur-xl">
              {label}
            </span>
          </div>

          {/* Building visualization */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-64 w-full">
              <BuildingBars />
              {/* Reflection */}
              <div className="absolute -bottom-4 left-0 right-0 h-16 rounded-b-full bg-gradient-to-t from-cyan-400/10 to-transparent blur-xl" />
            </div>
          </div>

          {/* Text content */}
          <div className="relative z-10">
            <h3 className="text-xl font-semibold uppercase tracking-[0.1em] text-white">
              {scene.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">
              {scene.subtitle}
            </p>
            {scene.href && (
              <Link
                href={scene.href}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-300/20"
              >
                Explore <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={prev}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1.5">
          {scenes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all ${
                index === current
                  ? "w-6 bg-cyan-400"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          {isPlaying ? (
            <div className="h-3 w-3 rounded-sm bg-white" />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-cyan-400"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        key={`progress-${current}`}
        transition={{
          duration: intervalMs / 1000,
          ease: "linear",
        }}
        style={{ display: isPlaying && !isHovered ? "block" : "none" }}
      />
    </div>
  );
}
