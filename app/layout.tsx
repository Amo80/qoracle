import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QoRacle",
  description: "Scan. Ask. Shake. Discover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}