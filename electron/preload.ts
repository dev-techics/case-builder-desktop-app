import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  isDesktop: true,

  createBundle: (input: { name: string; caseNumber?: string } | string) =>
    ipcRenderer.invoke("bundle:create", input),

  getBundles: () =>
    ipcRenderer.invoke("bundle:getAll"),

  deleteBundle: (id: string | number) =>
    ipcRenderer.invoke("bundle:delete", id),

})
