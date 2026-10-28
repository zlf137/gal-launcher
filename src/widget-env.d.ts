export {};

export interface WidgetBubblePayload {
  text: string;
  durationMs: number;
}

export interface GalWidgetApi {
  openMain: () => void;
  dragStart: () => void;
  dragMove: () => void;
  dragEnd: () => void;
  setInteractive: (interactive: boolean) => void;
  showMenu: () => void;
  ready: () => void;
  onBubble: (callback: (payload: WidgetBubblePayload) => void) => () => void;
}

declare global {
  interface Window {
    galWidget: GalWidgetApi;
  }
}
