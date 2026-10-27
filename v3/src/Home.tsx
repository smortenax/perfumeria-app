import type { LocalDatabase } from "./db/local/database";
import type { Tastings } from "./db/tastings";
import { WARN } from "./formulation/ifra-label";
import { useFormulaChecks } from "./formulation/useFormulaChecks";
import { readRecent } from "./recent";
import { macerationState, noteCheck, todayIso } from "./db/macerations";
import { useMacerations } from "./formulation/useMacerations";
import type { GlossaryData } from "./glossary/useGlossary";
import { buildQueue, countdown, dueMoments } from "./tasting/logic";
import { useNow } from "./tasting/useTastings";
import { DEFAULT_MOMENTS } from "./tasting/vocabulary";
import { texts } from "./i18n/en";

/**
 * The landing (plan v3, step 8.1): first «Continue», what is in progress, one tap back into it (audit
 * F-14); then the parts of the app (and «Catas», V3-60), each opened from here, with what each holds in
 * numbers from your copy. On a phone the account lives here too, as the nav moves to the bottom (F-03).
 */
export function Home({
  data,
  local,
  tastings,
  email,
  lastFormulaId,
  onMaterials,
  onFormulation,
  onTasting,
  onQueue,
  onDilutions,
  onOpenFormula,
  onOpenMaterial,
  onSignOut,
}: {
  data: GlossaryData | null;
  local: LocalDatabase;
  tastings: Tastings | null;
  email: string;
  /** The formula open behind, if any; else the last one made is offered. */
  lastFormulaId: string | null;
  onMaterials: () => void;
  onFormulation: () => void;
  onTasting: () => void;
  onQueue: () => void;
  onDilutions: () => void;
  onOpenFormula: (id: string) => void;
  onOpenMaterial: (id: string) => void;
  onSignOut: () => void;
}) {
  const t = texts.home;
  const own = data ? [...data.catalog.materials.values()].filter((m) => m.ownerId !== null).length : null;
  const common = data ? data.catalog.materials.size - (own ?? 0) : null;
  const queue = data && tastings ? buildQueue(data.catalog, tastings) : null;
  const openSessions = tastings ? tastings.sessions.filter((s) => !s.endedAt).length : 0;

  const formula = data
    ? (data.formulas.find((f) => f.id === lastFormulaId) ??
      [...data.formulas].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0] ??
      null)
    : null;
  const bench = formula ? data?.workbenches.find((b) => b.id === formula.workbenchId)?.name : undefined;

  // The open session and its timers, as «Catas» counts them: from each strip's opening (t0) on.
  const session = tastings?.sessions.find((s) => !s.endedAt) ?? null;
  const strips = session && tastings ? tastings.strips.filter((s) => s.sessionId === session.id && !s.closedAt) : [];
  const now = useNow(strips.length > 0);
  const timers = strips.flatMap((s) => {
    const written = tastings!.moments.filter((m) => m.stripId === s.id).map((m) => m.moment);
    if (!written.includes("t0")) return [];
    return dueMoments(s, written, DEFAULT_MOMENTS.filter((m) => m !== "t0"), now)
      .filter((d) => d.state !== "done")
      .map((d) => ({ ...d, label: s.blindLabel }));
  });
  const due = timers.find((d) => d.state === "due");
  const next = timers.filter((d) => d.state === "waiting").sort((a, b) => a.dueAt - b.dueAt)[0];
  const moment = texts.tasting.moments;
  const timerText = due ? t.dueNow(due.label, moment[due.moment]) : next ? t.nextTimer(next.label, moment[next.moment], countdown(next.dueAt - now)) : t.noTimer;

  // IFRA (F20): the formulas over or partial, worst first, so they are seen without opening them.
  const checks = useFormulaChecks(local, data ?? EMPTY, data ? data.formulas.map((f) => f.id) : []);
  const warned = (data?.formulas ?? [])
    .map((f) => ({ f, label: checks.get(f.id)?.ifra }))
    .filter((x): x is { f: (typeof x)["f"]; label: (typeof WARN)[number] } => x.label !== undefined && WARN.includes(x.label))
    .sort((a, b) => WARN.indexOf(a.label) - WARN.indexOf(b.label) || a.f.name.localeCompare(b.f.name, "es"));

  // What is macerating (V3-83): its day, and the check it is due for.
  const macerations = useMacerations(local);
  const today = todayIso();
  const macerating = data
    ? macerations
        .map((m) => ({ m, f: data.formulas.find((f) => f.id === m.formulaId), s: macerationState(m, today) }))
        .filter((x) => x.f !== undefined)
        .sort((a, b) => Number(b.s.due !== null) - Number(a.s.due !== null) || b.s.day - a.s.day)
    : [];
  const note = (id: string, check: number) => {
    const text = window.prompt(texts.maceration.ask(check));
    if (text !== null) void noteCheck(local.db, local.userId, id, check, text);
  };
  // Recent (F21): what you opened last that still exists, up to six.
  const recent = data
    ? readRecent()
        .map((r) =>
          r.kind === "formula"
            ? (() => {
                const f = data.formulas.find((x) => x.id === r.id);
                return f ? { ...r, name: f.name, detail: t.formulaIn(data.workbenches.find((b) => b.id === f.workbenchId)?.name ?? "—") } : null;
              })()
            : (() => {
                const m = data.catalog.materials.get(r.id);
                return m ? { ...r, name: m.name, detail: m.ownerId === null ? t.common : t.yours } : null;
              })(),
        )
        .filter((x) => x !== null)
        .slice(0, 6)
    : [];
  // The shelf (F21): what you have, and what is running low (V3-79).
  const mine = data ? [...data.catalog.materials.values()].filter((m) => m.ownerId !== null && m.kind !== "frozen") : [];
  const have = data ? data.catalog.have.size : 0;
  const low = mine.filter((m) => m.status === "running_low").sort((a, b) => a.name.localeCompare(b.name, "es"));

  const pending = queue?.pending ?? 0;
  const dilutionCount = data ? [...data.catalog.dilutions.values()].reduce((n, l) => n + l.filter((d) => !d.archivedAt).length, 0) : null;
  const anything = formula || session || pending > 0;

  return (
    <section className="home">
      <h2 className="page-title">{t.title}</h2>
      {data && (
        <section className="continue" aria-labelledby="continue-title">
          <h3 id="continue-title">{t.continue}</h3>
          {anything ? (
            <ul className="continue-list">
              {formula && (
                <li>
                  <button type="button" className="continue-item" onClick={() => onOpenFormula(formula.id)}>
                    <span className="continue-kind">{t.lastFormula}</span>
                    <span className="continue-name">{formula.name}</span>
                    {bench && <span className="continue-detail">{t.formulaIn(bench)}</span>}
                  </button>
                </li>
              )}
              {session && (
                <li>
                  <button type="button" className={`continue-item${due ? " due" : ""}`} onClick={onTasting}>
                    <span className="continue-kind">{t.session}</span>
                    <span className="continue-name">{t.sessionStrips(strips.length)}</span>
                    <span className="continue-detail">{timerText}</span>
                  </button>
                </li>
              )}
              {pending > 0 && (
                <li>
                  <button type="button" className="continue-item" onClick={onQueue}>
                    <span className="continue-kind">{t.queue}</span>
                    <span className="continue-name">{t.queueDetail(pending)}</span>
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <p className="hint">{t.nothing}</p>
          )}
        </section>
      )}
      {macerating.length > 0 && (
        <section className="continue home-macerating" aria-labelledby="home-macerating-title">
          <h3 id="home-macerating-title">{texts.maceration.title}</h3>
          <ul className="continue-list">
            {macerating.map(({ m, f, s }) => (
              <li key={m.id} className="macerating-item">
                <button type="button" className={`continue-item${s.due !== null ? " due" : ""}`} onClick={() => onOpenFormula(f!.id)}>
                  <span className="continue-kind">{texts.maceration.day(s.day)}</span>
                  <span className="continue-name">{f!.name}</span>
                  <span className="continue-detail">{s.due !== null ? texts.maceration.due(s.due) : s.next !== null ? texts.maceration.next(s.next) : texts.maceration.since(m.startedOn)}</span>
                </button>
                {s.due !== null && (
                  <button type="button" className="secondary note-check" onClick={() => note(m.id, s.due!)}>
                    {texts.maceration.note(s.due)}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {recent.length > 0 && (
        <section className="continue home-recent" aria-labelledby="home-recent-title">
          <h3 id="home-recent-title">{t.recent}</h3>
          <ul className="continue-list">
            {recent.map((r) => (
              <li key={`${r.kind}:${r.id}`}>
                <button type="button" className="continue-item" onClick={() => (r.kind === "formula" ? onOpenFormula(r.id) : onOpenMaterial(r.id))}>
                  <span className="continue-kind">{r.kind === "formula" ? t.recentFormula : t.recentMaterial}</span>
                  <span className="continue-name">{r.name}</span>
                  <span className="continue-detail">{r.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {data && (
        <section className="continue home-shelf" aria-labelledby="home-shelf-title">
          <h3 id="home-shelf-title">{t.shelf}</h3>
          <p className="hint">{t.shelfDetail(have, low.length)}</p>
          {low.length > 0 && (
            <ul className="continue-list">
              {low.map((m) => (
                <li key={m.id}>
                  <button type="button" className="continue-item" onClick={() => onOpenMaterial(m.id)}>
                    <span className="continue-kind">{texts.sheet.statuses.running_low}</span>
                    <span className="continue-name">{m.name}</span>
                    {(m.supplier || m.product) && <span className="continue-detail">{[m.supplier, m.product].filter((x) => x).join(" · ")}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {warned.length > 0 && (
        <section className="continue home-ifra" aria-labelledby="home-ifra-title">
          <h3 id="home-ifra-title">{t.ifraTitle}</h3>
          <p className="hint">{t.ifraHint}</p>
          <ul className="continue-list">
            {warned.map(({ f, label }) => (
              <li key={f.id}>
                <button type="button" className="continue-item" onClick={() => onOpenFormula(f.id)}>
                  <span className={`continue-kind ifra-label ifra-label-${label}`}>{texts.ifraLabel[label]}</span>
                  <span className="continue-name">{f.name}</span>
                  <span className="continue-detail">{t.formulaIn(data?.workbenches.find((b) => b.id === f.workbenchId)?.name ?? "—")}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h3 className="launch-title">{t.sections}</h3>
      <ul className="launch">
        <li>
          <button type="button" className="launch-card" onClick={onMaterials}>
            <span className="launch-number num" aria-hidden="true">{data ? data.catalog.materials.size : "–"}</span>
            <span className="launch-name">{t.materials}</span>
            <span className="launch-detail">{data ? t.materialsDetail(own!, common!) : texts.glossary.loading}</span>
          </button>
        </li>
        <li>
          <button type="button" className="launch-card" onClick={onFormulation}>
            <span className="launch-number num" aria-hidden="true">{data ? data.formulas.length : "–"}</span>
            <span className="launch-name">{t.formulation}</span>
            <span className="launch-detail">{data ? t.formulationDetail(data.workbenches.length, data.formulas.length) : texts.glossary.loading}</span>
          </button>
        </li>
        <li>
          <button type="button" className="launch-card" onClick={onTasting}>
            <span className="launch-number num" aria-hidden="true">{queue ? queue.pending : "–"}</span>
            <span className="launch-name">{texts.tasting.title}</span>
            <span className="launch-detail">{queue ? texts.tasting.homeDetail(queue.pending, openSessions) : texts.glossary.loading}</span>
          </button>
        </li>
        <li>
          <button type="button" className="launch-card" onClick={onDilutions}>
            <span className="launch-number num" aria-hidden="true">{dilutionCount ?? "–"}</span>
            <span className="launch-name">{texts.dilutions.title}</span>
            <span className="launch-detail">{dilutionCount !== null ? texts.dilutions.homeDetail(dilutionCount) : texts.glossary.loading}</span>
          </button>
        </li>
      </ul>
      {/* The account: in the top bar on a wide screen, here on a phone (audit F-03). */}
      <p className="home-account">
        {texts.app.signedInAs(email)} ·{" "}
        <button type="button" className="link" onClick={onSignOut}>
          {texts.app.signOut}
        </button>
      </p>
    </section>
  );
}

/** Nothing to check before the glossary is loaded. */
const EMPTY = { catalog: { materials: new Map() }, formulas: [], workbenches: [] } as unknown as GlossaryData;
