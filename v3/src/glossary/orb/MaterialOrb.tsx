import { useEffect, useRef } from "react";
import type { OrbLook } from "./orbParams";
import { uniformsOf } from "./orbParams";
import { drawStill, paintOrb } from "./orbRenderer";
import "./materialOrb.css";

interface MaterialOrbProps {
  look: OrbLook;
  /** CSS pixels; the canvas uses twice that for sharp screens. */
  size: number;
  /** "still" in lists and tastings; "live" only for the open material sheet. */
  mode?: "still" | "live";
  /** Varies the marbling between materials with the same look (for example a hash of the material id). */
  seed?: number;
  className?: string;
  /** Called with the canvas each time a still is painted (to measure it, e.g. for letters over it). */
  onPaint?: (canvas: HTMLCanvasElement) => void;
}

function frameColor(el: Element): string {
  return getComputedStyle(el).getPropertyValue("--orb-frame").trim() || "#2b2830";
}

/**
 * A material's orb in its frame. Decorative: the sheet or row shows the same data as text,
 * so the orb is hidden from screen readers.
 * - still: painted once when it nears the screen, then served from the shared cache.
 * - live: animates while on screen and the tab is visible; still under reduced motion.
 */
export function MaterialOrb({ look, size, mode = "still", seed = 0, className, onPaint }: MaterialOrbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lookRef = useRef(look);
  lookRef.current = look;
  const onPaintRef = useRef(onPaint);
  onPaintRef.current = onPaint;
  const key = JSON.stringify(look);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let raf = 0;
    let clock = 0;
    let last = 0;

    const drawStillNow = () => {
      drawStill(canvas, lookRef.current, frameColor(canvas), seed);
      onPaintRef.current?.(canvas);
    };
    const tick = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || reduce.matches) return;
      clock += Math.min(0.05, last ? (now - last) / 1000 : 0);
      last = now;
      paintOrb(canvas, lookRef.current, frameColor(canvas), clock * uniformsOf(lookRef.current).speed * 6, seed);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (mode !== "live" || reduce.matches) return drawStillNow();
      last = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    }, { rootMargin: "200px" });
    io.observe(canvas);
    const onVisibility = () => { if (!document.hidden && visible) start(); };
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", start);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", start);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key, mode, seed, size]);

  return (
    <canvas
      ref={ref}
      className={className ? `material-orb ${className}` : "material-orb"}
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
