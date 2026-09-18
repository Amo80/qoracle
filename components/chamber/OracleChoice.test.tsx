import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getOracle } from "../../lib/oracles/registry";
import { OracleChoice } from "./OracleChoice";

describe("OracleChoice accessibility contract", () => {
  it("renders a semantic button with an informative accessible name", () => {
    const markup = renderToStaticMarkup(
      <OracleChoice
        oracle={getOracle("jester")}
        selected={false}
        onSelect={vi.fn()}
      />
    );

    expect(markup).toContain("<button");
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain(
      'aria-label="Explore the JESTER Oracle: Mischief &amp; Mayhem"'
    );
    expect(markup).toContain('alt=""');
  });

  it("announces the selected state", () => {
    const markup = renderToStaticMarkup(
      <OracleChoice
        oracle={getOracle("dnd")}
        selected
        onSelect={vi.fn()}
      />
    );

    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("DRAGON");
  });
});
