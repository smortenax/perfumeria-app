import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask, open } from "@tauri-apps/plugin-dialog";

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

/** Asks for a formula file, starting in `folder` (the library) when given. */
export async function pickAndRead(folder?: string): Promise<OpenedFile | null> {
  if (inTauri()) {
    const path = await open({ multiple: false, directory: false, filters: FILTERS, ...(folder ? { defaultPath: folder } : {}) });
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

export const readFile = (path: string): Promise<string> => invoke<string>("read_text_file", { path });

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
 * Keeps the window from closing on unsaved changes (§6, P44). Inside the app, the close
 * waits for `canClose`, which saves first; in a browser, the page asks with its own
 * words when `dirty` says so. Returns what stops listening.
 */
export function guardClose(dirty: () => boolean, canClose: () => Promise<boolean>): () => void {
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
      if (!(await canClose())) {
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
