import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peliculita",
  description: "Recomendador determinista de películas y series por mood/situación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-peli-bg text-gray-100 antialiased">{children}</body>
    </html>
  );
}
