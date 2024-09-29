<script lang="ts">
  import clsx from "clsx";
  import Color from "color";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { ArrowDown, ArrowUp, Pin, PinOff } from "lucide-svelte";
  import { useEditor, type SourceDefinition } from "@sparklapse/breakfast/overlay";
  import { helpers, inputs, DefinedEditor } from "@sparklapse/breakfast/io";

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
    },
    selection: { selectedIds, selectedSource, singleSelect, addSelect, deselect },
    scripts: { definitions },
  } = useEditor();

  let showInspector = false;
  let pinOpen = true;
  let tab: "source" | "overlay" = "overlay";

  onMount(() => {
    const saved = localStorage.getItem("editor.inspector.pinOpen");
    if (saved) {
      try {
        const restore = JSON.parse(saved);
        pinOpen = !!restore;
      } catch {
        localStorage.removeItem("editor.inspector.pinOpen");
      }
    }
  });

  // Used for keying a rerender of the inspector based on whats being edited
  $: editingSource = $selectedIds.length === 1 ? $selectedIds[0] : "none";

  const getEditorValues = (inputs: SourceDefinition["inputs"]) => {
    if (!$selectedSource?.id) return {} as Record<string, any>;

    let values: Record<string, any> = {};
    for (const input of inputs) {
      if ("group" in input) {
        const group = getEditorValues(input.group);
        values = { ...values, group };
        continue;
      }

      values[input.id] = getSourceTargetValue($selectedSource.id, input.target);
    }

    return values;
  };
</script>

<div
  class={clsx([
    "fixed right-4 top-4 h-[24rem] w-full max-w-md overflow-y-auto rounded border border-slate-200 bg-white p-4 shadow transition-transform",
    !(showInspector || pinOpen) && "translate-x-[90%]",
  ])}
  on:pointerenter={() => {
    showInspector = true;
  }}
  on:pointerleave={() => {
    showInspector = false;
  }}
  on:pointerdown={(ev) => {
    ev.stopPropagation();
  }}
  on:pointerup={(ev) => {
    ev.stopPropagation();
  }}
  transition:fly|global={{ x: 50, duration: 250 }}
>
  <button
    class={clsx([
      "absolute left-1 top-1 z-10 p-1 transition-opacity",
      !(showInspector || pinOpen) && "opacity-25",
    ])}
    on:click={() => {
      pinOpen = !pinOpen;
      localStorage.setItem("editor.inspector.pinOpen", JSON.stringify(pinOpen));
    }}
  >
    {#if pinOpen}
      <PinOff size="1rem" />
    {:else}
      <Pin size="1rem" />
    {/if}
  </button>
  <div class="relative mb-2 flex items-center justify-between gap-1">
    <button
      class="w-full"
      on:click={() => {
        tab = "overlay";
      }}
    >
      Overlay
    </button>
    <button
      class="w-full"
      on:click={() => {
        tab = "source";
      }}
    >
      Source
    </button>
    <div
      class={clsx([
        "absolute bottom-0 h-0.5 w-1/2 bg-slate-700 transition-[left]",
        tab === "overlay" ? "left-0" : "left-1/2",
      ])}
    />
  </div>
  {#if tab === "overlay"}
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
            </div>
          </button>
        </li>
      {/each}
    </ul>
  {:else if tab === "source"}
    {#if !$selectedSource}
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
        <DefinedEditor inputs={definition.inputs} values={getEditorValues(definition.inputs)} onchange={(input, value) => {
        if (value instanceof Color) value = value.hex();
        const formatted = input.format ? input.format.replace("{}", value.toString()) : value;
        if (input.target === "children")
          updateSourceTargetValue($selectedSource.id, input.target, [formatted]);
        else updateSourceTargetValue($selectedSource.id, input.target, formatted);
        }} />
      {/if}
    {/if}
  {/if}
</div>
