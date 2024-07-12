import clsx from "clsx";
import toast from "solid-toast";
import { For, Match, Show, Switch, createResource } from "solid-js";
import { Portal } from "solid-js/web";
import { A, useNavigate } from "@solidjs/router";
import { Menu } from "@ark-ui/solid";
import { Layers3, MenuIcon, RefreshCw, SquarePlus } from "lucide-solid";
import { pb } from "$app/connections/pocketbase";
import ToasterCard from "$app/components/layouts/ToasterCard";
import type { Scene } from "$lib/core";

export default function ScenesPage() {
  const navigate = useNavigate();
  const [scenes, { refetch, mutate }] = createResource(
    "scenes.list",
    async () => {
      return (
        await pb.collection<{ id: string; label: string }>("scenes").getList(undefined, undefined, {
          fields: "id,label",
        })
      ).items;
    },
    {
      initialValue: [],
    },
  );

  const newScene = async () => {
    const scene = { label: "Untitled Scene", plugins: [], sources: [] } satisfies Scene;
    const result = await pb
      .collection("scenes")
      .create({ ...scene, owner: pb.authStore.modelStore()?.id, visibility: "PRIVATE" });

    mutate((prev) => [...prev, { id: result.id, label: "Untitled Scene" }]);
    navigate(`/scenes/edit/${result.id}`);
  };

  const deleteScene = async (id: string) => {
    await pb.collection("scenes").delete(id);

    mutate((prev) => [...prev.filter((s) => s.id !== id)]);
  };

  return (
    <>
      <ToasterCard
        title={
          <h1 class="flex gap-2">
            <Layers3 size="3rem" /> Scenes
          </h1>
        }
        actions={
          <>
            <button
              class={clsx([scenes.loading && "pointer-events-none animate-spin"])}
              onclick={() => refetch()}
            >
              <RefreshCw />
            </button>
            <button
              class="flex gap-1 rounded bg-white p-1 shadow"
              onclick={() => {
                toast.promise(newScene(), {
                  loading: "Creating new scene...",
                  success: "New scene created!",
                  error: (err) => `Failed to create scene: ${err.message}`,
                });
              }}
            >
              <SquarePlus /> New Scene
            </button>
          </>
        }
        footer={<A href="/">Back</A>}
      >
        <div class="py-2">
          <Switch>
            <Match when={scenes.error}>
              <div class="absolute inset-0 grid h-full place-content-center">
                <div>
                  <p>Uh oh</p>
                  <Switch>
                    <Match when={scenes.error.status === 401}>
                      <p>Looks like you're not signed in...</p>
                      <A class="underline" href="/account">
                        Sign in
                      </A>
                    </Match>
                    <Match when={scenes.error.status === 401}>
                      <p>Something wen't wrong: {scenes.error.response.message}</p>
                    </Match>
                  </Switch>
                </div>
              </div>
            </Match>
            <Match when={scenes()}>
              <ul>
                <For each={scenes()}>
                  {(item) => (
                    <li class="px-2 hover:bg-black/5">
                      <Menu.Root positioning={{ placement: "bottom" }}>
                        <div class="flex w-full justify-between">
                          <Menu.ContextTrigger
                            class="w-full"
                            asChild={(props) => (
                              <A href={`/scenes/edit/${item.id}`} {...props}>
                                {item.label}
                              </A>
                            )}
                          />
                          <Menu.Trigger>
                            <MenuIcon size="1rem" />
                          </Menu.Trigger>
                        </div>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content class="min-w-14 rounded bg-white py-2 shadow *:cursor-pointer *:px-2">
                              <Menu.Item
                                value="view"
                                asChild={(props) => (
                                  <A
                                    href={`/scenes/view/${item.id}${pb.authStore.modelStore()?.streamKey ? `?sk=${pb.authStore.modelStore()!.streamKey}` : ""}`}
                                    target="_blank"
                                    {...props}
                                  >
                                    View in new tab
                                  </A>
                                )}
                              />
                              <Menu.Item
                                class="bg-red-100 text-red-950"
                                value="delete"
                                onclick={() => {
                                  toast.promise(deleteScene(item.id), {
                                    loading: "Deleting scene...",
                                    success: "Deleted scene!",
                                    error: (err) => `Failed to delete scene: ${err.message}`,
                                  });
                                }}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    </li>
                  )}
                </For>
                <Show when={scenes().length === 0}>
                  <p class="w-full text-center text-zinc-400">
                    {scenes.loading ? "Loading..." : "No scenes yet! I wonder what we'll create?"}
                  </p>
                </Show>
              </ul>
            </Match>
          </Switch>
        </div>
      </ToasterCard>
    </>
  );
}
