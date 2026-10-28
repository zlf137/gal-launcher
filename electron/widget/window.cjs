const { clampBounds, defaultBounds } = require("./state.cjs");

const WIDGET_WIDTH = 300;
const WIDGET_HEIGHT = 260;
const WIDGET_SIZE = { width: WIDGET_WIDTH, height: WIDGET_HEIGHT };
// Keep in sync with src/widget.css (.widget-avatar: right/bottom 18px, 160px).
const WIDGET_AVATAR = { right: 18, bottom: 18, size: 160 };
const SNAP_THRESHOLD = 40;

function createWidgetWindow({
  BrowserWindow,
  screen,
  preloadPath,
  devServerUrl,
  htmlPath,
  state,
  autoShow = false
}) {
  const display = screen.getPrimaryDisplay();
  const initial = state && state.bounds
    ? clampBounds(state.bounds, display.workArea, WIDGET_SIZE)
    : defaultBounds(display.workArea, WIDGET_SIZE);

  const window = new BrowserWindow({
    x: initial.x,
    y: initial.y,
    width: WIDGET_SIZE.width,
    height: WIDGET_SIZE.height,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    focusable: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  window.setAlwaysOnTop(true, "floating");
  window.setIgnoreMouseEvents(true, { forward: true });

  if (autoShow) {
    window.once("ready-to-show", () => {
      if (!window.isDestroyed()) window.showInactive();
    });
  }

  if (devServerUrl) window.loadURL(`${devServerUrl}/widget.html`);
  else window.loadFile(htmlPath);

  return { window, size: { ...WIDGET_SIZE } };
}

function snapWidgetBounds(bounds, workArea, size = WIDGET_SIZE, threshold = SNAP_THRESHOLD) {
  const clamped = clampBounds(bounds, workArea, size);
  const right = workArea.x + workArea.width - size.width;
  const bottom = workArea.y + workArea.height - size.height;
  let x = clamped.x;
  let y = clamped.y;
  if (Math.abs(x - workArea.x) <= threshold) x = workArea.x;
  else if (Math.abs(x - right) <= threshold) x = right;
  if (Math.abs(y - workArea.y) <= threshold) y = workArea.y;
  else if (Math.abs(y - bottom) <= threshold) y = bottom;
  return { x, y };
}

module.exports = { WIDGET_AVATAR, WIDGET_HEIGHT, WIDGET_SIZE, WIDGET_WIDTH, createWidgetWindow, snapWidgetBounds };
