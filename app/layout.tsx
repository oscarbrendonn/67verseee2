import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://eggnova-three-editor.tilkisarp.chatgpt.site"),
  title: "EggNova — Bulut Parkuru",
  description: "Three.js ile çalışan oynanabilir 3D parkur oyunu ve görsel dünya editörü.",
  openGraph: {
    title: "EggNova — Bulut Parkuru",
    description: "Hareketli adaları geç, yıldızları topla ve final kapısına ulaş.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "EggNova — Bulut Parkuru",
    description: "Three.js ile çalışan oynanabilir 3D parkur oyunu.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
