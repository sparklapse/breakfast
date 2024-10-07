import type { OBSWebSocket } from "$lib/connections/obs";
import type { BreakfastPocketBase } from "$lib/connections/pocketbase";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      pb: BreakfastPocketBase;
      obs: OBSWebSocket;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
