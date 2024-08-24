<script lang="ts">
  import { fade } from "svelte/transition";
  import toolsMenu from "./tools-menu.png";

  export let nextStep: () => void;
</script>

<div
  class="absolute inset-0 grid place-content-center px-4"
  in:fade={{ delay: 100, duration: 100 }}
  out:fade={{ duration: 100 }}
>
  <div class="flex flex-col items-center gap-2">
    <div class="relative h-72 w-full overflow-hidden">
      <img class="absolute inset-x-0 top-0 blur" src={toolsMenu} alt="" />
      <img class="clip absolute inset-x-0" src={toolsMenu} alt="" />
    </div>
    <p class="text-xl">Open up OBS and select "Tools" the "WebSocket Server Settings"</p>
    <button class="rounded bg-slate-700 px-2 text-xl text-white" on:click={nextStep}>Next</button>
  </div>
</div>

<style>
  @keyframes guide {
    0% {
      clip-path: polygon(0% 8%, 100% 8%, 100% 15%, 0% 15%);
    }

    20%,50% {
      clip-path: polygon(60% 8%, 70% 8%, 70% 15%, 60% 15%);
    }

    70%,80% {
      clip-path: polygon(60% 8%, 96% 8%, 96% 95%, 60% 95%);
    }

    100% {
      clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
    }
  }

  .clip {
    clip-path: polygon(0% 8%, 100% 8%, 100% 15%, 0% 15%);
    animation-name: guide;
    animation-duration: 3s;
    animation-fill-mode: forwards;
    animation-timing-function: ease-out;
    animation-delay: 0.5s;
    animation-iteration-count: 1;
  }
</style>
