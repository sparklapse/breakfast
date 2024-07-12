type WebSocketOptions = boolean | AddEventListenerOptions | undefined;

export class PluginDevWebSocket extends WebSocket {
  #listeners: [keyof WebSocketEventMap, (this: WebSocket, ev: any) => any, WebSocketOptions][] = [];

  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: WebSocketOptions,
  ): void {
    this.#listeners.push([type, listener, options]);
    super.addEventListener(type, listener, options);
  }

  quietClose() {
    try {
      this.close();
    } catch {
      // Already closed
    }
  }

  shutdown() {
    for (const listener of this.#listeners) {
      this.removeEventListener(...listener);
    }

    this.quietClose();
  }
}
