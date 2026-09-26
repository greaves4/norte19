import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
// tokens.css trae la fuente Manrope (@font-face con styles/fonts) y las variables del design system.
import "@/styles/tokens.css";

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
    <html lang="es-MX">
      <body className="antialiased">
        {children}
        {/* Arriba: abajo está la DemoBar. */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
