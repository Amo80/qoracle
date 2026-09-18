import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const chamberCss = readFileSync(
  join(process.cwd(), "app/styles/chamber.css"),
  "utf8"
);

describe("Oracle Chamber card presentation contract", () => {
  it("gives all five Oracles equal desktop grid columns and full card frames", () => {
    expect(chamberCss).toMatch(
      /@media \(min-width: 700px\) \{[\s\S]*?\.chamber-oracles \{[\s\S]*?grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/
    );
    expect(chamberCss).toMatch(
      /\.chamber-oracle \{[\s\S]*?width: 100%;[\s\S]*?height: 100%;[\s\S]*?box-sizing: border-box;[\s\S]*?grid-template-rows: auto 1fr;/
    );
  });

  it("centers the odd fifth card only in the two-column responsive layout", () => {
    expect(chamberCss).toMatch(
      /@media \(max-width: 699px\) \{\s*\.chamber-oracle:last-child:nth-child\(odd\) \{[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?justify-self: center;[\s\S]*?\}\s*\}/
    );

    const desktopLayout = chamberCss.match(
      /@media \(min-width: 700px\) \{([\s\S]*?)\n\}/
    )?.[1];

    expect(desktopLayout).toBeDefined();
    expect(desktopLayout).not.toContain(
      ".chamber-oracle:last-child:nth-child(odd)"
    );
  });

  it("scales Dragon artwork inside the shared frame without changing its card dimensions", () => {
    expect(chamberCss).toMatch(
      /\.chamber-oracle--dnd \.chamber-oracle__portrait img \{[\s\S]*?object-position: center;[\s\S]*?transform: scale\(1\.16\);/
    );
  });
});
