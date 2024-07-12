import { createResource, onCleanup, onMount } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { pb } from "$app/connections/pocketbase";
import type { Scene } from "$lib/core/scene";
import { useOBS } from "$app/context/obs";

export function Orchestrator() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { syncScene, request } = useOBS();

  const [_scene] = createResource(`scene-${params.id}`, async () => {
    let scene: Scene;
    if (search.sk) scene = await pb.breakfast.scenes.getSceneWithStreamKey(params.id, search.sk);
    else scene = await pb.collection<Scene>("scenes").getOne(params.id);

    if (!scene) navigate("/404");

    return scene;
  });

  onMount(async () => {
    const unsubscribe = await pb.collection<Scene>("scenes").subscribe(
      params.id,
      async (data) => {
        await syncScene({
          id: params.id,
          scene: data.record,
          streamKey: search.sk,
          targetSceneUuid: search.scene,
          dontOrchestrate: true,
        });
        await request({
          type: "CallVendorRequest",
          options: {
            vendorName: "obs-browser",
            requestType: "emit_event",
            requestData: {
              event_name: "breakfast-scene-update",
              event_data: {
                scene: data.record,
              },
            },
          },
        });
      },
      { query: { sk: search.sk } },
    );

    onCleanup(() => {
      unsubscribe();
    });
  });

  return <div />;
}
