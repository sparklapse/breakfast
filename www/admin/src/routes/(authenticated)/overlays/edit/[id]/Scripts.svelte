<script lang="ts">
  import toast from "svelte-french-toast";
  import { fade, fly } from "svelte/transition";
  import { Dialog } from "bits-ui";
  import X from "lucide-svelte/icons/x";
  import Trash from "lucide-svelte/icons/trash-2";
  import { scriptType, useEditor, type Script } from "@sparklapse/breakfast/overlay";
  import { DEFAULT_SCRIPTS } from "$lib/overlay/scripts";

  export let reloadFrame: () => void;

  let warningDialog: boolean = false;
  let installDialog: boolean = false;
  let toBeInstalled: Script | undefined = undefined;

  const {
    scripts: { scripts, addScript, removeScript },
  } = useEditor();
</script>

<Dialog.Root bind:open={warningDialog}>
  <Dialog.Portal>
    <Dialog.Content
      class="fixed inset-0 isolate grid place-content-center backdrop-blur-sm backdrop-brightness-90"
      on:pointerdown={(ev) => {
        ev.stopPropagation();
        warningDialog = false;
      }}
      on:pointerup={(ev) => {
        ev.stopPropagation();
      }}
      transition={fade}
      transitionConfig={{ duration: 100 }}
    >
      <div
        class="relative z-10 max-w-md rounded bg-red-700 p-4 text-center text-lg text-white shadow-lg"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
        }}
        transition:fly={{ y: 50, duration: 200 }}
      >
        <button
          class="absolute right-2 top-2"
          on:click={() => {
            warningDialog = false;
          }}
        >
          <X />
        </button>
        <p class="text-3xl">WARNING</p>
        <p>
          Scripts are <strong>extremely</strong> powerful and let you do some cool things, but they
          can also contain malware and code that can <strong>control your whole account!</strong> Be
          1000% sure you know what's in this script and that it is safe to install.
        </p>
        <button
          class="rounded border border-white px-2"
          on:click={() => {
            warningDialog = false;
            installDialog = true;
          }}>I understand the risks</button
        >
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<Dialog.Root bind:open={installDialog}>
  <Dialog.Portal>
    <Dialog.Content
      class="fixed inset-0 isolate grid place-content-center"
      on:pointerdown={(ev) => {
        ev.stopPropagation();
        installDialog = false;
      }}
      on:pointerup={(ev) => {
        ev.stopPropagation();
      }}
      transition={fade}
      transitionConfig={{ duration: 100 }}
    >
      <div
        class="z-10 w-screen max-w-md rounded bg-white p-4 shadow-lg"
        on:pointerdown={(ev) => {
          ev.stopPropagation();
        }}
        transition:fly={{ y: 50, duration: 200 }}
      >
        {#if toBeInstalled}
          <p>Installing script: {toBeInstalled.label} (v{toBeInstalled?.version})</p>
          <p>Sources: {toBeInstalled.sources?.length ?? 0}</p>
          <p>Actions: {toBeInstalled.actions?.length ?? 0}</p>
          <div class="mt-2 flex justify-between gap-2">
            <button
              class="w-full rounded border border-slate-700 text-slate-700"
              on:click={() => {
                installDialog = false;
              }}>Cancel</button
            >
            <button
              class="w-full rounded bg-slate-700 text-white"
              on:click={() => {
                if (!toBeInstalled) return;
                addScript(toBeInstalled);
                installDialog = false;
                toast.success("Script installed!");
              }}>Install</button
            >
          </div>
        {:else}
          <p>Error: Installing null script</p>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<div class="flex justify-between gap-2">
  <label
    class="w-full cursor-pointer rounded bg-slate-700 text-center text-sm text-white"
    for="install-script"
  >
    Install script
  </label>
  <input
    class="hidden"
    type="file"
    name="install-script"
    id="install-script"
    accept="application/json"
    on:input={async (ev) => {
      if (!ev.currentTarget.files || ev.currentTarget.files?.length !== 1) return;

      const data = JSON.parse(await ev.currentTarget.files[0].text());
      const parsed = scriptType.safeParse(data);

      if (!parsed.success) return toast.error("Invalid script file");
      const exists = $scripts.findIndex((s) => s.id === parsed.data.id);
      if (exists !== -1)
        return toast.error(
          "Script is already installed. Remove the existing script first to update.",
        );

      toBeInstalled = parsed.data;
      warningDialog = true;
    }}
  />
  <button
    class="w-full rounded border border-slate-700 text-sm text-slate-700"
    on:click={() => {
      for (const s of DEFAULT_SCRIPTS) {
        removeScript(s.id);
        addScript(s);
      }
      reloadFrame();
    }}
  >
    Reinstall Basics
  </button>
</div>
<ul>
  {#each $scripts as script}
    <li class="flex justify-between" title={script.id}>
      <span>
        {script.label} <span class="text-sm text-slate-400">(v{script.version})</span>
      </span>
      <button
        on:click={() => {
          removeScript(script.id);
        }}
      >
        <Trash class="text-red-900" size="1rem" />
      </button>
    </li>
  {/each}
</ul>
