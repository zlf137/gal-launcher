const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("galWidget", {
  openMain: () => ipcRenderer.send("widget:open-main"),
  dragStart: () => ipcRenderer.send("widget:drag-start"),
  dragMove: () => ipcRenderer.send("widget:drag-move"),
  dragEnd: () => ipcRenderer.send("widget:drag-end"),
  setInteractive: (interactive) => ipcRenderer.send("widget:set-interactive", Boolean(interactive)),
  showMenu: () => ipcRenderer.send("widget:show-menu"),
  ready: () => ipcRenderer.send("widget:ready"),
  onBubble: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("widget:bubble", listener);
    return () => ipcRenderer.removeListener("widget:bubble", listener);
  }
});
