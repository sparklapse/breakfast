<script lang="ts">
  import { fade } from "svelte/transition";
  import connectInfo from "./connect-info.png";
  import toast from "svelte-french-toast";

  export let nextStep: () => void;
  export let connect: (password: string) => Promise<void>;

  let password: string = "";
</script>

<div
  class="absolute inset-0 grid place-content-center px-4"
  in:fade={{ delay: 100, duration: 100 }}
  out:fade={{ duration: 100 }}
>
  <div class="flex max-w-lg flex-col items-center gap-2">
    <div class="h-72 overflow-hidden">
      <img src={connectInfo} alt="" />
    </div>
    <p class="text-xl">
      Click "Show Connect Info" then copy and paste the password into the input below
    </p>
    <div class="flex items-center gap-2">
      <input
        class="rounded border border-slate-400 px-1"
        type="password"
        placeholder="Enter your OBS password here"
        bind:value={password}
      />
      <button
        class="rounded bg-green-700 px-2 text-white"
        on:click={() => {
          toast.promise(connect(password).then(nextStep), {
            loading: "Connecting to OBS",
            success: "Connected to OBS!",
            error: (err) => `Failed to connect to OBS: ${err.message}`,
          });
        }}
      >
        Connect
      </button>
    </div>
  </div>
</div>
