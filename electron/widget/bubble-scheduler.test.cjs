const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ensureDay,
  pickBubbleText,
  recordBubble,
  rollDuration,
  rollInterval,
  shouldShowBubble
} = require("./bubble-scheduler.cjs");
const { defaultState, localDateKey } = require("./state.cjs");

const MINUTE = 60_000;

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

function readyState(overrides = {}) {
  const state = defaultState();
  return {
    ...state,
    bubble: { ...state.bubble, date: localDateKey(Date.now()), cap: 20, count: 0, nextDueAt: 0 },
    ...overrides
  };
}

test("ensureDay rolls a new daily cap and resets the counter", () => {
  const bubble = { date: "2026-10-27", cap: 20, count: 9, nextDueAt: 0, lastText: "x" };
  const now = Date.parse("2026-10-28T08:00:00");
  const next = ensureDay(bubble, now, sequenceRandom([0, 0]));
  assert.equal(next.date, "2026-10-28");
  assert.equal(next.count, 0);
  assert.equal(next.cap, 15);
  assert.equal(next.lastText, "");
  assert.equal(next.nextDueAt, now + 15 * MINUTE);
});

test("ensureDay keeps same-day state untouched", () => {
  const now = Date.parse("2026-10-28T08:00:00");
  const bubble = { date: localDateKey(now), cap: 20, count: 4, nextDueAt: 99, lastText: "嘟嘟噜" };
  assert.equal(ensureDay(bubble, now, () => 0.5), bubble);
});

test("daily cap stays within 15 to 25", () => {
  const now = Date.parse("2026-10-28T08:00:00");
  assert.equal(ensureDay({ date: "x" }, now, sequenceRandom([0, 0])).cap, 15);
  assert.equal(ensureDay({ date: "x" }, now, sequenceRandom([0.999, 0])).cap, 25);
});

test("interval and duration stay within the configured ranges", () => {
  assert.equal(rollInterval(() => 0), 15 * MINUTE);
  assert.equal(rollInterval(() => 0.999), 30 * MINUTE);
  assert.equal(rollDuration(() => 0), 4_000);
  assert.equal(rollDuration(() => 0.999), 6_000);
  assert.equal(rollInterval(() => 0, true), 10_000);
});

test("shouldShowBubble requires visibility, absence of activity, idle time and due time", () => {
  const base = {
    state: readyState(),
    now: 1_000_000,
    idleSeconds: 200,
    locked: false,
    widgetVisible: true,
    mainVisible: false,
    gameRunning: false
  };
  assert.equal(shouldShowBubble(base), true);
  assert.equal(shouldShowBubble({ ...base, locked: true }), false);
  assert.equal(shouldShowBubble({ ...base, mainVisible: true }), false);
  assert.equal(shouldShowBubble({ ...base, widgetVisible: false }), false);
  assert.equal(shouldShowBubble({ ...base, gameRunning: true }), false);
  assert.equal(shouldShowBubble({ ...base, idleSeconds: 179 }), false);
  assert.equal(shouldShowBubble({ ...base, now: 0, state: readyState({ bubble: { ...readyState().bubble, nextDueAt: 5 } }) }), false);
  assert.equal(shouldShowBubble({ ...base, state: readyState({ enabled: false }) }), false);
});

test("shouldShowBubble respects the daily cap", () => {
  const state = readyState({ bubble: { ...readyState().bubble, count: 20, cap: 20 } });
  assert.equal(shouldShowBubble({
    state, now: 1_000_000, idleSeconds: 999, locked: false,
    widgetVisible: true, mainVisible: false, gameRunning: false
  }), false);
});

test("pickBubbleText draws from the three recent games and the fixed lines", () => {
  const titles = ["星之梦", "AIR", "CLANNAD", "Fate"];
  const pool = new Set();
  for (let i = 0; i < 5; i++) {
    const pick = pickBubbleText(titles, sequenceRandom([i / 5]), "");
    pool.add(pick);
  }
  assert.ok(pool.has("最近正在玩《星之梦》"));
  assert.ok(pool.has("嘟嘟噜"));
  assert.ok(pool.has("loli控西内"));
  assert.ok(!pool.has("最近正在玩《Fate》"));
});

test("pickBubbleText avoids repeating the previous line", () => {
  assert.equal(pickBubbleText([], () => 0, "嘟嘟噜"), "loli控西内");
  assert.equal(pickBubbleText([], () => 0, "loli控西内"), "嘟嘟噜");
});

test("recordBubble increments the count and schedules the next one", () => {
  const state = readyState();
  const now = 1_000_000;
  const next = recordBubble(state, { now, random: () => 0, text: "嘟嘟噜" });
  assert.equal(next.bubble.count, 1);
  assert.equal(next.bubble.lastText, "嘟嘟噜");
  assert.equal(next.bubble.nextDueAt, now + 15 * MINUTE);
});
