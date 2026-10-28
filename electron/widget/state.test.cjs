const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  clampBounds,
  defaultBounds,
  defaultState,
  normalizeState,
  readWidgetState,
  statePath,
  writeWidgetState
} = require("./state.cjs");

const SIZE = { width: 300, height: 260 };

test("default state enables the widget and login item", () => {
  const state = defaultState();
  assert.equal(state.enabled, true);
  assert.equal(state.openAtLogin, true);
  assert.equal(state.bounds, null);
  assert.equal(state.bubble.count, 0);
});

test("normalizeState rejects malformed bounds and bubble values", () => {
  const state = normalizeState({
    enabled: "yes",
    bounds: { x: "10", y: Infinity },
    openAtLogin: 0,
    bubble: { cap: -5, count: "3", nextDueAt: "later", lastText: 42 }
  });
  assert.equal(state.enabled, true);
  assert.equal(state.openAtLogin, true);
  assert.equal(state.bounds, null);
  assert.equal(state.bubble.cap, 20);
  assert.equal(state.bubble.count, 3);
  assert.equal(state.bubble.nextDueAt, 0);
  assert.equal(state.bubble.lastText, "");
});

test("clampBounds keeps the widget inside the work area", () => {
  const workArea = { x: 0, y: 0, width: 1440, height: 852 };
  assert.deepEqual(clampBounds({ x: -50, y: 9999 }, workArea, SIZE), { x: 0, y: 592 });
  assert.deepEqual(clampBounds({ x: 1200, y: 10 }, workArea, SIZE), { x: 1140, y: 10 });
});

test("defaultBounds anchors to the bottom-right corner", () => {
  assert.deepEqual(defaultBounds({ x: 0, y: 0, width: 1440, height: 852 }, SIZE, 24), { x: 1116, y: 568 });
});

test("widget state round-trips and falls back to defaults when corrupt", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gal-widget-state-"));
  try {
    const saved = writeWidgetState(root, {
      ...defaultState(),
      bounds: { x: 12, y: 34 },
      bubble: { date: "2026-10-28", cap: 18, count: 4, nextDueAt: 123, lastText: "嘟嘟噜" }
    });
    assert.equal(saved.bounds.x, 12);
    const loaded = readWidgetState(root);
    assert.deepEqual(loaded.bounds, { x: 12, y: 34 });
    assert.equal(loaded.bubble.count, 4);
    assert.equal(loaded.bubble.lastText, "嘟嘟噜");

    fs.writeFileSync(statePath(root), "{ not json", "utf8");
    assert.deepEqual(readWidgetState(root), defaultState());
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
