import clsx from "clsx";
import toast from "solid-toast";
import { For, Match, Show, Switch, createSignal } from "solid-js";
import { Puzzle, X } from "lucide-solid";
import { Menu } from "@ark-ui/solid";
import { Portal } from "solid-js/web";
import { useEditor } from "$app/context/editor";

export function PluginsDraw() {
  const {
    plugins,
    pluginErrors,
    dismissPluginError,
    installPlugin,
    uninstallPlugin,
    devMode,
    setDevMode,
  } = useEditor();

  let form: HTMLFormElement;
  let scriptUpload: HTMLInputElement;

  const [fileHungry, setFileHungry] = createSignal<"not-hungry" | "hungry" | "allergic">(
    "not-hungry",
  );

  return (
    <div class="flex flex-col gap-2">
      <h2 class="flex items-center gap-2 text-3xl">
        <Menu.Root positioning={{ placement: "bottom" }}>
          <Menu.ContextTrigger>
            <Puzzle size="2rem" />
          </Menu.ContextTrigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content class="z-20 rounded bg-white p-2 shadow">
                <Menu.Item
                  class="cursor-pointer"
                  value="dev-server"
                  onclick={() => setDevMode((prev) => !prev)}
                >
                  {devMode() ? "Disable Developer Mode" : "Enable Developer Mode"}
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        Plugins
      </h2>
      <h3 class="font-bold">Install Plugins</h3>
      <form class="hidden" ref={(el) => (form = el)}>
        <input
          id="the-plugin-moncher"
          type="file"
          accept=".js"
          multiple
          ref={(el) => (scriptUpload = el)}
          oninput={async (ev) => {
            handle: {
              if (!ev.currentTarget.files || ev.currentTarget.files?.length === 0) break handle;

              for (const file of ev.currentTarget.files) {
                installPlugin(await file.text());
              }
            }

            form.reset();
          }}
        />
      </form>
      <button
        class={clsx([
          "grid h-32 select-none place-content-center rounded border-2 border-dashed",
          fileHungry() === "not-hungry" && "border-zinc-300 text-zinc-500",
          fileHungry() === "hungry" && "border-green-300 text-green-800",
          fileHungry() === "allergic" && "border-red-300 text-red-800",
        ])}
        onclick={() => {
          scriptUpload.click();
        }}
        ondragover={(ev) => {
          ev.preventDefault();
          if (ev.dataTransfer?.items) {
            if (Array.from(ev.dataTransfer.items).every((i) => i.type.includes("javascript")))
              setFileHungry("hungry");
            else setFileHungry("allergic");
          }
        }}
        ondragexit={() => {
          setFileHungry("not-hungry");
        }}
        ondrop={async (ev) => {
          ev.preventDefault();
          setFileHungry("not-hungry");
          if (ev.dataTransfer?.items) {
            for (const item of ev.dataTransfer.items) {
              if (item.kind !== "file") {
                toast.error("Not a file...");
                continue;
              }

              const file = item.getAsFile();

              if (!file) {
                console.error("Item kind was file but getAsFile returned null");
                toast.error("Well that was weird... (check logs for details)");
                continue;
              }

              if (!item.type.includes("javascript")) {
                toast.error(`${file?.name} is not an installable plugin`);
                continue;
              }

              installPlugin(await file.text());
            }
          }
        }}
      >
        <div class="pointer-events-none">
          <Switch>
            <Match when={fileHungry() === "not-hungry"}>
              <p>Upload script</p>
            </Match>
            <Match when={fileHungry() === "hungry"}>
              <p>Drop file to install!</p>
            </Match>
            <Match when={fileHungry() === "allergic"}>
              <p>That's not a script we can install...</p>
            </Match>
          </Switch>
        </div>
      </button>
      <h3 class="font-bold">Installed</h3>
      <ul>
        <For each={plugins()}>
          {(item) => (
            <li class="flex justify-between">
              <span>
                {item.label} ({item.version}) - <span>{item.author}</span>
              </span>
              <Show when={!item.builtin}>
                <button
                  onclick={() => {
                    uninstallPlugin(item.id);
                  }}
                >
                  <X size="1rem" />
                </button>
              </Show>
            </li>
          )}
        </For>
        <Show when={plugins().length === 0}>
          <li class="w-full text-center text-zinc-500">No plugins installed!</li>
        </Show>
      </ul>
      <h3 class="font-bold">Errors</h3>
      <ul>
        <Switch>
          <Match when={pluginErrors().length === 0}>
            <li class="w-full text-center text-zinc-500">No Errors!</li>
          </Match>
          <Match when={pluginErrors().length > 0}>
            <For each={pluginErrors()}>
              {(item, index) => (
                <li class="flex items-center justify-between bg-red-200 text-red-950">
                  <span>{item}</span>
                  <button onclick={() => dismissPluginError(index())}>
                    <X size="1rem" />
                  </button>
                </li>
              )}
            </For>
          </Match>
        </Switch>
        <Show when={pluginErrors().length > 0}>
          <li class="w-full text-center text-red-950">Check console for more details</li>
        </Show>
      </ul>
    </div>
  );
}
