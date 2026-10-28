const { localDateKey } = require("./state.cjs");

const MIN_INTERVAL_MINUTES = 15;
const MAX_INTERVAL_MINUTES = 30;
const DAILY_CAP_MIN = 15;
const DAILY_CAP_MAX = 25;
const IDLE_THRESHOLD_SECONDS = 180;
const DEBUG_INTERVAL_MS = 10_000;
const DEBUG_IDLE_SECONDS = 5;
const DEBUG_DAILY_CAP = 999;

function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function rollInterval(random, debug = false) {
  return debug
    ? DEBUG_INTERVAL_MS
    : randomInt(random, MIN_INTERVAL_MINUTES, MAX_INTERVAL_MINUTES) * 60_000;
}

function rollDuration(random, debug = false) {
  return debug ? 4_000 : randomInt(random, 4, 6) * 1_000;
}

function ensureDay(bubble, now, random, debug = false) {
  const date = localDateKey(now);
  if (bubble.date === date) return bubble;
  return {
    ...bubble,
    date,
    cap: debug ? DEBUG_DAILY_CAP : randomInt(random, DAILY_CAP_MIN, DAILY_CAP_MAX),
    count: 0,
    nextDueAt: now + rollInterval(random, debug),
    lastText: ""
  };
}

function shouldShowBubble({ state, now, idleSeconds, locked, widgetVisible, mainVisible, gameRunning, debug = false }) {
  if (!state || !state.enabled) return false;
  if (!widgetVisible || mainVisible || gameRunning || locked) return false;
  const bubble = state.bubble;
  if (bubble.count >= bubble.cap) return false;
  if (now < bubble.nextDueAt) return false;
  return idleSeconds >= (debug ? DEBUG_IDLE_SECONDS : IDLE_THRESHOLD_SECONDS);
}

function bubblePool(titles) {
  return [
    ...titles.slice(0, 3).map((title) => `最近正在玩《${title}》`),
    "嘟嘟噜",
    "loli控西内"
  ];
}

function pickBubbleText(titles, random, lastText = "") {
  const pool = bubblePool(Array.isArray(titles) ? titles : []);
  if (pool.length === 0) return "";
  const candidates = pool.length > 1 ? pool.filter((text) => text !== lastText) : pool;
  return candidates[Math.floor(random() * candidates.length)] || pool[0];
}

function recordBubble(state, { now, random, text, debug = false }) {
  return {
    ...state,
    bubble: {
      ...state.bubble,
      count: state.bubble.count + 1,
      lastText: text,
      nextDueAt: now + rollInterval(random, debug)
    }
  };
}

module.exports = {
  DEBUG_DAILY_CAP,
  DEBUG_IDLE_SECONDS,
  DEBUG_INTERVAL_MS,
  DAILY_CAP_MAX,
  DAILY_CAP_MIN,
  IDLE_THRESHOLD_SECONDS,
  MAX_INTERVAL_MINUTES,
  MIN_INTERVAL_MINUTES,
  bubblePool,
  ensureDay,
  pickBubbleText,
  randomInt,
  recordBubble,
  rollDuration,
  rollInterval,
  shouldShowBubble
};
