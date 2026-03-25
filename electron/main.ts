import { app, BrowserWindow } from "electron"
import path from "path"
import { registerBundleIpc } from "./ipc/bundle.controller"
import { JsonFileBundleRepository } from "../backend/infrastructure/repositories/jsonFileBundleRepository"

const DEV_RENDERER_URL = process.env.ELECTRON_RENDERER_URL ?? "http://localhost:3000"

function registerIpc() {
  const storageDir = path.join(app.getPath("userData"), "case-builder")
  const bundlesPath = path.join(storageDir, "bundles.json")

  const bundleRepository = new JsonFileBundleRepository(bundlesPath)
  registerBundleIpc({ bundleRepository })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../../frontend/dist/index.html"))
  } else {
    win.loadURL(DEV_RENDERER_URL)
    win.webContents.openDevTools({ mode: "detach" })
  }
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
