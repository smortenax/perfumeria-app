/** A diluent's name on its chip (audit F-09 L2): «DPG (dipropylene glycol)» reads «DPG»; the whole name stays its label. */
export function chipName(name: string): string {
  const short = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return short || name;
}

/** Up to this many, the diluents are chips; past it, a select, so a long list does not fill the window. */
export const CHIPS_UP_TO = 12;
