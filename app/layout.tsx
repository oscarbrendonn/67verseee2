import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#b8c8cf",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://eggnova-three-editor.tilkisarp.chatgpt.site"),
  title: "67VERSE — City Park Lobby",
  description: "A playable Three.js city park lobby with a public skate plaza and obstacle course access.",
  openGraph: {
    title: "67VERSE — City Park Lobby",
    description: "Explore the city park lobby, visit the skate plaza, or enter the Skybound Sprint course.",
    images: ["/og-skate.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "67VERSE — City Park Lobby",
    description: "A playable Three.js city park and skate plaza lobby.",
    images: ["/og-skate.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
