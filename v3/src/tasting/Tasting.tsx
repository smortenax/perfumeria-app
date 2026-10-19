import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Ratio } from "../core/arith/ratio";
import type { LocalDatabase } from "../db/local/database";
import {
  addStrip, closeStrip, setStripBottle, createSession, deleteSession, endSession, ensureMoment, type MomentFields, removeStrip, revealStrip, saveClosure, setBattery,
  setCurve, setFamily, setMark, type TastingClosure, type TastingMoment, type Tastings, type TastingStrip, updateMoment, writeOpening,
} from "../db/tastings";
import { bottleText } from "../dilution/Dilutions";
import { percent } from "../glossary/format";
import type { GlossaryData } from "../glossary/useGlossary";
import { texts } from "../i18n/es";
import { blockState, buildQueue, tastable, changedBlocks, countdown, dueMoments, latestDilution, legacyTasted, nextWaiting, tenacity } from "./logic";
import { tasteMaterial } from "./start";
import { useNow } from "./useTastings";
import {
  BATTERY_AXES, BATTERY_STATES, BIASES, type Block, COMPLEXITY, CURVE_LEVELS, CURVE_SEGMENTS, DECAY, DEFAULT_MOMENTS, EFFECT_ENERGY, EFFECT_RICHNESS,
  FAMILY_CODES, FAMILY_SCHEMES, INTENSITY_MAX, INTENSITY_MIN, type Moment, MOMENTS, PUFF, R1, R2, R3, ROLES, THING_OR_PLACE, VERSATILITY,
} from "./vocabulary";
import "./tasting.css";

const t = texts.tasting;
export const TABS = ["session", "queue", "history", "legacy"] as const;
export type Tab = (typeof TABS)[number];

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
const dilutionText = (s: Pick<TastingStrip, "fraction" | "solvent">) =>
  s.fraction?.eq(Ratio.ONE) && !s.solvent ? t.pure : s.fraction ? t.dilutionOf(percent(s.fraction, 4), s.solvent) : (s.solvent ?? t.unknownDilution);

/** A strip's bottle, as a choice: «» none yet, «pure», or the id of one of your bottles. */
const bottleKey = (b: { dilutionId: string | null; pure: boolean }) => (b.pure ? "pure" : (b.dilutionId ?? ""));
const bottleOfKey = (key: string) => ({ dilutionId: key && key !== "pure" ? key : null, pure: key === "pure" });

/** The bottle of a strip (V3-66, V3-67): one of your bottles of the material, not archived, or pure. */
function BottleSelect({ data, materialId, value, onChange }: { data: GlossaryData; materialId: string; value: string; onChange: (key: string) => void }) {
  const bottles = (data.catalog.dilutions.get(materialId) ?? []).filter((d) => !d.archivedAt || d.id === value);
  return (
    <label className="field">
      {t.dilution}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          {t.chooseBottle}
        </option>
        <option value="pure">{t.pure}</option>
        {bottles.map((d) => (
          <option key={d.id} value={d.id}>
            {bottleText(data, d)}
            {d.madeOn ? ` · ${d.madeOn}` : ""}
          </option>
        ))}
      </select>
      {bottles.length === 0 && <small className="hint">{t.noBottles}</small>}
    </label>
  );
}
/** A tenacity in hours (V3-42), shown in minutes under an hour: «al menos 25 min», «1,5 h». */
const hoursText = (h: Ratio) => (h.lt(Ratio.ONE) ? `${h.mul(Ratio.of(60n)).toFixed(0)} min` : `${h.toFixed(1).replace(".", ",")} h`);
const nameOf = (data: GlossaryData, id: string) => data.catalog.materials.get(id)?.name ?? "—";

/** The moments a strip shows: the default ones, and t15 once written. */
const shownMoments = (moments: readonly TastingMoment[], stripId: string, extra: readonly Moment[]): Moment[] => {
  const written = new Set(moments.filter((m) => m.stripId === stripId).map((m) => m.moment));
  return MOMENTS.filter((m) => DEFAULT_MOMENTS.includes(m) || written.has(m) || extra.includes(m));
};

/**
 * «Catas» (V3-60 to V3-63): a session with up to four strips, each with its tabs by time and its
 * timer; the closing and the comparison; the queue of your materials not tasted yet; the lab's
 * sheets, read only. Stays mounted while you are elsewhere, so that the notices still come.
 */
