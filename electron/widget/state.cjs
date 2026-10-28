const fsDefault = require("node:fs");
const path = require("node:path");

const WIDGET_STATE_VERSION = 1;

function defaultState() {
  return {
    version: WIDGET_STATE_VERSION,
    enabled: true,
    bounds: null,
    openAtLogin: true,
    bubble: { date: "", cap: 20, count: 0, nextDueAt: 0, lastText: "" }
  };
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  const bubble = source.bubble && typeof source.bubble === "object" ? source.bubble : {};
  const bounds = source.bounds && finiteNumber(source.bounds.x) && finiteNumber(source.bounds.y)
    ? { x: Math.round(source.bounds.x), y: Math.round(source.bounds.y) }
    : null;
  return {
    version: WIDGET_STATE_VERSION,
    enabled: typeof source.enabled === "boolean" ? source.enabled : true,
    bounds,
    openAtLogin: typeof source.openAtLogin === "boolean" ? source.openAtLogin : true,
    bubble: {
      date: typeof bubble.date === "string" ? bubble.date : "",
      cap: Number.isFinite(Number(bubble.cap)) && Number(bubble.cap) > 0 ? Math.floor(Number(bubble.cap)) : 20,
      count: Number.isFinite(Number(bubble.count)) ? Math.max(0, Math.floor(Number(bubble.count))) : 0,
      nextDueAt: Number.isFinite(Number(bubble.nextDueAt)) ? Math.max(0, Math.floor(Number(bubble.nextDueAt))) : 0,
      lastText: typeof bubble.lastText === "string" ? bubble.lastText : ""
    }
  };
}

function statePath(userDataPath) {
  return path.join(userDataPath, "widget.json");
}

function readWidgetState(userDataPath, fsImpl = fsDefault) {
  try {
    return normalizeState(JSON.parse(fsImpl.readFileSync(statePath(userDataPath), "utf8")));
  } catch {
    return defaultState();
  }
}

function writeWidgetState(userDataPath, state, fsImpl = fsDefault) {
  const normalized = normalizeState(state);
  fsImpl.mkdirSync(path.dirname(statePath(userDataPath)), { recursive: true });
  fsImpl.writeFileSync(statePath(userDataPath), JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function localDateKey(now) {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function clampBounds(bounds, workArea, size) {
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + Math.max(0, workArea.width - size.width);
  const maxY = workArea.y + Math.max(0, workArea.height - size.height);
  return {
    x: Math.min(Math.max(Math.round(bounds.x), minX), maxX),
    y: Math.min(Math.max(Math.round(bounds.y), minY), maxY)
  };
}

function defaultBounds(workArea, size, margin = 24) {
  return {
    x: workArea.x + Math.max(0, workArea.width - size.width - margin),
    y: workArea.y + Math.max(0, workArea.height - size.height - margin)
  };
}

module.exports = {
  WIDGET_STATE_VERSION,
  clampBounds,
  defaultBounds,
  defaultState,
  localDateKey,
  normalizeState,
  readWidgetState,
  statePath,
  writeWidgetState
};
