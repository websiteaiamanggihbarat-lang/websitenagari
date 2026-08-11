import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import ScrollAnimations from "@/components/ScrollAnimations";
import ConditionalLayout from "@/components/ConditionalLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nagari Aia Manggih Barat - Website Pemerintahan",
  description: "Website resmi Pemerintahan Nagari Aia Manggih Barat",
  icons: {
    icon: "/image/logo-kkn.png",
    apple: "/image/logo-kkn.png",
  },
  verification: {
    google: "ikKTmiKtNGD1Sw_gsx48B1OVshRcAeqsNRGE2CLjfQo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} font-sans`}>
      <body className={`${inter.className} font-sans antialiased`}>
        <ScrollAnimations />
        <ConditionalLayout>{children}</ConditionalLayout>
        <GoogleAnalytics gaId="G-WSF5LTD7H1" />
      </body>
    </html>
  );
}
