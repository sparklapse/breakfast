<script lang="ts">
  import { Editor, createEditor } from "$lib/index.js";
  import { createAssetHelpers } from "@brekkie/io";

  createAssetHelpers({
    getAssets: () => Promise.resolve([]),
    uploadAsset: async (file) => {
      const url = URL.createObjectURL(file);
      return url;
    },
  });

  const existing = JSON.parse(localStorage.getItem("brekkie-overlay") ?? "{}");

  const {
    label,
    visibility,
    overlay,
    save,
    sources: { sources },
  } = createEditor({
    initial: {
      label: existing.label,
      visibility: existing.visibility,
      overlay: existing.sources,
    },
    save: () => {
      // Example save logic
      const clone = $overlay.cloneNode(true);
      let overlayText: string;
      if (clone.nodeType === Node.ELEMENT_NODE) {
        overlayText = (clone as HTMLElement).innerHTML;
        (clone as HTMLElement).remove();
      } else {
        const tmp = document.createElement("div");
        tmp.append(clone);
        overlayText = tmp.innerHTML;
        tmp.remove();
      }

      localStorage.setItem(
        "brekkie-overlay",
        JSON.stringify({
          label: $label,
          visibility: $visibility,
          sources: overlayText,
        }),
      );
    },
  });

  // Example autosave logic
  let abort: () => void | undefined;
  $: if ($sources) {
    abort?.();
    new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 1000);

      abort = () => {
        clearTimeout(timeout);
        reject();
      };
    })
      .then(() => save())
      .catch(() => {
        // Cancelled
      });
  }
</script>

<div class="h-screen w-screen overflow-hidden">
  <Editor
    renderUrl="http://localhost:5173"
    onsaveandclose={() => {
      window.alert("Nothing to close, but overlay will be saved");
    }}
  >
    <div slot="menu-scripts">
      <p>Custom Script Loader goes here</p>
    </div>
  </Editor>
</div>
