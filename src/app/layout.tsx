import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { MusicPlayer } from "@/components/player/MusicPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KoreaHarlem — 종합 예술 플랫폼",
  description:
    "음악, 시각 예술, 공연, 문학을 아우르는 한국-할렘 문화 교류 허브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PlayerProvider>
          {children}
          <MusicPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
