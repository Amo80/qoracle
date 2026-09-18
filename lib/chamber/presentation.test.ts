import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const chamberCss = readFileSync(
  join(process.cwd(), "app/styles/chamber.css"),
  "utf8"
);

describe("Oracle Chamber card presentation contract", () => {
  it("gives every Oracle the same full card frame", () => {
    expect(chamberCss).toMatch(
      /\.chamber-oracle \{[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?box-sizing: border-box;[\s\S]*?grid-template-rows: auto 1fr;/
    );
  });

  it("scales Dragon artwork inside the shared frame without changing its card dimensions", () => {
    expect(chamberCss).toMatch(
      /\.chamber-oracle--dnd \.chamber-oracle__portrait img \{[\s\S]*?object-position: center;[\s\S]*?transform: scale\(1\.16\);/
    );
  });
});
