<script lang="ts">
  import toast from "svelte-french-toast";
  import { createAssetHelpers } from "@brekkie/io";
  import { Editor, createEditor } from "@brekkie/overlay";
  import { page } from "$app/stores";

  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { nanoid } from "nanoid";
  export let data: PageData;

  const save = async () => {
    const clone = $overlay.cloneNode(true);
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

    localStorage.setItem(`autosave.${$page.params.id}.sources`, sources);
    await data.pb.collection("overlays").update($page.params.id, {
      label: $label,
      sources,
      scripts: $scripts,
    });
  };

  createAssetHelpers({
    list: async (filter) => {
      const assets = await data.pb
        .collection("assets")
        .getFullList({ filter: `label ~ '${filter}'` });
      return assets.map((a) => ({
        id: a.id,
        label: a.label,
        url: data.pb.files.getUrl(a, a.asset),
      }));
    },
    upload: async (file) => {
      const url = await toast.promise(
        data.pb
          .collection("assets")
          .create(
            {
              label: file.name,
              asset: file,
            },
            {
              requestKey: nanoid(),
            },
          )
          .then((record) => data.pb.files.getUrl(record, record.asset)),
        {
          loading: `Uploading ${file.name}`,
          success: `${file.name} uploaded!`,
          error: (err) => `Failed to upload ${file.name}: ${err.message}`,
        },
      );

      return url;
    },
  });

  const {
    label,
    overlay,
    scripts: { scripts },
  } = createEditor({
    initial: {
      label: data.overlay.label,
      scripts: data.overlay.scripts,
      overlay: data.overlay.sources,
    },
    save,
  });
</script>

<Editor
  renderUrl="{window.location.host}/overlays/render/{data.overlay.id}"
  onsaveandclose={() => {
    toast.promise(
      save().then(() => goto("/breakfast/overlays")),
      {
        loading: "Saving overlay...",
        success: "Overlay saved!",
        error: (err) => `Failed to save overlay: ${err.message}`,
      },
    );
  }}
/>
