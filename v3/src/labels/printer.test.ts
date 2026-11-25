import { describe, expect, it } from "vitest";
import type { PrinterAdapter } from "@thermal-label/marklife-web";
import { printRun, settleMs } from "./printer";
import { tapeOf } from "./media";

/** The user, 2026-11-25: «me he impreso una y se ha quedado a medias de la siguiente». */
const tape = tapeOf("GAP_12X40");
const image = { width: 8, height: 8, data: new Uint8Array(64 * 4) };
const fake = (dropAfter = Infinity) => {
  const log: string[] = [];
  let sent = 0;
  const p = {
    get connected() {
      return sent < dropAfter;
    },
    print: async () => {
      sent++;
      log.push(`print ${sent}`);
    },
  } as unknown as PrinterAdapter;
  return { p, log };
};

describe("printing a run of labels", () => {
  it("waits for each label to come out before sending the next", async () => {
    const { p, log } = fake();
    const end = await printRun(p, [image, image, image], tape, false, { wait: async (ms) => void log.push(`wait ${ms}`) });
    expect(end).toEqual({ done: 3, why: "ok" });
    expect(log).toEqual(["print 1", `wait ${settleMs(tape)}`, "print 2", `wait ${settleMs(tape)}`, "print 3", `wait ${settleMs(tape)}`]);
    expect(settleMs(tape)).toBe(3500);
  });

  it("a dropped link stops where it is, so the rest can be printed later without repeating", async () => {
    const { p } = fake(1);
    expect(await printRun(p, [image, image, image], tape, false, { wait: async () => {} })).toEqual({ done: 1, why: "lost" });
  });

  it("stops when asked, between labels", async () => {
    const { p } = fake();
    let n = 0;
    expect(await printRun(p, [image, image], tape, false, { wait: async () => {}, stopped: () => n++ > 0 })).toEqual({ done: 1, why: "stopped" });
  });
});
