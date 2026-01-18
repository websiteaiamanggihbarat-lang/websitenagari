"use client";

import { useEffect, useRef, ReactNode } from "react";

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  animationType?: "slide-left" | "slide-right" | "slide-bottom" | "fade" | "scale";
  delay?: number;
}

export default function AnimateOnScroll({
  children,
  className = "",
  animationType = "fade",
  delay = 0,
}: AnimateOnScrollProps) {
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

    // Add initial animation class
    const animationClass = `scroll-${animationType.replace("-", "-")}`;
    element.classList.add(animationClass);

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [animationType, delay]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
