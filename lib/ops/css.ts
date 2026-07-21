import type { CSSProperties } from "react";

/**
 * Parse a CSS declaration string (e.g. "background:var(--red); color:#fff;")
 * into a React style object. The prototype's store returns dynamic styling as
 * these strings (status pills, gradients, progress-bar widths, active states),
 * so this lets us port every `xxxStyle` value verbatim.
 *
 * Static/structural styling lives in the co-located *.module.css files.
 */
export function css(input?: string | null): CSSProperties {
  if (!input) return {};
  const out: Record<string, string> = {};
  for (const decl of input.split(";")) {
    const i = decl.indexOf(":");
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;
    if (prop.startsWith("--")) {
      out[prop] = value; // CSS custom property — keep as-is
    } else {
      const key = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      out[key] = value;
    }
  }
  return out as CSSProperties;
}

/** Merge a parsed style string on top of a base style object. */
export function withCss(base: CSSProperties, input?: string | null): CSSProperties {
  return { ...base, ...css(input) };
}
