import { useEffect, useRef, useState } from "react";
import type { PrinterAdapter } from "@thermal-label/marklife-web";
import { texts } from "../i18n/en";
import { readStored, writeStored } from "../storage";
import { tapeOf, type Tape } from "./media";
import { drawTwoLines, pixelsOf } from "./render";
import type { PrintLine } from "./jobs";
import { alignTape, connectP15, printRun } from "./printer";

const t = texts.labels;

/**
 * The P15 as a screen holds it (moved out of «Labels», 2026-11-26, so the bench's test label prints the
 * same way): the tape and the flip this browser remembers, the Bluetooth link, a run of labels one after
 * another with its stop, and what a stopped or lost run left to print.
 */
export function usePrinter() {
  const [tape, setTape] = useState<Tape>(() => tapeOf(readStored("labelTape") ?? ""));
  const [flip, setFlip] = useState(() => readStored("labelFlip") === "1");
  const [printer, setPrinter] = useState<PrinterAdapter | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The labels a run did not get to (stopped, or the link dropped): «Print the remaining N».
  const [left, setLeft] = useState<readonly PrintLine[]>([]);
  const stop = useRef(false);
  const running = useRef(false);

  const pickTape = (key: string) => {
    const next = tapeOf(key);
    setTape(next);
    writeStored("labelTape", next.id); // Without storage, the tape is chosen again next time.
  };
  const pickFlip = (on: boolean) => {
    setFlip(on);
    writeStored("labelFlip", on ? "1" : "0");
  };
  const connect = async (): Promise<PrinterAdapter | null> => {
    setStatus(null);
    try {
      const p = await connectP15();
      setPrinter(p);
      setStatus(t.connected);
      return p;
    } catch (e) {
      setStatus(t.failed(e instanceof Error ? e.message : String(e)));
      return null;
    }
  };
  /** Prints these labels one after another; connects first when the printer is not yet. What is left after a stop or a lost link can be printed later. */
  const print = async (list: readonly PrintLine[]) => {
    if (list.length === 0 || running.current) return;
    running.current = true;
    try {
      const to = printer?.connected ? printer : await connect();
      if (!to) return;
      setBusy(true);
      setLeft([]);
      stop.current = false;
      const end = await printRun(to, list.map((x) => () => pixelsOf(drawTwoLines(x.big, x.small, tape).canvas)), tape, flip, {
        onLabel: (i) => setStatus(t.printing(i + 1, list.length)),
        stopped: () => stop.current,
      });
      setBusy(false);
      if (end.why === "ok") return setStatus(t.printed(list.length));
      if (end.why === "lost") setPrinter(null);
      setLeft(list.slice(end.done));
      setStatus(end.why === "stopped" ? t.stopped(end.done, list.length) : end.why === "lost" ? t.lost(end.done, list.length) : t.failed(end.message ?? ""));
    } finally {
      running.current = false;
    }
  };
  const align = async () => {
    const to = printer?.connected ? printer : await connect();
    if (!to) return;
    try {
      await alignTape(to, tape);
      setStatus(t.aligned);
    } catch (e) {
      setStatus(t.failed(e instanceof Error ? e.message : String(e)));
    }
  };
  const halt = () => (stop.current = true);
  useEffect(() => () => void printer?.close(), [printer]);

  return { tape, flip, printer, status, busy, left, pickTape, pickFlip, connect, print, align, halt, setStatus };
}

export type Printer = ReturnType<typeof usePrinter>;