export function Tasting({
  data,
  local,
  tastings,
  visible,
  tab,
  stripId,
  onTab,
  onOpenStrip,
  onBack,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  tastings: Tastings;
  visible: boolean;
  /** Where «Catas» is, from the address (App.tsx): its tab, or one strip open. */
  tab: Tab;
  stripId: string | null;
  onTab: (tab: Tab) => void;
  onOpenStrip: (id: string) => void;
  onBack: () => void;
}) {
  const setTab = onTab;
  const setStripId = onOpenStrip;
  const fail = (e: unknown) => window.alert(t.failed(e instanceof Error ? e.message : String(e)));
  const run = (p: Promise<unknown>) => void p.catch(fail);
  const open = tastings.sessions.find((s) => !s.endedAt) ?? null;
  const openStrips = open ? tastings.strips.filter((s) => s.sessionId === open.id) : [];
  const now = useNow(openStrips.length > 0);
  const notices = useDueNotices(openStrips, tastings.moments, now);

  const addToSession = async (materialId: string) => {
    await tasteMaterial(data, local, tastings, materialId);
    setTab("session");
  };

  const strip = stripId ? tastings.strips.find((s) => s.id === stripId) : undefined;
  return (
    <section className="tasting" hidden={!visible}>
      {notices.length > 0 && (
        <div className="tasting-notices" role="status">
          {notices.map((n) => (
            <button key={n.key} type="button" className="tasting-notice" onClick={() => setStripId(n.stripId)}>
              {t.dueNow(n.label, t.moments[n.moment])}
            </button>
          ))}
        </div>
      )}
      {strip ? (
        <StripView data={data} local={local} tastings={tastings} strip={strip} now={now} onBack={onBack} run={run} />
      ) : (
        <>
          <div className="title-bar">
            <h2>{t.title}</h2>
          </div>
          <div className="tabs" role="tablist" aria-label={t.title}>
            {TABS.map((x) => (
              <button key={x} type="button" role="tab" className="tab" aria-selected={tab === x} onClick={() => setTab(x)}>
                {t.tabs[x]}
              </button>
            ))}
          </div>
          <div className="tab-panel" role="tabpanel">
            {tab === "session" && (
              <SessionView data={data} local={local} tastings={tastings} now={now} onOpenStrip={setStripId} run={run} />
            )}
            {tab === "queue" && <QueueView data={data} local={local} tastings={tastings} onAdd={(id) => run(addToSession(id))} run={run} />}
            {tab === "history" && <HistoryView data={data} tastings={tastings} onOpenStrip={setStripId} />}
            {tab === "legacy" && <LegacyView data={data} />}
          </div>
        </>
      )}
    </section>
  );
}

/** The notices of the timers (V3-63): in the app, and from the browser if you allowed it, while the app is open. */
function useDueNotices(strips: readonly TastingStrip[], moments: readonly TastingMoment[], now: number) {
  const seen = useRef<Set<string> | null>(null);
  const due = strips.flatMap((s) => {
    const written = moments.filter((m) => m.stripId === s.id).map((m) => m.moment);
    if (!written.includes("t0")) return [];
    return dueMoments(s, written, DEFAULT_MOMENTS.filter((m) => m !== "t0"), now)
      .filter((d) => d.state === "due")
      .map((d) => ({ key: `${s.id}:${d.moment}`, stripId: s.id, label: s.blindLabel, moment: d.moment }));
  });
  useEffect(() => {
    // What is already due when the app opens is shown, not announced again.
    if (seen.current === null) {
      seen.current = new Set(due.map((d) => d.key));
      return;
    }
    for (const d of due) {
      if (seen.current.has(d.key)) continue;
      seen.current.add(d.key);
      navigator.vibrate?.(200);
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(t.dueNow(d.label, t.moments[d.moment]));
        } catch {
          // Some browsers allow notices only from a service worker: the banner is enough.
        }
      }
    }
  });
  return due;
}

