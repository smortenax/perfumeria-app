// Copied from designboard 3f221ae (src/core/variables.ts), runtime 1.15.
// Do not edit here: change designboard and run `npm run copy-runtime` again.
/**
 * Prototype variables, as Figma's: named values a prototype keeps while it is played (which tab
 * is chosen, whether a panel is open, how many items there are). A connection can set one
 * (`Connection.set`) and can depend on one (`Connection.when`, with `else` for the other case); a
 * layer can show only while a condition holds (`showWhen`), and a component's param can take a
 * variable's value (`bind`).
 *
 * The file keeps each variable's starting value. The values while playing live in the runtime
 * (`runtime/variables.tsx`), never in the file. Nothing here knows about layers, so the same
 * functions serve the board, the runtime and tests.
 */

export type VariableType = "boolean" | "number" | "text";
export const VARIABLE_TYPES: readonly VariableType[] = ["boolean", "number", "text"];
export type VarValue = boolean | number | string;

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  /** The value it starts with each time the prototype is played. */
  value: VarValue;
}

/** How a condition compares a variable with its value. Greater and less only read numbers. */
export type Comparison = "eq" | "ne" | "gt" | "lt" | "gte" | "lte";
export const COMPARISONS: readonly Comparison[] = ["eq", "ne", "gt", "lt", "gte", "lte"];
/** The comparisons a type can take: order only means something for numbers. */
export const comparisonsFor = (t: VariableType): readonly Comparison[] => (t === "number" ? COMPARISONS : ["eq", "ne"]);

export interface Condition {
  /** Id of the variable. */
  variable: string;
  is: Comparison;
  value: VarValue;
}

/** What a "set variable" action does: give it a value, flip a boolean, or add to a number. */
export type SetOp = "set" | "toggle" | "add";
export interface SetVariable {
  variable: string;
  op: SetOp;
  /** For set and add. */
  value?: VarValue;
}
/** The operations a type can take. */
export const opsFor = (t: VariableType): readonly SetOp[] => (t === "boolean" ? ["set", "toggle"] : t === "number" ? ["set", "add"] : ["set"]);

export type Values = Readonly<Record<string, VarValue>>;

export const defaultValue = (t: VariableType): VarValue => (t === "boolean" ? false : t === "number" ? 0 : "");

/** A value as its type wants it, or undefined when it cannot be read as one. */
export function asType(t: VariableType, v: unknown): VarValue | undefined {
  if (t === "boolean") return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : undefined;
  if (t === "number") {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  }
  return typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : undefined;
}

/** A saved `variables` list cleaned up: unique ids, a name, a known type and a starting value of that type. */
export function checkVariables(raw: unknown): Variable[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const out = raw.flatMap((x): Variable[] => {
    const r = x as Partial<Variable> | null;
    const type = VARIABLE_TYPES.find((t) => t === r?.type);
    if (!r || typeof r.id !== "string" || !r.id || seen.has(r.id) || !type) return [];
    seen.add(r.id);
    return [{ id: r.id, name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : "variable", type, value: asType(type, r.value) ?? defaultValue(type) }];
  });
  return out.length ? out : undefined;
}

/** A saved condition cleaned up; undefined when it names no variable or has no usable value. */
export function checkCondition(raw: unknown): Condition | undefined {
  const r = raw as Partial<Condition> | null;
  if (!r || typeof r !== "object" || typeof r.variable !== "string" || !r.variable) return undefined;
  const value = r.value;
  if (typeof value !== "boolean" && typeof value !== "string" && !(typeof value === "number" && Number.isFinite(value))) return undefined;
  return { variable: r.variable, is: COMPARISONS.find((c) => c === r.is) ?? "eq", value };
}

/** A saved "set variable" cleaned up. */
export function checkSet(raw: unknown): SetVariable | undefined {
  const r = raw as Partial<SetVariable> | null;
  if (!r || typeof r !== "object" || typeof r.variable !== "string" || !r.variable) return undefined;
  const op = (["set", "toggle", "add"] as const).find((o) => o === r.op) ?? "set";
  if (op === "toggle") return { variable: r.variable, op };
  const value = r.value;
  if (op === "add") return typeof value === "number" && Number.isFinite(value) ? { variable: r.variable, op, value } : undefined;
  if (typeof value !== "boolean" && typeof value !== "string" && !(typeof value === "number" && Number.isFinite(value))) return undefined;
  return { variable: r.variable, op, value };
}

