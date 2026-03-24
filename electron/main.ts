import { app, BrowserWindow } from "electron"
import path from "path"
import { registerBundleIpc } from "./ipc/bundle.controller"
import { JsonFileBundleRepository } from "../backend/infrastructure/persistence/jsonFileBundleRepository"

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

  win.loadURL("http://localhost:3000")
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
})
