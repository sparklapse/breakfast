import toast from "solid-toast";
import { Show, createEffect, createResource, onCleanup, onMount } from "solid-js";
import { useBeforeLeave, useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { Loader2 } from "lucide-solid";
import { createOBS, useOBS } from "$app/context/obs";
import { createEditor } from "$app/context/editor";
import { BUILT_INS } from "$app/builtin";
import { pb } from "$app/connections/pocketbase";
import { Editor } from "./.lib";
import type { Scene } from "$lib/core/scene";
import { BREAKFAST_SCENE_PREFIX, devisId } from "$lib/obs";

export default function Provider() {
  const [obs, OBSProvider] = createOBS();

  onMount(async () => {
    if (!obs.connected() && obs.port() && obs.password()) {
      const result = await obs.connect();
      if (result.status === "error") {
        toast.error("Couldn't connect to OBS. Check OBS and open the OBS tab to try to reconnect.");
      }
    }
  });

  onCleanup(() => {
    if (obs.connected()) obs.disconnect();
  });

  return (
    <OBSProvider>
      <EditorPage />
    </OBSProvider>
  );
}

function EditorPage() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  // #region Editor
  const [editor, EditorProvider] = createEditor({
    sceneId: params.id,
    builtins: BUILT_INS,
    readOnly: Object.keys(search).includes("readonly"),
    saver: async () => {
      pb.collection("scenes").update(params.id, editor.serialize("object"), {
        requestKey: "save-scene",
      });
    },
  });

  let saveTimeout: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    // Track dependencies
    editor.saved();
    editor.editorOptions.readOnly;

    if (editor.saved() === true || editor.editorOptions.readOnly) return;

    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      editor.save();
    }, 500);
  });

  const [ready] = createResource(`scene-${params.id}`, async () => {
    const scene = await pb.collection<Scene>("scenes").getOne(params.id);

    editor.load(scene);
    return true;
  });

  useBeforeLeave((ev) => {
    if (ev.options?.state === "saved") return;
    if (ev.options?.state === "clone") return;

    ev.preventDefault();
    clearTimeout(saveTimeout);

    toast.promise(editor.save(), {
      loading: "Saving scene...",
      success: () => {
        navigate("/scenes", { state: "saved" });
        return "Scene saved!";
      },
      error: (err) => `Failed to save scene: ${err.message}`,
    });
  });

  // #endregion

  // #region OBS

  const { autoSync, setAutoSync, previews, setPreviews, connect, connected, syncScene, request } =
    useOBS();

  // Auto Sync
  createEffect(async () => {
    if (!autoSync()) return;
    if (editor.saved() !== true) return;

    if (!connected()) {
      const result = await connect();
      if (result.status === "error") {
        setAutoSync(false);
        toast.error(
          "Failed to connect and auto sync will be disabled. Please check your settings and ensure that OBS is running before enabling auto sync again",
          {
            duration: 10000,
          },
        );
        return;
      }
    }

    try {
      const streamKey = pb.authStore.modelStore()?.streamKey;
      await syncScene({ id: params.id, scene: editor.serialize("object"), streamKey });
    } catch (err: any) {
      toast.error(`Failed to auto sync: ${err.message ?? "unknown"}`);
      setAutoSync(false);
    }
  });

  // Previews
  const loadPreviews = async () => {
    if (!previews()) return;

    const sceneItemsRequest = await request({
      type: "GetSceneItemList",
      options: { sceneName: `${BREAKFAST_SCENE_PREFIX}${editor.label()}` },
    });

    if (sceneItemsRequest.status === "error") {
      toast.error(
        "Something went wrong when getting OBS previews so we've disabled them for now. Please check your settings and make sure to sync before enabling previews.",
      );
      setPreviews(false);
      return;
    }

    const sceneItems = sceneItemsRequest.data.sceneItems;
    sceneItems.forEach((i) => (i.sourceName = devisId(i.sourceName)));

    const previewImages = await Promise.allSettled(
      editor.sources
        .map((s, i) => [s, i] as const)
        .filter(([s]) => s.component === "obs|source")
        .map(async ([source, index]) => {
          const existing = sceneItems.find((i) => i.sourceName === source.label);
          if (!existing) throw new Error("Source doesn't exist in scene yet");

          const screenshotRequest = await request({
            type: "GetSourceScreenshot",
            options: { sourceUuid: existing.sourceUuid, imageFormat: "webp" },
            timeout: 5000,
          });
          if (screenshotRequest.status === "error") throw new Error("Failed to get screenshot");

          return {
            sourceIndex: index,
            preview: screenshotRequest.data.imageData,
          };
        }),
    );

    if (!previews()) return;

    if (previewImages.every((v) => v.status === "rejected")) {
      toast.error("All OBS sources failed to generate previews. Disabling previews.");
      setPreviews(false);
      return;
    }

    for (const preview of previewImages) {
      if (preview.status === "rejected") continue;
      editor.setSources(preview.value.sourceIndex, "editor", "preview", preview.value.preview);
    }
  };

  // Pull preview screenshots of sources every 1s
  createEffect(async () => {
    if (!previews()) return;
    if (!connected()) return;

    const interval = setInterval(loadPreviews, 1000);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  // #endregion

  return (
    <EditorProvider>
      <Editor />
      <Show when={!ready()}>
        <div
          class="absolute inset-0 grid place-content-center bg-white/20"
          style={{ "z-index": 999_999_999 }}
        >
          <p class="flex gap-2">
            <Loader2 class="animate-spin" /> Loading...
          </p>
        </div>
      </Show>
    </EditorProvider>
  );
}
