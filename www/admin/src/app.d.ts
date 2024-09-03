import type { fields } from "$lib/overlay/sources/fields";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
  namespace Breakfast {
    interface Overlay {
      Fields: typeof fields;
    }
  }
}

export {};
