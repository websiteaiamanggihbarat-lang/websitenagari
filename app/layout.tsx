import type { Metadata } from "next";
import "./globals.css";
import ScrollAnimations from "@/components/ScrollAnimations";
import ConditionalLayout from "@/components/ConditionalLayout";

export const metadata: Metadata = {
  title: "Nagari Aia Manggih Barat - Website Pemerintahan",
  description: "Website resmi Pemerintahan Nagari Aia Manggih Barat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <ScrollAnimations />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
