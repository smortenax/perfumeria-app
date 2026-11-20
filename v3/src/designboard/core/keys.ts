// Copied from designboard 3f221ae (src/core/keys.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * Key triggers with modifiers, as Figma's ("a trigger can be a single key or button, or a
 * combination of keys"). A trigger's key is stored as text: the modifiers in a fixed order and the
 * key last, joined with "+": "Enter", "k", "Shift+k", "Ctrl+Alt+ArrowRight". Ctrl stands for Cmd
 * on a Mac too, as in the board's own shortcuts. A key stored before modifiers existed ("k") is
 * the key alone, as it always was.
 */

export interface KeyPress {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

interface Combo {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

const MODIFIER_KEYS = new Set(["Control", "Meta", "Alt", "Shift", "AltGraph", "CapsLock", "OS"]);

/** Whether the key pressed is only a modifier, which is never a trigger on its own. */
export const isModifierOnly = (e: Pick<KeyPress, "key">): boolean => MODIFIER_KEYS.has(e.key);

/**
 * The key itself. With Ctrl or Alt held, a letter or a digit is read from the key's place on the
 * keyboard (`code`), since Alt changes the character a Mac types (Alt+K gives "˚"). A letter is
 * stored in lower case.
 */
function baseKey(e: KeyPress): string {
  if ((e.ctrlKey || e.metaKey || e.altKey) && e.code) {
    const m = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(e.code);
    if (m) return (m[1] ?? m[2]).toLowerCase();
  }
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

/** A letter or a named key (Enter, ArrowRight): Shift is part of the combination. Other characters ("?", "!") already carry it. */
const shiftCounts = (key: string): boolean => key.length > 1 || /^\p{L}$/u.test(key);

/** The stored text for a key press: "Ctrl+Shift+k". */
export function comboOf(e: KeyPress): string {
  const key = baseKey(e);
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey && shiftCounts(key)) parts.push("Shift");
  return [...parts, key].join("+");
}

/** Reads a stored key. The last part is the key, so "+" itself ("Ctrl++") still reads. */
function parse(stored: string): Combo {
  const parts = stored.split("+");
  let key = parts.pop() ?? "";
  if (key === "" && stored.endsWith("+")) {
    key = "+";
    if (parts[parts.length - 1] === "") parts.pop();
  }
  const mods = new Set(parts);
  return { ctrl: mods.has("Ctrl"), alt: mods.has("Alt"), shift: mods.has("Shift"), key };
}

/** Whether a stored key is one the board can keep: a key, modifiers it knows, and never Esc, which closes overlays and leaves the player. */
export function validCombo(stored: unknown): stored is string {
  if (typeof stored !== "string" || !stored || stored.length > 30) return false;
  const parts = stored.split("+");
  const c = parse(stored);
  const mods = stored.endsWith("+") ? parts.slice(0, -2) : parts.slice(0, -1);
  return !!c.key && c.key !== "Escape" && mods.every((m) => m === "Ctrl" || m === "Alt" || m === "Shift");
}

/**
 * Whether a key press is the stored key. Ctrl and Alt must be as stored. Shift must be held when
 * stored; when it is not stored it does not matter, so an older "k" still answers Shift+K.
 */
export function keyMatches(e: KeyPress, stored: string): boolean {
  const c = parse(stored);
  if (c.ctrl !== (e.ctrlKey || e.metaKey) || c.alt !== e.altKey) return false;
  if (c.shift && !e.shiftKey) return false;
  const key = baseKey(e);
  return key === c.key || (key.length === 1 && c.key.length === 1 && key.toLowerCase() === c.key.toLowerCase());
}

const NAMES: Record<string, string> = { " ": "Espacio", Enter: "Intro", Escape: "Esc", ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓", Tab: "Tab", Backspace: "Retroceso", Delete: "Supr" };

/** How a stored key reads in the interface: "Ctrl+Mayús+K". */
export function comboLabel(stored: string): string {
  const c = parse(stored);
  const parts: string[] = [];
  if (c.ctrl) parts.push("Ctrl");
  if (c.alt) parts.push("Alt");
  if (c.shift) parts.push("Mayús");
  parts.push(NAMES[c.key] ?? (c.key.length === 1 ? c.key.toUpperCase() : c.key));
  return parts.join("+");
}
