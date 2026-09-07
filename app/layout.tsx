import "./globals.css";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "The QRystal Balls",
  description: "Scan. Ask. Shake. Discover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}