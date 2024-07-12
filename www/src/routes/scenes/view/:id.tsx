import { Match, Show, Switch, createResource, createSignal, onMount } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { sceneType } from "$lib/core/scene";
import { pb } from "$app/connections/pocketbase";
import { Loader2 } from "lucide-solid";
import { Viewer } from "./.lib/Viewer";
import type { Scene } from "$lib/core/scene";

export default function ViewerPage() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const [scene, { mutate }] = createResource(`scene-${params.id}`, async () => {
    let scene: Scene;
    if (search.sk) scene = await pb.breakfast.scenes.getSceneWithStreamKey(params.id, search.sk);
    else scene = await pb.collection<Scene>("scenes").getOne(params.id);

    if (!scene) navigate("/404");

    return scene;
  });

  onMount(() => {
    window.addEventListener("breakfast-scene-update", (ev) => {
      const detail = (ev as CustomEvent).detail;
      const parsed = sceneType.safeParse(detail?.scene);
      if (!parsed.success) return;
      if (JSON.stringify(scene()?.plugins ?? []) !== JSON.stringify(parsed.data.plugins)) {
        window.location.reload();
        return;
      }

      mutate(parsed.data);
    });
  });

  const indicies = () => {
    return search.i?.split(",").map((i) => parseInt(i));
  };

  return (
    <>
      <Show when={scene.loading}>
        <div class="absolute inset-0 grid place-content-center text-white">
          <div class="flex gap-2">
            <Loader2 class="animate-spin" />
            <p>Loading...</p>
          </div>
        </div>
      </Show>
      <Switch>
        <Match when={scene.error}>
          <div class="absolute inset-0 text-white">
            <p>Error:</p>
            <pre>{JSON.stringify(scene.error, undefined, 2)}</pre>
          </div>
        </Match>
        <Match when={scene()}>
          <div class="absolute inset-0 overflow-hidden">
            <Viewer scene={scene()!} indicies={indicies()} />
          </div>
        </Match>
      </Switch>
      <style>{`html,body {background-color: transparent !important;}`}</style>
    </>
  );
}
