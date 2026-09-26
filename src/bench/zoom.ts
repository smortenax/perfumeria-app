import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { inTauri } from "./io";

/** The bench is drawn at the proportions of the sketch (boceto 4), 1440 × 900. */
export const DESIGN_WIDTH = 1440;
export const DESIGN_HEIGHT = 900;

/**
 * Zooms the webview so the layout keeps the sketch's proportions in any window:
 * smaller windows show it smaller rather than squeezing it. Returns a function
 * that stops following the window. Outside the app it does nothing.
 */
export async function fitToWindow(): Promise<() => void> {
  if (!inTauri()) {
    return () => {};
  }
  const win = getCurrentWindow();
  const apply = async () => {
    const size = await win.innerSize();
    const scale = await win.scaleFactor();
    const zoom = Math.min(size.width / scale / DESIGN_WIDTH, size.height / scale / DESIGN_HEIGHT);
    await getCurrentWebview().setZoom(Math.max(0.6, Math.min(1.25, zoom)));
  };
  await apply();
  return win.onResized(() => void apply());
}
