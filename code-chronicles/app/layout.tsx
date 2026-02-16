import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AudioProvider } from "@/components/providers/AudioProvider";
import { GraphicsProvider } from "@/components/providers/GraphicsProvider";
import { GameProvider } from "@/components/providers/GameProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "Code Chronicles: Operation Lunar Drive",
  description: "Learn C programming and logic to pilot a moon rover.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          <AudioProvider>
            <GraphicsProvider>
              <GameProvider>
                {children}
              </GameProvider>
            </GraphicsProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
