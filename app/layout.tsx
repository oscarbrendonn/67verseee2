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
  description: "A playable Three.js city with a central skate park and four connected neighborhoods.",
  openGraph: {
    title: "67VERSE — City Park Lobby",
    description: "Skate through Central Park and four connected 67VERSE neighborhoods.",
  },
  twitter: {
    card: "summary",
    title: "67VERSE — City Park Lobby",
    description: "A playable Three.js city with a central skate park and four connected neighborhoods.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
