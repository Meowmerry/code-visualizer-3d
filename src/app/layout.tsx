import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Visualizer 3D",
  description: "Visualize the structure of your code as an explorable 3D scene.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono">{children}</body>
    </html>
    
  );
}
