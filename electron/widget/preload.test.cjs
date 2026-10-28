const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadBridge() {
  const sent = [];
  const listeners = new Map();
  let bridge;
  const electron = {
    contextBridge: { exposeInMainWorld: (_name, api) => { bridge = api; } },
    ipcRenderer: {
      send: (...args) => sent.push(args),
      on: (channel, listener) => listeners.set(channel, listener),
      removeListener: (channel) => listeners.delete(channel)
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "preload.cjs"), "utf8"), {
    require: (name) => {
      assert.equal(name, "electron");
      return electron;
    }
  });
  return { bridge, sent, listeners };
}

test("widget bridge sends the expected control channels", () => {
  const { bridge, sent } = loadBridge();
  bridge.openMain();
  bridge.dragStart();
  bridge.dragMove();
  bridge.dragEnd();
  bridge.setInteractive(true);
  bridge.setInteractive(false);
  bridge.showMenu();
  bridge.ready();
  assert.deepEqual(sent, [
    ["widget:open-main"],
    ["widget:drag-start"],
    ["widget:drag-move"],
    ["widget:drag-end"],
    ["widget:set-interactive", true],
    ["widget:set-interactive", false],
    ["widget:show-menu"],
    ["widget:ready"]
  ]);
});

test("widget bridge forwards bubble payloads and unsubscribes", () => {
  const { bridge, listeners } = loadBridge();
  const received = [];
  const unsubscribe = bridge.onBubble((payload) => received.push(payload));
  const listener = listeners.get("widget:bubble");
  assert.equal(typeof listener, "function");
  listener({}, { text: "嘟嘟噜", durationMs: 4000 });
  assert.deepEqual(received, [{ text: "嘟嘟噜", durationMs: 4000 }]);
  unsubscribe();
  assert.equal(listeners.has("widget:bubble"), false);
});
