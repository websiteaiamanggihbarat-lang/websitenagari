"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  animationType?: "slide-left" | "slide-right" | "slide-bottom" | "fade" | "scale";
  delay?: number;
}

export default function ScrollAnimation({
  children,
  className = "",
  animationType = "fade",
  delay = 0,
}: ScrollAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("animate-in");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [delay]);

  const animationClass = `scroll-${animationType.replace("-", "-")}`;

  return (
    <div ref={elementRef} className={`${animationClass} ${className}`}>
      {children}
    </div>
  );
}
