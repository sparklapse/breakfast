<script lang="ts">
  import { useEditor } from "$lib/editor/contexts";

  const {
    sources: { updateSource },
    selection: { selectedSource },
  } = useEditor();

  let fontSize = parseInt($selectedSource?.style["font-size"] ?? "42");
  const updateFontSize = () => {
    if (!$selectedSource) return;
    updateSource($selectedSource.id, {
      ...$selectedSource,
      style: {
        ...$selectedSource.style,
        "font-size": `${fontSize}px`,
      },
    });
  };
  $: if (fontSize) updateFontSize();

  let fontFamily = $selectedSource?.style["font-family"] ?? "Arial";
  $: if ($selectedSource)
    updateSource($selectedSource.id, {
      ...$selectedSource,
      style: {
        ...$selectedSource.style,
        "font-family": fontFamily,
      },
    });

  let text = $selectedSource?.children.at(0) ?? "";
  $: if ($selectedSource)
    updateSource($selectedSource.id, {
      ...$selectedSource,
      children: [text],
    });
</script>

{#if !$selectedSource}
  <p>Error: Source not selected</p>
{:else}
  <p>Editing a paragraph</p>
  <input type="number" min="1" bind:value={fontSize} />
  <input type="text" bind:value={fontFamily} />
  <textarea
    class="w-full rounded border border-slate-400"
    placeholder="Enter some text"
    bind:value={text}
  ></textarea>
{/if}
