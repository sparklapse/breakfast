<script lang="ts">
  import Fuse from "fuse.js";
  import { useEditor, useViewport } from "@sparklapse/breakfast/overlay";
  import type {
    Source,
    SourceDefinition,
    TargetRoots,
    Transform,
  } from "@sparklapse/breakfast/overlay";

  const {
    utils: { screenToLocal },
  } = useViewport();
  const {
    sources: { createDefaultSource, addSource },
    selection: { singleSelect },
    scripts: { definitions },
  } = useEditor();

  let search = "";
  const fuse = new Fuse($definitions, {
    keys: [
      { name: "label", weight: 4 },
      { name: "subLabel", weight: 2 },
      { name: "tag", weight: 1 },
    ],
  });
  $: if ($definitions) fuse.setCollection($definitions);
  $: filteredSourceTypes = search ? fuse.search(search).map((r) => r.item) : $definitions;

  const applyDefaultsFromInputs = (source: Source, inputs: SourceDefinition["inputs"]) => {
    for (const input of inputs) {
      if ("group" in input) {
        applyDefaultsFromInputs(source, input.group);
        continue;
      }
      if (!input.defaultValue) continue;
      const [root, prop] = input.target.split(".") as [TargetRoots, string];
      if (root === "children") source["children"] = [input.defaultValue];
      else (source[root] as any)[prop] = input.defaultValue;
    }
  };

  const create = (tag?: string) => {
    if (!tag) tag = filteredSourceTypes[0].tag;
    if (!tag) return;

    const viewportSpace = screenToLocal([window.innerWidth / 2, window.innerHeight / 2]);
    const transform: Transform = {
      x: viewportSpace[0] - 200,
      y: viewportSpace[1] - 200,
      width: 400,
      height: 400,
      rotation: 0,
    };

    const source = createDefaultSource(tag, transform);
    addSource(source);
    singleSelect(source.id);
  };
</script>

<div class="flex w-full flex-col">
  <input
    class="rounded-t border border-zinc-200 px-2 py-1 outline-none"
    type="text"
    placeholder="Search for a source to add ({$definitions.length} total)"
    bind:value={search}
    on:keydown={({ key }) => {
      if (key !== "Enter") return;
      if (filteredSourceTypes.length === 0) return;

      create();
    }}
  />
  <ul class="flex h-72 flex-col overflow-y-auto rounded-b border-x border-b border-zinc-200">
    {#each filteredSourceTypes as st}
      <li>
        <button
          class="w-full px-2 py-1 text-left leading-none hover:bg-slate-50"
          on:click={() => {
            create(st.tag);
          }}
        >
          <p class="truncate">{st.label}</p>
          <p class="truncate text-sm text-slate-500">{st.label}</p>
        </button>
      </li>
    {/each}
  </ul>
</div>
