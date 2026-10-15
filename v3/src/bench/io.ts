/**
 * The workbench's few touches of the browser (ported from the v2, V3-52). In the v3 a formula is
 * not a file: it lives in the copy and every action is an event (plan 8.2). What stays: asking
 * before something that cannot be undone, and downloading a file (a formula exported as JSON).
 * The v2's desktop app (Tauri) is gone: the v3 is a web app (V3-8).
 */
export const inTauri = (): boolean => false;

export function download(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function confirmDialog(text: string): Promise<boolean> {
  return window.confirm(text);
}

export const fileNameFor = (name: string): string => `${name.trim().replace(/[\\/:*?"<>|]+/g, "-") || "formula"}.json`;
