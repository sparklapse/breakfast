<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { Trash2 } from "lucide-svelte";
  import { useEditor } from "$lib/editor/contexts";
  import { goto } from "$app/navigation";
  import { utils } from "./+page@.svelte";

  const {
    label,
    scripts: { scripts, addScript, removeScript },
  } = useEditor();

  let showMenu = false;
</script>

<div
  class={clsx([
    "fixed inset-y-4 left-4 z-50 w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow transition-transform",
    !showMenu && "-translate-x-[90%]",
  ])}
  on:pointerenter={() => {
    showMenu = true;
  }}
  on:pointerleave={() => {
    showMenu = false;
  }}
  on:pointerdown={(ev) => {
    ev.stopPropagation();
  }}
  on:pointerup={(ev) => {
    ev.stopPropagation();
  }}
  transition:fly|global={{ x: -50, duration: 250 }}
>
  <div class="mb-2 flex items-center justify-between">
    <h2 class="text-lg font-semibold">{$label}</h2>
    <button
      class="rounded-sm bg-slate-700 px-2 py-1 text-white shadow"
      on:click={async () => {
        if (!utils.save || !utils.clearAutosave) return;

        utils.clearAutosave();
        await toast.promise(utils.save(), {
          loading: "Saving...",
          success: "Scene saved!",
          error: (err) => `Failed to save scene: ${err.message}`,
        });
        goto("/breakfast/scenes");
      }}
    >
      Save & Close
    </button>
  </div>
  <hr class="my-2" />
  <h3 class="font-semibold">OBS Sync</h3>
  <div class="flex items-center justify-between">
    <h3 class="font-semibold">Scripts</h3>
    <div>
      <label
        class="cursor-pointer rounded-sm bg-slate-700 px-2 py-1 text-sm text-white shadow"
        for="script-installer"
      >
        Install Scripts
      </label>
      <input
        id="script-installer"
        class="hidden"
        type="file"
        accept=".js"
        multiple
        on:input={async (ev) => {
          const files = ev.currentTarget.files;
          if (!files) return;

          for (const file of files) {
            addScript({ filename: file.name, script: await file.text() });
          }
        }}
      />
    </div>
  </div>
  <ul>
    {#each $scripts as script}
      <li class="flex items-center justify-between">
        <span>{script.filename}</span>
        {#if !script.builtin}
          <button
            on:click={() => {
              removeScript(script.filename);
            }}
          >
            <Trash2 size="1rem" />
          </button>
        {/if}
      </li>
    {/each}
    {#if $scripts.length === 0}
      <li class="text-center text-sm text-slate-400">No scripts installed</li>
    {/if}
  </ul>
</div>
