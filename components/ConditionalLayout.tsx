"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin") || pathname === "/login";

  if (isAdminPage) {
    return (
      <ToastProvider>
        <main className="min-h-screen">{children}</main>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-[#fbfaf7] overflow-x-clip">
        {/* Shared Decorative Pattern Overlay (Pointer Events None, z-0) */}
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none public-pattern-overlay"
        />

        {/* Public Navigation */}
        <Navigation />

        {/* Public Content Container (z-10, relative above background pattern) */}
        <main className="relative z-10 min-h-screen bg-transparent">{children}</main>

        {/* Public Footer */}
        <Footer />
      </div>
    </ToastProvider>
  );
}
