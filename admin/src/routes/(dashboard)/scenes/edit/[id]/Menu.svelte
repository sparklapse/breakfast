<script lang="ts">
  import clsx from "clsx";
  import toast from "svelte-french-toast";
  import { fly } from "svelte/transition";
  import { useEditor } from "$lib/hooks/editor";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import type { BreakfastPocketBase } from "$lib/connections/pocketbase";
  import { Trash2 } from "lucide-svelte";

  export let pb: BreakfastPocketBase;

  const {
    label,
    scene,
    scripts: { scripts, addScript, removeScript },
  } = useEditor();

  let showMenu = false;

  const save = async () => {
    const clone = $scene.cloneNode(true);
    let sources: string;
    if (clone.nodeType === Node.ELEMENT_NODE) {
      sources = (clone as HTMLElement).innerHTML;
      (clone as HTMLElement).remove();
    } else {
      const tmp = document.createElement("div");
      tmp.append(clone);
      sources = tmp.innerHTML;
      tmp.remove();
    }

    await pb.collection("scenes").update($page.params.id, {
      sources,
    });
  };
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
        await toast.promise(save(), {
          loading: "Saving...",
          success: () => {
            return "Scene saved!";
          },
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
        <button><Trash2 size="1rem" /></button>
      </li>
    {/each}
    {#if $scripts.length === 0}
      <li class="text-center text-sm text-slate-400">No scripts installed</li>
    {/if}
  </ul>
</div>
