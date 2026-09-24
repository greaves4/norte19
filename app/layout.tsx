import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import "@/styles/tokens.css";

// TODO tokens: fuente del design system (Manrope) — se conecta en el prompt B8
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Norte 19 · Prototipos",
  description: "Prototipos navegables para validación con usuarios de Norte 19",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        {/* Arriba: abajo está la DemoBar. */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
