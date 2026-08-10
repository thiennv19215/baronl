import { promises as fs } from "node:fs";
import path from "node:path";
import { screen, type BrowserWindow, type Rectangle } from "electron";

interface SavedWindowState extends Rectangle {
  maximized?: boolean;
}

function intersectsDisplay(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some(({ workArea }) => {
    const left = Math.max(bounds.x, workArea.x);
    const top = Math.max(bounds.y, workArea.y);
    const right = Math.min(bounds.x + bounds.width, workArea.x + workArea.width);
    const bottom = Math.min(bounds.y + bounds.height, workArea.y + workArea.height);
    return right - left >= 120 && bottom - top >= 80;
  });
}

export async function loadWindowState(
  dataDirectory: string,
  name: string,
  fallback: Rectangle
): Promise<SavedWindowState> {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(dataDirectory, `window-${name}.json`), "utf8")) as SavedWindowState;
    if (
      Number.isFinite(parsed.x) && Number.isFinite(parsed.y) &&
      Number.isFinite(parsed.width) && Number.isFinite(parsed.height) &&
      parsed.width >= 320 && parsed.height >= 320 && intersectsDisplay(parsed)
    ) return parsed;
  } catch {
    // Fall back to a visible centered window.
  }
  return fallback;
}

export function persistWindowState(dataDirectory: string, name: string, window: BrowserWindow): void {
  const filePath = path.join(dataDirectory, `window-${name}.json`);
  const state = { ...window.getBounds(), maximized: window.isMaximized() };
  void fs.mkdir(path.dirname(filePath), { recursive: true })
    .then(() => fs.writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8"))
    .catch(() => undefined);
}
