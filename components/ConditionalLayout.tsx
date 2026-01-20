"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin") || pathname === "/login";

  return (
    <>
      {!isAdminPage && <Navigation />}
      <main className="min-h-screen">{children}</main>
      {!isAdminPage && <Footer />}
    </>
  );
}
