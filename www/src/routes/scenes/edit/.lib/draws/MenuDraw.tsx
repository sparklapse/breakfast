import clsx from "clsx";
import toast from "solid-toast";
import { Show, Switch, createSignal } from "solid-js";
import { Match } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { LogOut, Menu, Save } from "lucide-solid";
import { sceneType } from "$lib/core";
import { pb } from "$app/connections/pocketbase";
import { useEditor } from "$app/context/editor";
import type { Scene } from "$lib/core";

export function MenuDraw() {
  const navigate = useNavigate();
  const { editorOptions, setEditorOptions, setId, label, setLabel, saved, save, serialize, load } =
    useEditor();
  const [imported, setImported] = createSignal<Scene>();

  const createEditableCopy = async () => {
    setLabel((prev) => "Copy of " + prev);
    const result = await pb.collection("scenes").create(serialize("object"));

    return { id: result.id };
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-3xl">
          <Menu size="2rem" /> Menu
        </h2>
        <Switch>
          <Match when={editorOptions.readOnly}>
            <A href="/" class="flex h-fit items-center gap-1">
              <LogOut size="1rem" />
              Exit
            </A>
          </Match>
          <Match when={!editorOptions.readOnly}>
            <A href="/scenes" class="flex h-fit items-center gap-1">
              <Save class={clsx([saved() !== true && "animate-pulse"])} size="1rem" />
              Save and exit
            </A>
          </Match>
        </Switch>
      </div>

      <h3 class="font-bold">Scene Label</h3>
      <div class="flex items-center gap-2">
        <input
          type="text"
          name="label"
          class="w-full rounded border px-2 py-1"
          placeholder="Name your scene..."
          value={label()}
          oninput={(ev) => {
            setLabel(ev.currentTarget.value);
          }}
        />
        <button
          onclick={() => {
            toast.promise(save(), {
              loading: "Saving scene...",
              success: "Scene Saved!",
              error: (err) => `Failed to save scene: ${err.message}`,
            });
          }}
        >
          <Save />
        </button>
      </div>
      <div class="flex gap-2">
        <Show when={editorOptions.readOnly}>
          <button
            class="rounded border border-green-900 bg-green-50 px-2"
            onclick={() => {
              toast.promise(createEditableCopy(), {
                loading: "Creating a copy...",
                success: ({ id }) => {
                  navigate(`/scenes/edit/${id}`, { state: "clone" });
                  setId(id);
                  setEditorOptions("readOnly", false);
                  return "Copy created!";
                },
                error: (err) => {
                  return `Failed to create copy: ${err.message}`;
                },
              });
            }}
          >
            Create editable copy
          </button>
        </Show>
      </div>

      <h3 class="font-bold">Import & Export</h3>
      <div class="flex gap-2">
        <Switch>
          <Match when={!imported()}>
            <label class="flex w-full items-baseline gap-2">
              <input
                class="hidden"
                type="file"
                accept="*.brekkie"
                oninput={async (ev) => {
                  if (!ev.currentTarget.files) return;
                  const file = ev.currentTarget.files[0];

                  try {
                    const parsed = sceneType.safeParse(JSON.parse(await file.text()));
                    if (!parsed.success) {
                      toast.error("File is not a valid brekkie file");
                      return;
                    }

                    setImported(parsed.data);
                  } catch {
                    toast.error("Failed to parse file");
                  }
                }}
              />
              <span class="cursor-pointer rounded border px-2">Import</span>
              <span>Select a file</span>
            </label>
          </Match>
          <Match when={imported()}>
            <button
              class="w-full rounded border border-red-300 bg-red-50"
              onclick={async () => {
                await toast.promise(load(imported()!), {
                  loading: "Importing...",
                  success: "Import successful!",
                  error: (err) => `Failed to import scene: ${err.message}`,
                });

                setImported(undefined);
              }}
            >
              Click again to confirm
            </button>
          </Match>
        </Switch>
        <button
          class="w-full rounded border px-2"
          onclick={async () => {
            const json = new Blob([serialize("string")], {
              type: "application/json+brekkie.stream",
            });

            const url = URL.createObjectURL(json);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${label()}.brekkie`;
            document.body.appendChild(link);

            link.click();
            link.remove();

            URL.revokeObjectURL(url);
          }}
        >
          Export
        </button>
      </div>

      <h3 class="font-bold">Editor Options</h3>
      <div class="flex gap-2">
        <label>Hide Grid</label>
        <input
          type="checkbox"
          checked={editorOptions.hideGrid}
          oninput={(ev) => {
            setEditorOptions("hideGrid", ev.currentTarget.checked);
          }}
        />
      </div>
      <div class="flex gap-2">
        <label>Grid Brightness</label>
        <input
          type="range"
          min={20}
          max={91}
          step={1}
          value={editorOptions.backgroundBrightness}
          oninput={(ev) => {
            const parsed = parseInt(ev.currentTarget.value);
            if (Number.isNaN(parsed)) return;

            setEditorOptions("backgroundBrightness", parsed);
          }}
        />
      </div>
    </div>
  );
}