/** The values a prototype starts with. */
export function initialValues(vars: readonly Variable[] | undefined): Record<string, VarValue> {
  return Object.fromEntries((vars ?? []).map((v) => [v.id, v.value]));
}

/** A variable's value now: the one set while playing, else its starting one; undefined when the file has no such variable. */
export function valueOf(vars: readonly Variable[] | undefined, values: Values, id: string): VarValue | undefined {
  const v = vars?.find((x) => x.id === id);
  if (!v) return undefined;
  return asType(v.type, values[id]) ?? v.value;
}

/**
 * Does the condition hold? One that names a variable the file no longer has holds, so deleting
 * a variable never hides a layer or silences a connection.
 */
export function holds(vars: readonly Variable[] | undefined, values: Values, c: Condition | undefined): boolean {
  if (!c) return true;
  const v = vars?.find((x) => x.id === c.variable);
  if (!v) return true;
  const now = valueOf(vars, values, c.variable)!;
  const want = asType(v.type, c.value);
  if (want === undefined) return c.is === "ne";
  switch (c.is) {
    case "eq":
      return now === want;
    case "ne":
      return now !== want;
    case "gt":
      return typeof now === "number" && typeof want === "number" && now > want;
    case "lt":
      return typeof now === "number" && typeof want === "number" && now < want;
    case "gte":
      return typeof now === "number" && typeof want === "number" && now >= want;
    case "lte":
      return typeof now === "number" && typeof want === "number" && now <= want;
  }
}

/** The values after a "set variable" runs. An operation the variable's type cannot take changes nothing. */
export function applySet(vars: readonly Variable[] | undefined, values: Values, s: SetVariable): Values {
  const v = vars?.find((x) => x.id === s.variable);
  if (!v || !opsFor(v.type).includes(s.op)) return values;
  const now = valueOf(vars, values, v.id)!;
  let next: VarValue | undefined;
  if (s.op === "toggle") next = !now;
  else if (s.op === "add") next = typeof s.value === "number" ? (now as number) + s.value : undefined;
  else next = asType(v.type, s.value);
  return next === undefined || next === now ? values : { ...values, [v.id]: next };
}

/** How many `else` branches a connection may chain: an if, and else-ifs after it. */
export const MAX_BRANCHES = 4;

/**
 * The branch of a conditional that runs now: the connection itself while its condition holds
 * (or it has none), else its `else`, checked the same way; null when no branch runs.
 */
export function branchOf<T extends { when?: Condition; else?: T }>(c: T, vars: readonly Variable[] | undefined, values: Values): T | null {
  let at: T | undefined = c;
  for (let i = 0; at && i <= MAX_BRANCHES; i++) {
    if (holds(vars, values, at.when)) return at;
    at = at.else;
  }
  return null;
}

/**
 * A param's value from the variable it is bound to, when the variable's value fits the param:
 * text takes text and numbers, a switch a boolean, a number a number, and a choice (a variant
 * too) a text that is one of its options. Otherwise undefined, and the layer's own value shows.
 */
export function boundValue(kind: string, options: readonly string[] | undefined, v: VarValue | undefined): VarValue | undefined {
  if (v === undefined) return undefined;
  if (kind === "text") return typeof v === "boolean" ? undefined : String(v);
  if (kind === "boolean") return typeof v === "boolean" ? v : undefined;
  if (kind === "number") return typeof v === "number" ? v : undefined;
  if (kind === "select") return typeof v === "string" && !!options?.includes(v) ? v : undefined;
  return undefined;
}

/** The variable types a param of this kind can be bound to. */
export function bindableTypes(kind: string): readonly VariableType[] {
  if (kind === "text") return ["text", "number"];
  if (kind === "boolean") return ["boolean"];
  if (kind === "number") return ["number"];
  if (kind === "select") return ["text"];
  return [];
}
