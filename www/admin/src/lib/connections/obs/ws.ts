import { unpack, pack } from "msgpackr";
import { helloMessageType, requestResponseMessageType } from "./types";
import { createControlledPromise } from "./helpers";
import type {
  Result,
  IdentifyMessage,
  RequestTypes,
  RequestTypeOptions,
  RequestTypeResponses,
  RequestMessage,
  RequestResponseMessage,
} from "./types";
import { writable, type Readable } from "svelte/store";

type EventsMap = {
  connect: void;
  disconnect: void;
};

const OBSWebSocketEvent = <K extends keyof EventsMap>(
  type: K,
  init?: CustomEventInit<EventsMap[K]>,
) => {
  return new CustomEvent(type, init);
};

type CustomEventListener<E> =
  | {
      (evt: CustomEvent<E>): void;
    }
  | {
      handleEvent(object: CustomEvent<E>): void;
    };

export class OBSWebSocket extends EventTarget {
  #ws: WebSocket | undefined;
  #connected: boolean = false;
  #password: string = "";
  #port: number = 4455;
  #address: string = "ws://localhost";
  #listeners: [keyof EventsMap, CustomEventListener<EventsMap[keyof EventsMap]> | null][] = [];

  #registerConnection() {
    if (!this.#ws)
      throw new Error("Tried to register connection handlers when no websocket available");
    if (!this.#connected) throw new Error("Tried to register connection when not connected");

    this.dispatchEvent(OBSWebSocketEvent("connect"));

    this.#ws.addEventListener("close", () => {
      this.dispatchEvent(OBSWebSocketEvent("disconnect"));
    });
  }

  connectedStore: Readable<boolean>;

  constructor() {
    super();
    const store = writable(false);
    this.addEventListener("connect", () => {
      store.set(true);
    });
    this.addEventListener("disconnect", () => {
      store.set(false);
    });

    this.connectedStore = {
      subscribe: store.subscribe,
    };
  }

  get connected() {
    return this.#connected;
  }

  get password() {
    return this.#password;
  }

  get port() {
    return this.#port;
  }

  get address() {
    return this.#address;
  }

  /**
   * Easy Connect
   *
   * Connects to OBS using stored password and config if any. Otherwise does nothing.
   * @returns
   */
  async easyConnect() {
    const obsPassword = localStorage.getItem("obs.password");
    if (obsPassword !== null) {
      const obsPort = Number.isNaN(parseInt(localStorage.getItem("obs.port") ?? "Nan"))
        ? this.port
        : parseInt(localStorage.getItem("obs.port")!);
      const obsAddress =
        localStorage.getItem("obs.address") === null
          ? this.address
          : localStorage.getItem("obs.address")!;

      return await this.connect(obsPassword, obsPort, obsAddress);
    }
  }

  async connect(
    password: string,
    port: number = 4455,
    address: string = "ws://localhost",
  ): Promise<Result<void>> {
    if (this.#connected) throw new Error("Already connected");

    this.#ws = new WebSocket(`${address}:${port}`, ["obswebsocket.msgpack"]);

    const { promise, resolver, rejector } = createControlledPromise();

    const connectionListener = async (ev: MessageEvent<Blob>) => {
      if (!this.#ws) return;

      const data = unpack(new Uint8Array(await ev.data.arrayBuffer()));
      switch (data.op) {
        case 0: {
          const parsed = helloMessageType.safeParse(data);
          if (!parsed.success) {
            this.#ws.close();
            throw new Error("OBS sent an invalid hello message");
          }

          const rpcVersion = 1;
          // const eventSubscriptions = 0;

          // No auth required
          if (!parsed.data.d.authentication) {
            this.#ws.send(
              pack({
                op: 1,
                d: {
                  rpcVersion,
                  // eventSubscriptions,
                },
              } satisfies IdentifyMessage),
            );
            break;
          }

          // Authenticate
          const secret = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password + parsed.data.d.authentication.salt),
          );
          const secretHash = btoa(String.fromCharCode(...new Uint8Array(secret)));
          const challenge = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(secretHash + parsed.data.d.authentication.challenge),
          );
          const authentication = btoa(String.fromCharCode(...new Uint8Array(challenge)));
          this.#ws.send(
            pack({
              op: 1,
              d: {
                rpcVersion,
                authentication,
                // eventSubscriptions,
              },
            } satisfies IdentifyMessage),
          );

          break;
        }
        case 2: {
          this.#connected = true;
          resolver();
          break;
        }
        case 3: {
          this.#ws.close();
          rejector(new Error("Requested to reidentify"));
        }
      }
    };
    this.#ws.addEventListener("message", connectionListener);
    setTimeout(() => {
      if (this.#connected) return;
      rejector(new Error("Connection timed out. Password may be incorrect."));
    }, 3000);

    try {
      await promise;
      this.#registerConnection();

      this.#password = password;
      this.#port = port;
      this.#address = address;

      return {
        status: "success",
      };
    } catch (err) {
      return {
        status: "error",
        error: err,
      };
    } finally {
      this.#ws.removeEventListener("message", connectionListener);
    }
  }

  disconnect() {
    if (!this.#ws || !this.#connected) throw new Error("Already disconnected");
    this.#ws.close();
    this.#connected = false;
    this.#ws = undefined;
  }

  /**
   * Make a request that will listen for a response and return said response. If a request is made,
   * the promise is gauranteed to resolve, as if a response is made then the promise will timeout
   * and return an error.
   *
   * @param request The type of request being made
   * @returns The data returned from OBS for said request
   */
  async request<K extends RequestTypes>(request: {
    type: K;
    options: RequestTypeOptions<K>;
    timeout?: number;
  }): Promise<Result<RequestTypeResponses<K>>> {
    if (!this.#connected || !this.#ws)
      return {
        status: "error",
        error: new Error("Not connected"),
      };

    const message: RequestMessage = {
      op: 6,
      d: {
        requestId: crypto.randomUUID(),
        requestType: request.type,
        requestData: request.options,
      },
    };

    const { promise, resolver, rejector } = createControlledPromise<RequestResponseMessage>();
    const listener = async (ev: MessageEvent<Blob>) => {
      const data = unpack(new Uint8Array(await ev.data.arrayBuffer()));

      if (data.op !== 7) return;
      if (data.d.requestId !== message.d.requestId) return;

      const parsed = requestResponseMessageType.safeParse(data);
      if (!parsed.success) {
        console.error(parsed.error);
        rejector(new Error("OBS returned an invalid response"));
        return;
      }

      resolver(parsed.data);
    };

    this.#ws.addEventListener("message", listener);
    setTimeout(() => {
      rejector(new Error("Request timed out"));
    }, request.timeout ?? 3000);

    try {
      this.#ws.send(pack(message));

      const result = await promise;
      if (!result.d.requestStatus.result) return { status: "error", error: result.d };

      return {
        status: "success",
        data: result.d.responseData,
      } as Result<RequestTypeResponses<K>>;
    } catch (err) {
      return {
        status: "error",
        error: err,
      };
    } finally {
      this.#ws?.removeEventListener("message", listener);
    }
  }

  /**
   * A command is effectivley the same as a request, but without the recieving end. A command has
   * no gaurentee that OBS returned information or processed the request, but just that the request
   * was successfully sent.
   *
   * This is handy when needing to stream requests or data to OBS with no real concern for the
   * order OBS gets them in.
   *
   * @param command The type of command being made
   * @returns A status signalling if the command was made successfully
   */
  command<K extends RequestTypes>(command: { type: K; options: RequestTypeOptions<K> }): Result {
    if (!this.#connected || !this.#ws)
      return {
        status: "error",
        error: new Error("Not connected"),
      };

    const message: RequestMessage = {
      op: 6,
      d: {
        requestId: crypto.randomUUID(),
        requestType: command.type,
        requestData: command.options,
      },
    };

    try {
      this.#ws.send(pack(message));
    } catch (err) {
      return {
        status: "error",
        error: err,
      };
    }

    return { status: "success" };
  }

  addEventListener<K extends keyof EventsMap>(
    type: K,
    callback: CustomEventListener<EventsMap[K]> | null,
  ) {
    this.#listeners.push([type, callback]);
    super.addEventListener(type, callback as EventListenerOrEventListenerObject);

    const unlisten = () => {
      super.removeEventListener(type, callback as EventListenerOrEventListenerObject);
    };

    return unlisten.bind(this);
  }

  removeAllListeners() {
    for (const [type, callback] of this.#listeners) {
      super.removeEventListener(type, callback as EventListenerOrEventListenerObject);
    }
  }
}
