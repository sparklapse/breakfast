<script lang="ts">
  import { fade } from "svelte/transition";
  import websocketMenu from "./websocket-settings.png";

  export let nextStep: () => void;
</script>

<div
  class="absolute inset-0 grid place-content-center px-4"
  in:fade={{ delay: 100, duration: 100 }}
  out:fade={{ duration: 100 }}
>
  <div class="flex max-w-lg flex-col items-center gap-2">
    <div class="h-72 overflow-hidden">
      <img src={websocketMenu} alt="" />
    </div>
    <p class="text-xl">
      Check "Enable WebSocket server" and make sure "Enable authentication" is also checked
    </p>
    <button class="rounded bg-slate-700 px-2 text-xl text-white" on:click={nextStep}>Next</button>
  </div>
</div>
