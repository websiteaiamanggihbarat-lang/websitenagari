"use client";

import { useEffect, useRef } from "react";

export function useScrollAnimation(
  animationType: "slide-left" | "slide-right" | "slide-bottom" | "fade" | "scale" = "fade"
) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Add initial animation class
    const animationClass = `scroll-${animationType.replace("-", "-")}`;
    element.classList.add(animationClass);

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [animationType]);

  return elementRef;
}
