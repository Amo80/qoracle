import "./styles/tokens.css";
import "./styles/primitives.css";
import "./globals.css";
import "./styles/accessibility.css";
import "./styles/errors.css";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { ExperiencePreferencesProvider } from "@/components/experience/ExperiencePreferences";

export const metadata: Metadata = {
  title: "The QRystal Balls",
  description: "Scan. Ask. Shake. Discover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ExperiencePreferencesProvider>
          {children}
          <SiteFooter />
        </ExperiencePreferencesProvider>
      </body>
    </html>
  );
}
