<script lang="ts">
  import clsx from "clsx";
  import Color from "color";
  import { fly } from "svelte/transition";
  import ArrowDown from "lucide-svelte/icons/arrow-down";
  import ArrowUp from "lucide-svelte/icons/arrow-up";
  import Trash from "lucide-svelte/icons/trash-2";
  import { helpers, inputs, DefinedEditor } from "@brekkie/io";
  import { useEditor } from "$lib/logic/index.js";
  import type { SourceDefinition } from "$lib/types/script.js";

  const { InputGroupRow } = helpers;
  const { Text, Number } = inputs;

  const {
    sources: {
      sources,
      getSourceTargetValue,
      updateSourceTargetValue,
      moveSourceUp,
      moveSourceDown,
      moveSourceToTop,
      moveSourceToBottom,
      removeSource,
    },
    selection: { selectedIds, selectedSource, singleSelect, addSelect, deselect },
    scripts: { definitions },
  } = useEditor();

  let tab: "properties" | "sources" = "sources";

  const getEditorValues = (inputs: SourceDefinition["inputs"]) => {
    if (!$selectedSource?.id) return {} as Record<string, any>;

    let values: Record<string, any> = {};
    for (const input of inputs) {
      if ("group" in input) {
        const group = getEditorValues(input.group);
        values = { ...values, ...group };
        continue;
      }

      values[input.id] = getSourceTargetValue($selectedSource.id, input.target);
    }

    return values;
  };
</script>

<div
  class="fixed right-4 top-4 h-[24rem] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow transition-transform"
  on:pointerdown={(ev) => {
    ev.stopPropagation();
  }}
  on:pointerup={(ev) => {
    ev.stopPropagation();
  }}
  transition:fly|global={{ x: 50, duration: 250 }}
>
  <div class="relative mb-2 flex items-center justify-between gap-1">
    <button
      class="w-full"
      on:click={() => {
        tab = "sources";
      }}
    >
      Sources
    </button>
    <button
      class="w-full"
      on:click={() => {
        tab = "properties";
      }}
    >
      Properties
    </button>
    <div
      class={clsx([
        "absolute bottom-0 h-0.5 w-1/2 bg-slate-700 transition-[left]",
        tab === "sources" ? "left-0" : "left-1/2",
      ])}
    />
  </div>
  {#if tab === "sources"}
    <ul>
      {#each structuredClone($sources).reverse() as source}
        {@const def = $definitions.find((d) => d.tag === source.tag)}
        <li class={clsx([$selectedIds.includes(source.id) && "bg-blue-50"])}>
          <button
            class="flex w-full items-center justify-between"
            on:click={(ev) => {
              if (ev.shiftKey) {
                if ($selectedIds.length === 0) singleSelect(source.id);
                else {
                  const start = $sources.findIndex((s) => s.id === $selectedIds[0]);
                  const end = $sources.findIndex((s) => s.id === source.id);
                  const newSelection = $sources.slice(
                    Math.min(start, end),
                    Math.max(start, end) + 1,
                  );
                  deselect();
                  for (const s of newSelection) {
                    addSelect(s.id);
                  }
                }
              } else singleSelect(source.id);
            }}
          >
            <span>{source.props.label || (def?.label ?? "Unknown Element")}</span>
            <div class="flex items-center gap-1">
              <button
                on:click={(ev) => {
                  ev.stopPropagation();
                  if (ev.shiftKey) moveSourceToTop(source.id);
                  else moveSourceUp(source.id);
                }}
              >
                <ArrowUp size="1rem" />
              </button>
              <button
                on:click={(ev) => {
                  ev.stopPropagation();
                  if (ev.shiftKey) moveSourceToBottom(source.id);
                  else moveSourceDown(source.id);
                }}
              >
                <ArrowDown size="1rem" />
              </button>
              <button
                on:click={(ev) => {
                  ev.stopPropagation();
                  removeSource(source.id);
                }}
              >
                <Trash class="text-red-900" size="1rem" />
              </button>
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {:else if tab === "properties"}
    {#if !$selectedSource || $selectedIds.length > 1}
      <p class="text-center text-sm text-slate-700">{$selectedIds.length} Sources selected</p>
    {:else}
      <InputGroupRow>
        <Text
          label="Source Label"
          value={$selectedSource.props.label ?? ""}
          options={{ placeholder: "Unnamed source" }}
          onchange={(t) => {
            updateSourceTargetValue($selectedSource.id, "props.label", t);
          }}
        />
        <Number
          label="Rotation"
          value={$selectedSource.transform.rotation}
          onchange={(n) => {
            updateSourceTargetValue($selectedSource.id, "transform.rotation", n);
          }}
        />
      </InputGroupRow>
      <InputGroupRow>
        <Number
          label="X"
          value={$selectedSource.transform.x}
          onchange={(n) => {
            updateSourceTargetValue($selectedSource.id, "transform.x", n);
          }}
        />
        <Number
          label="Y"
          value={$selectedSource.transform.y}
          onchange={(n) => {
            updateSourceTargetValue($selectedSource.id, "transform.y", n);
          }}
        />
        <Number
          label="Width"
          value={$selectedSource.transform.width}
          onchange={(n) => {
            updateSourceTargetValue($selectedSource.id, "transform.width", n);
          }}
        />
        <Number
          label="Height"
          value={$selectedSource.transform.height}
          onchange={(n) => {
            updateSourceTargetValue($selectedSource.id, "transform.height", n);
          }}
        />
      </InputGroupRow>

      {@const definition = $definitions.find((d) => d.tag === $selectedSource.tag)}
      {#if definition}
        <DefinedEditor
          inputs={definition.inputs}
          values={getEditorValues(definition.inputs)}
          onchange={(input, value) => {
            if (value instanceof Color) value = value.hex();
            const formatted = input.format ? input.format.replace("{}", value.toString()) : value;
            if (input.target === "children")
              updateSourceTargetValue($selectedSource.id, input.target, [formatted]);
            else updateSourceTargetValue($selectedSource.id, input.target, formatted);
          }}
        />
      {/if}
    {/if}
  {/if}
</div>
