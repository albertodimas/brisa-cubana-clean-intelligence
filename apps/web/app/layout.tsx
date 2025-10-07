import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brisa Cubana Clean Intelligence",
  description: "Sistema operativo real para operaciones de limpieza premium en Miami-Dade.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
