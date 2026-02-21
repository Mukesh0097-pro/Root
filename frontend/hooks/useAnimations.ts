import React, { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- useScrollReveal ---
// Extracts the common gsap.from + ScrollTrigger pattern used across 12+ components.

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  opacity?: number;
  scale?: number;
  rotateX?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  toggleActions?: string;
}

export function useScrollReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
  options?: ScrollRevealOptions
) {
  useGSAP(() => {
    const {
      start = 'top 85%',
      toggleActions = 'play none none reverse',
      y = 60,
      opacity = 0,
      duration = 0.8,
      stagger = 0.12,
      ease = 'power3.out',
      x,
      scale,
      rotateX,
      ...rest
    } = options ?? {};

    const fromProps: gsap.TweenVars = { y, opacity, duration, stagger, ease, ...rest };
    if (x !== undefined) fromProps.x = x;
    if (scale !== undefined) fromProps.scale = scale;
    if (rotateX !== undefined) fromProps.rotateX = rotateX;

    fromProps.scrollTrigger = {
      trigger: containerRef.current,
      start,
      toggleActions,
    };

    gsap.from(selector, fromProps);
  }, { scope: containerRef });
}

// --- useHoverLift ---
// Returns onMouseEnter/onMouseLeave handlers for the common card lift pattern.

interface HoverLiftOptions {
  y?: number;
  scale?: number;
  duration?: number;
  ease?: string;
}

export function useHoverLift(options?: HoverLiftOptions) {
  const { y = -6, scale, duration = 0.35, ease = 'power3.out' } = options ?? {};

  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const props: gsap.TweenVars = { y, duration, ease };
    if (scale !== undefined) props.scale = scale;
    gsap.to(e.currentTarget, props);
  }, [y, scale, duration, ease]);

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const props: gsap.TweenVars = { y: 0, duration, ease };
    if (scale !== undefined) props.scale = 1;
    gsap.to(e.currentTarget, props);
  }, [scale, duration, ease]);

  return { onMouseEnter, onMouseLeave };
}

// --- useIsMobile ---
// Detects touch/coarse-pointer devices to gate GPU-intensive 3D effects.

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = 'ontouchstart' in window;
    setIsMobile(coarsePointer || hasTouch);
  }, []);

  return isMobile;
}
