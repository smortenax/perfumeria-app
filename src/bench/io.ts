import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask, open, save } from "@tauri-apps/plugin-dialog";

/**
 * Files on disk (§6): the formula is a JSON file the user chooses. Inside the
 * app, Tauri's dialogs and two commands of our own read and write it. In a
 * plain browser, used only for development, it falls back to a file picker
 * and a download.
 */
export const inTauri = (): boolean => "__TAURI_INTERNALS__" in window;

const FILTERS = [{ name: "Fórmula", extensions: ["json"] }];

export interface OpenedFile {
  readonly path: string | null;
  readonly text: string;
}

export async function pickAndRead(): Promise<OpenedFile | null> {
  if (inTauri()) {
    const path = await open({ multiple: false, directory: false, filters: FILTERS });
    if (typeof path !== "string") {
      return null;
    }
    return { path, text: await invoke<string>("read_text_file", { path }) };
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? { path: null, text: await file.text() } : null);
    };
    input.click();
  });
}

/** Asks where to save; null when cancelled, or in a browser, where there is no path to choose. */
export async function pickSavePath(fileName: string): Promise<string | null> {
  if (!inTauri()) {
    return null;
  }
  return (await save({ defaultPath: fileName, filters: FILTERS })) ?? null;
}

export async function writeFile(path: string, text: string): Promise<void> {
  await invoke("write_text_file", { path, contents: text });
}

export function download(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function confirmDialog(text: string): Promise<boolean> {
  return inTauri() ? ask(text, { title: "Perfumería", kind: "warning" }) : window.confirm(text);
}

export const fileNameFor = (name: string): string =>
  `${name.trim().replace(/[\\/:*?"<>|]+/g, "-") || "formula"}.json`;

/**
 * Asks before the window closes while `dirty()` says there are unsaved changes (§6).
 * Inside the app, Tauri's close request waits for the answer; in a browser, the page
 * asks with its own words. Returns what stops listening.
 */
export function guardClose(dirty: () => boolean, text: string): () => void {
  if (!inTauri()) {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }
  let stop: (() => void) | null = null;
  let stopped = false;
  void getCurrentWindow()
    .onCloseRequested(async (event) => {
      if (dirty() && !(await confirmDialog(text))) {
        event.preventDefault();
      }
    })
    .then((unlisten) => {
      if (stopped) {
        unlisten();
      } else {
        stop = unlisten;
      }
    });
  return () => {
    stopped = true;
    stop?.();
  };
}
