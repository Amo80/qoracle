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
import {
  isChaos3DEnabled,
  isDragon3DEnabled,
  isEclipse3DEnabled,
  isJester3DEnabled,
  isLove3DEnabled,
  isLivingOracleEnabled,
} from "@/lib/experience/featureFlags";

export const metadata: Metadata = {
  title: "The QRystal Balls",
  description: "Scan. Ask. Shake. Discover.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const livingOracleEnabled = isLivingOracleEnabled();
  const jester3DEnabled = isJester3DEnabled();
  const love3DEnabled = isLove3DEnabled();
  const dragon3DEnabled = isDragon3DEnabled();
  const chaos3DEnabled = isChaos3DEnabled();
  const eclipse3DEnabled = isEclipse3DEnabled();

  return (
    <html lang="en">
      <body>
        <ExperiencePreferencesProvider>
          {children}
          {livingOracleEnabled ? (
            <LivingOracleLayer
              jester3DEnabled={jester3DEnabled}
              love3DEnabled={love3DEnabled}
              dragon3DEnabled={dragon3DEnabled}
              chaos3DEnabled={chaos3DEnabled}
              eclipse3DEnabled={eclipse3DEnabled}
            />
          ) : null}
          <SiteFooter />
        </ExperiencePreferencesProvider>
      </body>
    </html>
  );
}
