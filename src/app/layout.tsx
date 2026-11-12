import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { DjSetProvider } from "@/context/DjSetContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CartProvider } from "@/context/CartContext";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { MusicPlayer } from "@/components/player/MusicPlayer";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { LoginModal } from "@/components/auth/LoginModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Figma Website F/G 시안 — 한글 Noto Sans KR + 영문 Archivo */
const fSans = Noto_Sans_KR({
  variable: "--font-f-sans",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const fDisplay = Archivo({
  variable: "--font-f-display",
  weight: ["500", "700"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fSans.variable} ${fDisplay.variable} antialiased`}
      >
        <CurrencyProvider>
          <CartProvider>
            <LoginModalProvider>
              <PlayerProvider>
                <DjSetProvider>
                  {children}
                  <MusicPlayer />
                  <CartDrawer />
                  <LoginModal />
                </DjSetProvider>
              </PlayerProvider>
            </LoginModalProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
