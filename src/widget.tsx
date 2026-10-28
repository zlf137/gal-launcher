import avatarUrl from "./assets/widget-avatar.png";
import "./widget.css";

const api = window.galWidget;

const root = document.getElementById("widget-root");
if (!root) throw new Error("widget root missing");

const shell = document.createElement("div");
shell.className = "widget";

const bubble = document.createElement("div");
bubble.className = "widget-bubble";
bubble.setAttribute("role", "status");

const avatar = document.createElement("button");
avatar.type = "button";
avatar.className = "widget-avatar";
avatar.setAttribute("aria-label", "打开 Gal Launcher");

const inner = document.createElement("span");
inner.className = "widget-avatar-inner";

const image = document.createElement("img");
image.src = avatarUrl;
image.alt = "";
image.draggable = false;
image.decoding = "async";

inner.appendChild(image);
avatar.appendChild(inner);
shell.append(bubble, avatar);
root.appendChild(shell);

let pointerDown = false;
let moved = false;
let startX = 0;
let startY = 0;
let lastInteractive: boolean | null = null;

function overAvatar(clientX: number, clientY: number) {
  const rect = avatar.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function setInteractive(next: boolean) {
  if (next === lastInteractive) return;
  lastInteractive = next;
  api.setInteractive(next);
}

window.addEventListener("pointermove", (event) => {
  setInteractive(overAvatar(event.clientX, event.clientY));
  if (!pointerDown) return;
  if (!moved && Math.hypot(event.screenX - startX, event.screenY - startY) > 4) moved = true;
  if (moved) api.dragMove();
});

avatar.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  pointerDown = true;
  moved = false;
  startX = event.screenX;
  startY = event.screenY;
  api.dragStart();
});

window.addEventListener("pointerup", () => {
  if (!pointerDown) return;
  pointerDown = false;
  api.dragEnd();
  if (!moved) api.openMain();
});

window.addEventListener("pointercancel", () => {
  if (!pointerDown) return;
  pointerDown = false;
  api.dragEnd();
});

avatar.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  api.showMenu();
});

let bubbleTimer: number | undefined;

api.onBubble(({ text, durationMs }) => {
  bubble.textContent = text;
  bubble.classList.add("visible");
  if (bubbleTimer !== undefined) window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => {
    bubble.classList.remove("visible");
    bubbleTimer = undefined;
  }, Math.max(500, durationMs));
});

api.ready();