function SessionView({
  data,
  local,
  tastings,
  now,
  onOpenStrip,
  run,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  tastings: Tastings;
  now: number;
  onOpenStrip: (id: string) => void;
  run: (p: Promise<unknown>) => void;
}) {
  const open = tastings.sessions.find((s) => !s.endedAt) ?? null;
  const [adding, setAdding] = useState(false);
  const [permission, setPermission] = useState(() => ("Notification" in window ? Notification.permission : "denied"));
  if (!open) {
    return (
      <div className="tasting-empty">
        <p>{t.noSession}</p>
        <button type="button" className="primary" onClick={() => run(createSession(local.db, local.userId))}>
          {t.newSession}
        </button>
      </div>
    );
  }
  const strips = tastings.strips.filter((s) => s.sessionId === open.id);
  return (
    <div className="tasting-session">
      <p className="hint">{t.startedAt(when(open.startedAt))}</p>
      <ul className="strip-cards">
        {strips.map((s) => {
          const written = tastings.moments.filter((m) => m.stripId === s.id).map((m) => m.moment);
          const due = dueMoments(s, written, DEFAULT_MOMENTS, now);
          const next = nextWaiting(due);
          const dueNow = due.filter((d) => d.state === "due");
          return (
            <li key={s.id}>
              <button type="button" className="strip-card" onClick={() => onOpenStrip(s.id)}>
                <span className="strip-label">{s.blindLabel}</span>
                <span className="strip-body">
                  <span className="strip-name">{s.revealedAt ? nameOf(data, s.materialId) : t.hidden}</span>
                  <span className="strip-detail">
                    {dilutionText(s)} · {t.applied(when(s.appliedAt))}
                  </span>
                  <span className="strip-moments">
                    {due.map((d) => (
                      <span key={d.moment} className={`moment-dot ${d.state}`}>
                        {t.moments[d.moment]}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="strip-timer">
                  {!written.includes("t0") ? t.t0First : dueNow.length > 0 ? `${t.due} ${t.moments[dueNow[0].moment]}` : next ? `${t.moments[next.moment]} ${t.inTime(countdown(next.dueAt - now))}` : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {strips.length < 4 ? (
        adding ? (
          <AddStrip data={data} tastings={tastings} onCancel={() => setAdding(false)} onAdd={(input) => run(addStrip(local.db, local.userId, open.id, input).then(() => setAdding(false)))} />
        ) : (
          <button type="button" className="primary" onClick={() => setAdding(true)}>
            {t.addStrip}
          </button>
        )
      ) : (
        <p className="hint">{t.full}</p>
      )}
      <div className="tasting-actions">
        {permission !== "granted" && permission !== "denied" ? (
          <button type="button" onClick={() => void Notification.requestPermission().then(setPermission)}>
            {t.notice}
          </button>
        ) : (
          <span className="hint">{permission === "granted" ? t.noticeOn : t.noticeHint}</span>
        )}
        <button type="button" onClick={() => run(endSession(local.db, local.userId, open.id))}>
          {t.endSession}
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (window.confirm(t.deleteSessionAsk)) run(deleteSession(local.db, local.userId, open.id));
          }}
        >
          {t.deleteSession}
        </button>
      </div>
    </div>
  );
}

/** Adding a strip: a material of yours, its bottle and the dose. */
function AddStrip({
  data,
  tastings,
  onAdd,
  onCancel,
}: {
  data: GlossaryData;
  tastings: Tastings;
  onAdd: (input: { materialId: string; dilutionId: string | null; pure: boolean; dose: string }) => void;
  onCancel: () => void;
}) {
  const options = useMemo(() => {
    const queue = buildQueue(data.catalog, tastings);
    const pending = new Set(queue.groups.flatMap((g) => g.items.map((i) => i.materialId)));
    return [...data.catalog.materials.values()]
      .filter(tastable)
      .sort((a, b) => (pending.has(a.id) ? 0 : 1) - (pending.has(b.id) ? 0 : 1) || a.name.localeCompare(b.name, "es"));
  }, [data, tastings]);
  const [query, setQuery] = useState("");
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [bottle, setBottle] = useState("");
  const [dose, setDose] = useState<string>(t.doseHint);
  const shown = options.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 30);
  return (
    <div className="add-strip">
      <p className="hint">{t.addStripHint}</p>
      {materialId ? (
        <p>
          <strong>{nameOf(data, materialId)}</strong>{" "}
          <button type="button" className="link" onClick={() => setMaterialId(null)}>
            {t.cancel}
          </button>
        </p>
      ) : (
        <>
          <label className="field">
            {t.material}
            <input type="search" value={query} placeholder={t.pickMaterial} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="pick-list">
            {shown.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMaterialId(m.id);
                    setBottle(latestDilution(data.catalog.dilutions.get(m.id))?.id ?? "");
                  }}
                >
                  {m.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {materialId && (
        <>
          <BottleSelect data={data} materialId={materialId} value={bottle} onChange={setBottle} />
          <label className="field">
            {t.dose}
            <input value={dose} onChange={(e) => setDose(e.target.value)} />
          </label>
        </>
      )}
      <div className="tasting-actions">
        <button type="button" className="primary" disabled={!materialId} onClick={() => materialId && onAdd({ materialId, ...bottleOfKey(bottle), dose })}>
          {t.add}
        </button>
        <button type="button" onClick={onCancel}>
          {t.cancel}
        </button>
      </div>
    </div>
  );
}

function StripView({
  data,
  local,
  tastings,
  strip,
  now,
  onBack,
  run,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  tastings: Tastings;
  strip: TastingStrip;
  now: number;
  onBack: () => void;
  run: (p: Promise<unknown>) => void;
}) {
  const moments = tastings.moments.filter((m) => m.stripId === strip.id);
  const [extra, setExtra] = useState<Moment[]>([]);
  const shown = shownMoments(tastings.moments, strip.id, extra);
  const written = moments.map((m) => m.moment);
  const due = dueMoments(strip, written, shown, now);
  const first = due.find((d) => d.state === "due")?.moment ?? (written.includes("t0") ? (written.includes("t5") ? written[written.length - 1] : "t5") : "t0");
  const [tab, setTab] = useState<Moment | "closing">(first);
  const closure = tastings.closures.find((c) => c.stripId === strip.id);
  const ten = tenacity(strip, moments);
  const session = tastings.sessions.find((s) => s.id === strip.sessionId);
  return (
    <div className="strip-view">
      <div className="title-bar">
        <button type="button" className="link" onClick={onBack}>
          ← {t.back}
        </button>
        <h2>
          {t.strip(strip.blindLabel)} · {strip.revealedAt ? nameOf(data, strip.materialId) : t.hidden}
        </h2>
      </div>
      <p className="hint">
        {dilutionText(strip)}
        {strip.dose ? ` · ${strip.dose}` : ""} · {t.applied(when(strip.appliedAt))}
        {strip.closedAt ? ` · ${t.closed(when(strip.closedAt))}` : ""}
      </p>
      {/* Before it is smelled, its bottle can still be chosen or changed (V3-66). */}
      {moments.length === 0 && (
        <BottleSelect
          data={data}
          materialId={strip.materialId}
          value={bottleKey({ dilutionId: strip.dilutionId, pure: !strip.dilutionId && !!strip.fraction?.eq(Ratio.ONE) })}
          onChange={(key) => run(setStripBottle(local.db, local.userId, strip.id, bottleOfKey(key)))}
        />
      )}
      <div className="tabs moment-tabs" role="tablist">
        {due.map((d) => (
          <button key={d.moment} type="button" role="tab" className={`tab ${d.state}`} aria-selected={tab === d.moment} onClick={() => setTab(d.moment)}>
            {t.moments[d.moment]}
            {d.state === "waiting" && d.moment !== "t0" && <small> {countdown(d.dueAt - now)}</small>}
          </button>
        ))}
        <button type="button" role="tab" className="tab" aria-selected={tab === "closing"} onClick={() => setTab("closing")}>
          {t.closing}
        </button>
      </div>
      {!shown.includes("t15") && (
        <button type="button" className="link" onClick={() => setExtra(["t15"])}>
          {t.addT15}
        </button>
      )}
      <div className="tab-panel" role="tabpanel">
        {tab === "t0" ? (
          <Opening local={local} strip={strip} moment={moments.find((m) => m.moment === "t0")} run={run} />
        ) : tab === "closing" ? (
          <Closing local={local} strip={strip} closure={closure} tenacityText={ten ? t.tenacityHours(hoursText(ten.hours), ten.atLeast) : t.tenacityUnknown} run={run} />
        ) : !written.includes("t0") ? (
          <p className="hint">{t.t0First}</p>
        ) : (
          <MomentEditor key={`${strip.id}:${tab}`} local={local} strip={strip} moment={tab} row={moments.find((m) => m.moment === tab)} others={moments} run={run} />
        )}
      </div>
      {!strip.revealedAt && (
        <div className="tasting-actions">
          <button type="button" disabled={!written.includes("t5")} onClick={() => run(revealStrip(local.db, local.userId, strip.id))}>
            {t.reveal}
          </button>
          {!written.includes("t5") && <span className="hint">{t.revealNeedsT5}</span>}
        </div>
      )}
      {session && !session.endedAt && written.every((m) => m === "t0") && (
        <button type="button" className="link danger" onClick={() => run(removeStrip(local.db, local.userId, strip.id).then(onBack))}>
          {t.removeStrip}
        </button>
      )}
    </div>
  );
}

/** t0: the blind opening, written once (V3-61). */
function Opening({ local, strip, moment, run }: { local: LocalDatabase; strip: TastingStrip; moment: TastingMoment | undefined; run: (p: Promise<unknown>) => void }) {
  const [text, setText] = useState("");
  if (moment) {
    return (
      <div className="opening">
        <p className="hint">{t.t0Saved}</p>
        <blockquote>{moment.text}</blockquote>
      </div>
    );
  }
  return (
    <div className="opening">
      <p className="hint">{t.t0Hint}</p>
      <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} aria-label={t.momentTitle.t0} />
      <p className="hint">{t.dictateHint}</p>
      {strip.fraction === null && <p className="hint">{t.bottleFirst}</p>}
      <button type="button" className="primary" disabled={!text.trim() || strip.fraction === null} onClick={() => run(writeOpening(local.db, local.userId, strip.id, text))}>
        {t.t0Save}
      </button>
    </div>
  );
}

/** A text field saved when you leave it (the keyboard's dictation writes into it). */
function TextField({ label, hint, value, rows = 1, onSave }: { label: string; hint?: string; value: string | null; rows?: number; onSave: (v: string) => void }) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => setText(value ?? ""), [value]);
  const save = () => {
    if (text !== (value ?? "")) onSave(text);
  };
  return (
    <label className="field">
      {label}
      {rows > 1 ? (
        <textarea rows={rows} value={text} onChange={(e) => setText(e.target.value)} onBlur={save} />
      ) : (
        <input value={text} onChange={(e) => setText(e.target.value)} onBlur={save} />
      )}
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
}

/** One choice from a list, as buttons; the chosen one again clears it. */
function Choice<T extends string>({ label, options, labels, value, onChange }: { label: string; options: readonly T[]; labels: Record<T, string>; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      {options.map((o) => (
        <button key={o} type="button" className="chip" aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)}>
          {labels[o]}
        </button>
      ))}
    </fieldset>
  );
}

function BlockBox({ block, row, later, onReviewed, children }: { block: Block; row: TastingMoment | undefined; later: boolean; onReviewed: (on: boolean) => void; children: ReactNode }) {
  const state = blockState(row, block);
  return (
    <section className={`block block-${state}`}>
      <header>
        <h3>{t.blocks[block]}</h3>
        <span className="block-state">{t.blockState[state]}</span>
      </header>
      {children}
      {later && (
        <label className="reviewed">
          <input type="checkbox" checked={row?.reviewed.includes(block) ?? false} onChange={(e) => onReviewed(e.target.checked)} />
          {t.reviewed}
        </label>
      )}
    </section>
  );
}

/** A tab after the opening: t5, the whole breakdown; later, what changed, starting empty (V3-61). */
function MomentEditor({
  local,
  strip,
  moment,
  row,
  others,
  run,
}: {
  local: LocalDatabase;
  strip: TastingStrip;
  moment: Moment;
  row: TastingMoment | undefined;
  others: readonly TastingMoment[];
  run: (p: Promise<unknown>) => void;
}) {
  const later = moment !== "t5";
  const momentId = async () => row?.id ?? (await ensureMoment(local.db, local.userId, strip.id, moment));
  const update = (changes: Partial<MomentFields>) => run(momentId().then((id) => updateMoment(local.db, local.userId, id, changes)));
  const reviewed = (block: Block) => (on: boolean) => {
    const now = new Set(row?.reviewed ?? []);
    if (on) now.add(block);
    else now.delete(block);
    update({ reviewed: [...now] });
  };
  const [compareWith, setCompareWith] = useState<Moment | "">("");
  const blocks: Block[] = later
    ? ["description", "thing_or_place", "intensity", "curve", "synesthetic", "families", "battery"]
    : ["description", "thing_or_place", "intensity", "curve", "form", "synesthetic", "families", "battery"];
  const changed = compareWith ? changedBlocks(others.find((m) => m.moment === compareWith), row, blocks) : [];
  const has = (scheme: (typeof FAMILY_SCHEMES)[number], code: string) => row?.families.some((f) => f.scheme === scheme && f.code === code) ?? false;
  return (
    <div className="moment-editor">
      <h3 className="moment-title">{t.momentTitle[moment]}</h3>
      {later && <p className="hint">{t.laterHint}</p>}
      {later && (
        <label className="field compare">
          {t.compare}
          <select value={compareWith} onChange={(e) => setCompareWith(e.target.value as Moment | "")}>
            <option value="">{t.compareNone}</option>
            {others
              .filter((m) => m.moment !== moment && m.moment !== "t0")
              .map((m) => (
                <option key={m.moment} value={m.moment}>
                  {t.moments[m.moment]}
                </option>
              ))}
          </select>
          {compareWith && <small className="hint">{changed.length ? t.changed(changed.map((b) => t.blocks[b]).join(", ")) : t.unchanged}</small>}
        </label>
      )}
      <BlockBox block="description" row={row} later={later} onReviewed={reviewed("description")}>
        <TextField label={t.description} hint={t.dictateHint} rows={4} value={row?.text ?? null} onSave={(v) => update({ text: v })} />
      </BlockBox>
      <BlockBox block="thing_or_place" row={row} later={later} onReviewed={reviewed("thing_or_place")}>
        <Choice label={t.blocks.thing_or_place} options={THING_OR_PLACE} labels={t.thingOrPlace} value={row?.thingOrPlace ?? null} onChange={(v) => update({ thingOrPlace: v })} />
        <TextField label={t.thingOrPlaceText} value={row?.thingOrPlaceText ?? null} onSave={(v) => update({ thingOrPlaceText: v })} />
        {!later && <TextField label={t.ownField} value={row?.ownField ?? null} onSave={(v) => update({ ownField: v })} />}
      </BlockBox>
      <BlockBox block="intensity" row={row} later={later} onReviewed={reviewed("intensity")}>
        <label className="field intensity">
          {t.intensity}: <strong>{row?.intensity ? t.intensityLevels[row.intensity] : t.blockState.none}</strong>
          <input
            type="range"
            min={INTENSITY_MIN}
            max={INTENSITY_MAX}
            step={1}
            className={row?.intensity ? "" : "unset"}
            value={row?.intensity ?? 3}
            onChange={(e) => update({ intensity: Number(e.target.value) })}
            onPointerUp={(e) => {
              if (!row?.intensity) update({ intensity: Number(e.currentTarget.value) });
            }}
          />
          <span className="range-labels">
            <small>{t.intensityLevels[1]}</small>
            <small>{t.intensityLevels[5]}</small>
          </span>
        </label>
        <YesNo label={t.near} value={row?.nearDetectable ?? null} onChange={(v) => update({ nearDetectable: v })} />
        <YesNo label={t.far} value={row?.farDetectable ?? null} onChange={(v) => update({ farDetectable: v })} />
      </BlockBox>
      <BlockBox block="curve" row={row} later={later} onReviewed={reviewed("curve")}>
        <p className="hint">{t.curveHint}</p>
        <div className="curve" role="group" aria-label={t.blocks.curve}>
          {[...CURVE_LEVELS].reverse().map((level) => (
            <div key={level} className="curve-row">
              <span className="curve-level">{t.curveLevels[level]}</span>
              {CURVE_SEGMENTS.map((seg) => {
                const on = row?.curve.get(seg) === level;
                return (
                  <button
                    key={seg}
                    type="button"
                    className="curve-cell"
                    aria-pressed={on}
                    aria-label={`${t.segment(seg)} ${t.curveLevels[level]}`}
                    onClick={() => run(momentId().then((id) => setCurve(local.db, local.userId, id, seg, on ? null : level)))}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </BlockBox>
      {!later && (
        <BlockBox block="form" row={row} later={false} onReviewed={reviewed("form")}>
          <Choice label={t.complexityLabel} options={COMPLEXITY} labels={t.complexity} value={row?.complexity ?? null} onChange={(v) => update({ complexity: v })} />
          <TextField label={t.complexityNote} value={row?.complexityNote ?? null} onSave={(v) => update({ complexityNote: v })} />
          <Choice label={t.puffLabel} options={PUFF} labels={t.puff} value={row?.puff ?? null} onChange={(v) => update({ puff: v })} />
        </BlockBox>
      )}
      <BlockBox block="synesthetic" row={row} later={later} onReviewed={reviewed("synesthetic")}>
        {(["texture", "temperature", "shape", "color", "brightness"] as const).map((k) => (
          <TextField key={k} label={t.synesthetic[k][0]} hint={t.synesthetic[k][1]} value={row?.[k] ?? null} onSave={(v) => update({ [k]: v })} />
        ))}
      </BlockBox>
      <BlockBox block="families" row={row} later={later} onReviewed={reviewed("families")}>
        {FAMILY_SCHEMES.map((scheme) => (
          <details key={scheme} className="families" open={scheme !== "calkin" || (row?.families.some((f) => f.scheme === "calkin") ?? false)}>
            <summary>{t.families[scheme]}</summary>
            <div className="chips">
              {FAMILY_CODES[scheme].map((code) => (
                <button
                  key={code}
                  type="button"
                  className="chip"
                  aria-pressed={has(scheme, code)}
                  onClick={() => run(momentId().then((id) => setFamily(local.db, local.userId, id, scheme, code, !has(scheme, code))))}
                >
                  {(t[scheme] as Record<string, string>)[code]}
                </button>
              ))}
            </div>
          </details>
        ))}
      </BlockBox>
      <BlockBox block="battery" row={row} later={later} onReviewed={reviewed("battery")}>
        <p className="hint">{t.batteryHint}</p>
        <div className="battery">
          {BATTERY_AXES.map((axis) => (
            <div key={axis} className="battery-row">
              <span>{t.battery[axis]}</span>
              <span className="battery-states">
                {BATTERY_STATES.map((state) => (
                  <button
                    key={state}
                    type="button"
                    className="chip"
                    aria-pressed={(row?.battery.get(axis) ?? "nr") === state && (state !== "nr" || row?.battery.has(axis))}
                    onClick={() => run(momentId().then((id) => setBattery(local.db, local.userId, id, axis, state)))}
                  >
                    {t.batteryStates[state]}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      </BlockBox>
      <TextField label={t.revisedImage} rows={2} value={row?.revisedImage ?? null} onSave={(v) => update({ revisedImage: v })} />
      {!later && <TextField label={t.metaphor} rows={2} value={row?.metaphor ?? null} onSave={(v) => update({ metaphor: v })} />}
      <TextField label={t.notes} rows={2} value={row?.notes ?? null} onSave={(v) => update({ notes: v })} />
    </div>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      <button type="button" className="chip" aria-pressed={value === true} onClick={() => onChange(value === true ? null : true)}>
        {t.yes}
      </button>
      <button type="button" className="chip" aria-pressed={value === false} onClick={() => onChange(value === false ? null : false)}>
        {t.no}
      </button>
    </fieldset>
  );
}

/** What is answered once, at the end (V3-61); the comparison only with the series closed. */
function Closing({
  local,
  strip,
  closure,
  tenacityText,
  run,
}: {
  local: LocalDatabase;
  strip: TastingStrip;
  closure: TastingClosure | undefined;
  tenacityText: string;
  run: (p: Promise<unknown>) => void;
}) {
  const save = (changes: Parameters<typeof saveClosure>[3]) => run(saveClosure(local.db, local.userId, strip.id, changes));
  const c = closure;
  return (
    <div className="closing">
      <p className="hint">{t.closeHint}</p>
      <p>
        {t.tenacity}: <strong>{tenacityText}</strong>
      </p>
      <Choice label={t.decayLabel} options={DECAY} labels={t.decay} value={c?.decay ?? null} onChange={(v) => save({ decay: v })} />
      <Choice label={t.roleLabel} options={ROLES} labels={t.role} value={c?.role ?? null} onChange={(v) => save({ role: v })} />
      <fieldset className="choice">
        <legend>{t.effectLabel}</legend>
        {EFFECT_RICHNESS.map((o) => (
          <button key={o} type="button" className="chip" aria-pressed={c?.effectRichness === o} onClick={() => save({ effectRichness: c?.effectRichness === o ? null : o })}>
            {t.effectRichness[o]}
          </button>
        ))}
        <span className="sep" />
        {EFFECT_ENERGY.map((o) => (
          <button key={o} type="button" className="chip" aria-pressed={c?.effectEnergy === o} onClick={() => save({ effectEnergy: c?.effectEnergy === o ? null : o })}>
            {t.effectEnergy[o]}
          </button>
        ))}
      </fieldset>
      <Choice label={t.versatilityLabel} options={VERSATILITY} labels={t.versatility} value={c?.versatility ?? null} onChange={(v) => save({ versatility: v })} />
      <TextField label={t.affinities} rows={2} value={c?.affinities ?? null} onSave={(v) => save({ affinities: v })} />
      <TextField label={t.destination} value={c?.destination ?? null} onSave={(v) => save({ destination: v })} />
      <TextField label={t.negativeDestination} value={c?.negativeDestination ?? null} onSave={(v) => save({ negativeDestination: v })} />
      <Choice label={t.r1Label} options={R1} labels={t.r1} value={c?.r1 ?? null} onChange={(v) => save({ r1: v })} />
      <Choice label={t.r2Label} options={R2} labels={t.r2} value={c?.r2 ?? null} onChange={(v) => save({ r2: v })} />
      <TextField label={t.r2Note} value={c?.r2Note ?? null} onSave={(v) => save({ r2Note: v })} />
      <Choice label={t.r3Label} options={R3} labels={t.r3} value={c?.r3 ?? null} onChange={(v) => save({ r3: v })} />
      <TextField label={t.r3Note} value={c?.r3Note ?? null} onSave={(v) => save({ r3Note: v })} />
      <fieldset className="choice">
        <legend>{t.biasesLabel}</legend>
        {BIASES.map((b) => {
          const on = c?.biases.includes(b) ?? false;
          return (
            <button key={b} type="button" className="chip" aria-pressed={on} onClick={() => save({ biases: on ? (c?.biases ?? []).filter((x) => x !== b) : [...(c?.biases ?? []), b] })}>
              {t.biases[b]}
            </button>
          );
        })}
      </fieldset>
      <TextField label={t.biasNote} value={c?.biasNote ?? null} onSave={(v) => save({ biasNote: v })} />
      {strip.closedAt ? (
        <TextField label={t.comparison} rows={5} value={c?.comparison ?? null} onSave={(v) => save({ comparison: v })} />
      ) : (
        <>
          <p className="hint">{t.comparisonLocked}</p>
          <button
            type="button"
            className="primary"
            onClick={() => {
              if (window.confirm(t.closeAsk)) run(closeStrip(local.db, local.userId, strip.id));
            }}
          >
            {t.close}
          </button>
        </>
      )}
    </div>
  );
}

function QueueView({
  data,
  local,
  tastings,
  onAdd,
  run,
}: {
  data: GlossaryData;
  local: LocalDatabase;
  tastings: Tastings;
  onAdd: (materialId: string) => void;
  run: (p: Promise<unknown>) => void;
}) {
  const queue = useMemo(() => buildQueue(data.catalog, tastings), [data, tastings]);
  const total = queue.tasted + queue.pending;
  const inSession = new Set(tastings.strips.filter((s) => tastings.sessions.find((x) => x.id === s.sessionId && !x.endedAt)).map((s) => s.materialId));
  const item = (i: (typeof queue.groups)[number]["items"][number]) => (
    <li key={i.materialId} className="queue-item">
      <span className="queue-name">
        {i.name}
        {i.dilution && <small className="hint"> · {percent(i.dilution.fraction, 2)}</small>}
        {i.mark && <span className="mark-badge">{i.mark}</span>}
      </span>
      <span className="queue-buttons">
        <button type="button" className="link" onClick={() => run(setMark(local.db, local.userId, i.materialId, i.mark ? null : (window.prompt(t.markAsk, t.markDefault) ?? null)))}>
          {i.mark ? t.unmark : t.mark}
        </button>
        <button type="button" disabled={inSession.has(i.materialId)} onClick={() => onAdd(i.materialId)}>
          {t.queueAdd}
        </button>
      </span>
    </li>
  );
  return (
    <div className="queue">
      <p>{t.queueProgress(queue.tasted, total)}</p>
      <progress max={total || 1} value={queue.tasted} />
      {queue.pending === 0 && <p className="hint">{t.queueEmpty}</p>}
      {queue.marked.length > 0 && (
        <section>
          <h3>{t.queueMarked}</h3>
          <ul className="queue-list">{queue.marked.map(item)}</ul>
        </section>
      )}
      {queue.groups.map((g) => (
        <details key={g.key ?? "none"} className="queue-group" open={queue.groups.length <= 3}>
          <summary>{t.queueGroup(g.fraction ? t.dilutionOf(`≈${percent(g.fraction, 2)}`, g.solvent) : t.queueNoDilution, g.items.length)}</summary>
          <ul className="queue-list">{g.items.map(item)}</ul>
        </details>
      ))}
    </div>
  );
}

function HistoryView({ data, tastings, onOpenStrip }: { data: GlossaryData; tastings: Tastings; onOpenStrip: (id: string) => void }) {
  const strips = tastings.strips.filter((s) => s.closedAt || tastings.sessions.find((x) => x.id === s.sessionId)?.endedAt);
  if (strips.length === 0) return <p className="hint">{t.historyEmpty}</p>;
  return (
    <ul className="queue-list">
      {[...strips]
        .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1))
        .map((s) => {
          const ten = tenacity(s, tastings.moments.filter((m) => m.stripId === s.id));
          return (
            <li key={s.id} className="queue-item">
              <span className="queue-name">
                {nameOf(data, s.materialId)}
                <small className="hint">
                  {" "}
                  {when(s.appliedAt)} · {dilutionText(s)}
                  {ten ? ` · ${t.tenacity.toLowerCase()} ${t.tenacityHours(hoursText(ten.hours), ten.atLeast)}` : ""}
                  {s.closedAt ? "" : ` · ${t.closing.toLowerCase()} —`}
                </small>
              </span>
              <button type="button" onClick={() => onOpenStrip(s.id)}>
                {t.open}
              </button>
            </li>
          );
        })}
    </ul>
  );
}

/** The lab's filled sheets (V3-60, batch 18): their text, read only; one marked tasted or with its opening written. */
function LegacyView({ data }: { data: GlossaryData }) {
  const rows = [...data.catalog.evaluations.entries()]
    .filter(([, e]) => legacyTasted(e.status) || (e.sheet ?? "").includes("\n"))
    .map(([id, e]) => ({ id, e, name: nameOf(data, id) }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return (
    <div className="legacy">
      <p className="hint">{t.legacyHint}</p>
      {rows.length === 0 && <p className="hint">{t.legacyEmpty}</p>}
      {rows.map(({ id, e, name }) => (
        <details key={id} className="legacy-sheet">
          <summary>
            {name} <small className="hint">· {e.status}</small>
          </summary>
          {e.reading && <p>{e.reading}</p>}
          {e.sheet && <pre>{e.sheet}</pre>}
        </details>
      ))}
    </div>
  );
}
