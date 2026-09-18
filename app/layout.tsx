import "./styles/tokens.css";
import "./styles/primitives.css";
import "./globals.css";
import "./styles/accessibility.css";
import "./styles/errors.css";
import "./styles/chamber.css";
import "./styles/living-oracle.css";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { ExperiencePreferencesProvider } from "@/components/experience/ExperiencePreferences";
import { LivingOracleLayer } from "@/components/living-oracle/LivingOracleLayer";
import { isLivingOracleEnabled } from "@/lib/experience/featureFlags";

export const metadata: Metadata = {
  title: "The QRystal Balls",
  description: "Scan. Ask. Shake. Discover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const livingOracleEnabled = isLivingOracleEnabled();

  return (
    <html lang="en">
      <body>
        <ExperiencePreferencesProvider>
          {children}
          {livingOracleEnabled ? <LivingOracleLayer /> : null}
          <SiteFooter />
        </ExperiencePreferencesProvider>
      </body>
    </html>
  );
}
