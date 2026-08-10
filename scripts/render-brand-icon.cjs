const { app, BrowserWindow } = require("electron");
const { promises: fs } = require("node:fs");
const path = require("node:path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("force-device-scale-factor", "1");

app.whenReady().then(async () => {
  const root = path.resolve(__dirname, "..");
  const source = path.join(root, "assets", "brand", "orbitstage-mark.svg");
  const target = path.join(root, "assets", "brand", "icon.png");
  const window = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  await window.loadFile(source);
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const normalized = image.resize({ width: 512, height: 512, quality: "best" });
  await fs.writeFile(target, normalized.toPNG());
  window.destroy();
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
