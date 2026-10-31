/** The lines a «Explain» shows: those there are, each once, in their order; a title joined by new lines comes apart. */
export function explainLines(lines: ReadonlyArray<string | null | undefined | false>): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    for (const part of line.split("\n")) {
      const text = part.trim();
      if (text && !out.includes(text)) out.push(text);
    }
  }
  return out;
}
