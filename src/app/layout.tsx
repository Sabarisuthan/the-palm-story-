import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Palm Story — A Sweetness Rooted in Nature",
  description:
    "The Palm Story — traditional South Indian Karupatti (palm jaggery) sweets. From a single seed to a timeless sweet story.",
  openGraph: {
    title: "The Palm Story",
    description: "A sweetness rooted in nature. Traditional Karupatti sweets.",
    images: ["/assets/sweet-box.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F3EA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <link rel="preload" as="image" href="/assets/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
