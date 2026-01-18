"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ScrollAnimations() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const setupAnimations = () => {
      const selector =
        ".scroll-slide-left, .scroll-slide-right, .scroll-slide-bottom, .scroll-fade, .scroll-scale";
      const elements = document.querySelectorAll(selector);

      // Remove animate-in from all elements first
      elements.forEach((el) => {
        el.classList.remove("animate-in");
      });

      // Create Intersection Observer with proper configuration
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Use requestAnimationFrame to ensure smooth animation
              requestAnimationFrame(() => {
                entry.target.classList.add("animate-in");
              });
            }
          });
        },
        {
          threshold: 0.1, // Trigger when 10% visible
          rootMargin: "0px 0px -20px 0px", // Small margin to trigger slightly before fully visible
        }
      );

      // Observe ALL elements - observer will handle both initial and scroll
      elements.forEach((el) => {
        observerRef.current?.observe(el);
      });
    };

    // Setup with multiple attempts to ensure it works
    if (typeof window !== "undefined") {
      // First attempt
      const timeout1 = setTimeout(() => {
        setupAnimations();
      }, 50);

      // Second attempt after DOM settles
      const timeout2 = setTimeout(() => {
        setupAnimations();
      }, 200);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [pathname]);

  return null;
}
