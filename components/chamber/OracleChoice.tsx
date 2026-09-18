"use client";

import Image from "next/image";
import type { OracleDefinition } from "@/lib/oracles/registry";

export function OracleChoice({
  oracle,
  selected,
  onSelect,
}: {
  oracle: OracleDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`chamber-oracle chamber-oracle--${oracle.id}${
        selected ? " is-selected" : ""
      }`}
      aria-label={`Explore the ${oracle.name} Oracle: ${oracle.description}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="chamber-oracle__aura" aria-hidden="true" />
      <span className="chamber-oracle__portrait" aria-hidden="true">
        <Image
          src={oracle.image}
          alt=""
          fill
          sizes="(min-width: 700px) 20vw, 50vw"
        />
      </span>
      <span className="chamber-oracle__copy">
        <strong>{oracle.name}</strong>
        <span>{oracle.description}</span>
      </span>
    </button>
  );
}
