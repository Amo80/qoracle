"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useExperiencePreferences } from "@/components/experience/ExperiencePreferences";
import { ORACLES, getOracle } from "@/lib/oracles/registry";
import {
  INITIAL_CHAMBER_STATE,
  chamberReducer,
  getChamberTransitionDelay,
} from "@/lib/chamber/machine";
import { OracleChoice } from "./OracleChoice";

export function OracleChamber() {
  const router = useRouter();
  const { motion } = useExperiencePreferences();
  const [state, dispatch] = useReducer(chamberReducer, INITIAL_CHAMBER_STATE);
  const chamberHeadingRef = useRef<HTMLHeadingElement>(null);
  const selected = useMemo(
    () => (state.selectedOracle ? getOracle(state.selectedOracle) : null),
    [state.selectedOracle]
  );

  useEffect(() => {
    if (state.stage === "chamber") chamberHeadingRef.current?.focus();
  }, [state.stage]);

  useEffect(() => {
    if (state.stage !== "focused") return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "BACK" });
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [state.stage]);

  useEffect(() => {
    if (state.stage !== "transitioning" || !selected) return;

    const timeout = window.setTimeout(() => {
      router.push(selected.oraclePath);
    }, getChamberTransitionDelay(motion));

    return () => window.clearTimeout(timeout);
  }, [motion, router, selected, state.stage]);

  if (state.stage === "entrance") {
    return (
      <main className="chamber-experience chamber-experience--entrance">
        <div className="chamber-sky" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <section className="chamber-gate" aria-labelledby="chamber-gate-title">
          <p className="chamber-kicker">THE VEIL IS OPEN</p>
          <div className="chamber-sigil" aria-hidden="true">
            <span>✦</span>
          </div>
          <h1 id="chamber-gate-title">
            THE <span>QRYSTAL BALLS</span>
          </h1>
          <p className="chamber-gate__promise">
            Five Oracles wait beyond the threshold.
            <br />
            One question may change everything.
          </p>
          <button
            type="button"
            className="chamber-enter"
            onClick={() => dispatch({ type: "ENTER" })}
          >
            <span>ENTER THE ORACLE CHAMBER</span>
            <b aria-hidden="true">⌄</b>
          </button>
          <nav className="chamber-quick-links" aria-label="Other destinations">
            <Link href="/shop">Shop</Link>
            <Link href="/tarot">Tarot</Link>
            <Link href="/?classic=1">Classic homepage</Link>
          </nav>
        </section>
      </main>
    );
  }

  if (state.stage === "transitioning" && selected) {
    return (
      <main
        className={`chamber-experience chamber-transition chamber-transition--${selected.id}`}
        aria-live="assertive"
        aria-busy="true"
      >
        <div className="chamber-transition__ring" aria-hidden="true" />
        <Image
          src={selected.image}
          alt=""
          aria-hidden="true"
          width={320}
          height={320}
          priority
        />
        <p>The {selected.name} Oracle is listening</p>
        <h1>ENTERING THE CHAMBER</h1>
      </main>
    );
  }

  return (
    <main
      className={`chamber-experience chamber-experience--selection${
        selected ? ` chamber-has-selection chamber-selected--${selected.id}` : ""
      }`}
    >
      <div className="chamber-sky" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <header className="chamber-header">
        <Link href="/?classic=1" className="chamber-classic-link">
          Classic homepage
        </Link>
        <p className="chamber-kicker">THE ORACLE CHAMBER</p>
        <h1 ref={chamberHeadingRef} tabIndex={-1}>
          CHOOSE YOUR <span>ORACLE</span>
        </h1>
        <p>Five voices. Five worlds. The question belongs to you.</p>
      </header>

      <section className="chamber-oracles" aria-label="Choose an Oracle">
        {ORACLES.map((oracle) => (
          <OracleChoice
            key={oracle.id}
            oracle={oracle}
            selected={state.selectedOracle === oracle.id}
            onSelect={() => dispatch({ type: "FOCUS", oracle: oracle.id })}
          />
        ))}
      </section>

      <section className="chamber-invitation" aria-live="polite">
        {selected ? (
          <>
            <p className="chamber-invitation__label">YOU HAVE CALLED</p>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <div className="chamber-invitation__actions">
              <button
                type="button"
                className="chamber-awaken"
                onClick={() => dispatch({ type: "ACTIVATE" })}
              >
                ENTER {selected.name}&apos;S CHAMBER
              </button>
              <button
                type="button"
                className="chamber-reconsider"
                onClick={() => dispatch({ type: "BACK" })}
              >
                Choose another
              </button>
            </div>
          </>
        ) : (
          <p>Choose a presence to cross the threshold.</p>
        )}
      </section>

      <nav className="chamber-footer-links" aria-label="Other destinations">
        <Link href="/shop">Visit the Shop</Link>
        <Link href="/tarot">Enter Tarot</Link>
      </nav>
    </main>
  );
}
