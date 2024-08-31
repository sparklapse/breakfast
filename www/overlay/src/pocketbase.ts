import PocketBase from "pocketbase";

export class BreakfastPocketBase extends PocketBase {
  constructor() {
    super();
    const searchParams = new URLSearchParams(window.location.search);
    const streamKey = searchParams.get("sk");

    if (streamKey !== null) {
      this.beforeSend = (url, options) => {
        return {
          url,
          options: {
            ...options,
            query: {
              ...options.query,
              sk: streamKey,
            },
          },
        };
      };
    }
  }
}
