import { calculateParams } from "./kinds";
import { devisId, invisId, invisPrefix } from "../naming";
import type { Scene } from "$lib/core";
import type { Source } from "./types";
import type { OBSWebSocket } from "../ws";
import type { CreateInputOptions } from "../types";

export type SyncOptions = {
  id: string;
  scene: Scene;
  targetSceneUuid?: string;
  viewPath?: `/${string}/`;
  orchestratePath?: `/${string}/`;
  streamKey?: string;
  dontPrune?: boolean;
  dontOrchestrate?: boolean;
  ws: OBSWebSocket;
};

export const BREAKFAST_SCENE_PREFIX = "🥞";
export const BREAKFAST_ORCHESTRATOR = "🧠";

/**
 *
 * @param syncOptions - The options to configure the sync.
 */
export async function sync({
  id,
  scene,
  targetSceneUuid,
  streamKey,
  dontPrune,
  dontOrchestrate,
  ws,
  ...options
}: SyncOptions) {
  if (!ws.connected) throw new Error("Not connected");
  const viewPath: NonNullable<SyncOptions["viewPath"]> =
    options.viewPath ?? "/breakfast/scenes/view/";
  const orchestratePath: NonNullable<SyncOptions["orchestratePath"]> =
    options.orchestratePath ?? "/breakfast/scenes/orchestrate/";

  const inputKindsRequest = await ws.request({ type: "GetInputKindList", options: {} });
  if (inputKindsRequest.status === "error") throw new Error("Failed to get input kinds");

  let defaultSettings: Record<string, any> = {};
  for (const kind of inputKindsRequest.data.inputKinds) {
    const settingsRequest = await ws.request({
      type: "GetInputDefaultSettings",
      options: { inputKind: kind },
    });
    if (settingsRequest.status === "error")
      throw new Error(`Failed to get default settings for '${kind}' kind`);
    defaultSettings[kind] = settingsRequest.data.defaultInputSettings;
  }

  // Build the OBS Scene data
  let obsScene: Source[] = [];
  for (let i = 0; i < scene.sources.length; i++) {
    const source = scene.sources[i];

    // Append an OBSSource
    if (source.component === "obs|source") {
      if (typeof source.data.kind !== "string" || !source.data.kind)
        throw new Error(`OBS Source '${source.label}' has not been configured with a kind`);
      if (!inputKindsRequest.data.inputKinds.includes(source.data.kind))
        throw new Error(`OBS doesn't support the '${source.data.kind}' kind`);

      let settings = source.data.settings;
      if (!settings) settings = defaultSettings[source.data.kind];

      if (!settings)
        throw new Error(
          `Failed to get settings for '${source.label}' of kind '${source.data.kind}'`,
        );

      obsScene.push({
        breakfast: false,
        kind: source.data.kind,
        label: source.label,
        settings,
        transform: source.transform,
      });
      continue;
    }

    // Append a BreakfastSource
    let last = obsScene.at(-1);
    if (!last || !last.breakfast) {
      last = {
        breakfast: true,
        label: `${BREAKFAST_SCENE_PREFIX}Sources[%indices%]`,
        kind: "browser_source",
        settings: {
          url: "",
        },
        indices: [],
      };
      obsScene.push(last);
    }

    last.indices.push(i);
  }

  // For each BreakfastSource, update the URL to include the streamKey and indices as part of the query
  for (const source of obsScene) {
    if (source.breakfast) {
      source.settings.url = `${window.location.origin}${viewPath}${id}?i=${source.indices.join(",")}${streamKey ? `&sk=${streamKey}` : ""}`;
      source.label = source.label.replace("%indices%", source.indices.join(","));
    }
  }

  // Existing scene check
  const list = await ws.request({ type: "GetSceneList", options: undefined });
  if (list.status === "error") throw new Error("Failed to get scenes from OBS");

  const sceneLabel = `${BREAKFAST_SCENE_PREFIX}${scene.label}`;

  let sceneUuid: string;
  if (targetSceneUuid) {
    sceneUuid = targetSceneUuid;
    const existingScene = list.data.scenes.find((v) => v.sceneUuid === targetSceneUuid);
    if (!existingScene) throw new Error("Target scene doesn't exist");

    if (existingScene.sceneName.startsWith(BREAKFAST_SCENE_PREFIX))
      await ws.request({
        type: "SetSceneName",
        options: { sceneUuid, newSceneName: `${sceneLabel}${invisId()}` },
      });
  } else {
    const existingScene = list.data.scenes.find((v) => v.sceneName === sceneLabel);
    if (!existingScene) {
      const newScene = await ws.request({
        type: "CreateScene",
        options: { sceneName: `${sceneLabel}${invisId()}` },
      });
      if (newScene.status === "error")
        throw new Error(`Failed to create scene - ${newScene.error?.message ?? "unknown"}`);
      sceneUuid = newScene.data.sceneUuid;
    } else {
      sceneUuid = existingScene.sceneUuid;
    }
  }

  const existingSourcesRequest = await ws.request({
    type: "GetSceneItemList",
    options: { sceneUuid },
  });
  if (existingSourcesRequest.status === "error") throw new Error("Failed to get existing sources");
  let existingSources = existingSourcesRequest.data.sceneItems;

  // Sync sources
  let ownedIds: { sceneItemId: number; index: number }[] = [];
  const results = await Promise.allSettled(
    obsScene.map(async (source, index) => {
      const params = calculateParams(source);

      let sceneItemId: number;

      const existingSource = existingSources.find((s) => devisId(s.sourceName) === source.label);

      if (!existingSource || existingSource.inputKind !== source.kind) {
        const inputResult = await ws.request({
          type: "CreateInput",
          options: {
            sceneUuid,
            inputKind: source.kind,
            inputName: `${source.label}${invisId()}`,
            inputSettings: params.settings,
          },
        });

        if (inputResult.status === "error")
          throw new Error(`Failed to create input - ${inputResult.error?.message ?? "unknown"}`);

        sceneItemId = inputResult.data.sceneItemId;
      } else {
        sceneItemId = existingSource.sceneItemId;
        await ws.request({
          type: "SetInputSettings",
          options: {
            inputName: existingSource.sourceName,
            inputSettings: params.settings,
          },
        });

        if (source.kind === "browser_source" && !dontOrchestrate) {
          await ws.request({
            type: "PressInputPropertiesButton",
            options: { inputName: existingSource.sourceName, propertyName: "refreshnocache" },
          });
        }
      }

      const transformResult = await ws.request({
        type: "SetSceneItemTransform",
        options: {
          sceneUuid,
          sceneItemId,
          sceneItemTransform: params.transform,
        },
      });
      if (transformResult.status === "error")
        throw new Error(`Failed to set scene item transform for ${source.label}`);

      ownedIds.push({ sceneItemId, index });
    }),
  );

  if (results.some((p) => p.status === "rejected")) {
    console.error(results);
    throw new Error("Failed to sync sources. Check logs for details.");
  }

  // Sync Orchestrator
  let orchestratorSceneItemId: number | undefined = undefined;
  orchestrator: {
    if (dontOrchestrate) break orchestrator;

    const existingOrchestrator = existingSources.find(
      (s) => devisId(s.sourceName) === invisPrefix(BREAKFAST_ORCHESTRATOR),
    );
    const orchestratorUrl = `${window.location.origin}${orchestratePath}${id}?obsp=${ws.password}&scene=${sceneUuid}${streamKey ? `&sk=${streamKey}` : ""}`;
    if (existingOrchestrator) {
      orchestratorSceneItemId = existingOrchestrator.sceneItemId;
      await ws.request({
        type: "SetInputSettings",
        options: {
          inputName: existingOrchestrator.sourceName,
          inputSettings: {
            url: orchestratorUrl,
          },
          overlay: true,
        },
      });
      await ws.request({
        type: "PressInputPropertiesButton",
        options: { inputName: existingOrchestrator.sourceName, propertyName: "refreshnocache" },
      });
    } else {
      const newOrch = await ws.request({
        type: "CreateInput",
        options: {
          sceneUuid,
          inputKind: "browser_source",
          inputName: `${invisPrefix(BREAKFAST_ORCHESTRATOR)}${invisId()}`,
          inputSettings: {
            width: 1,
            height: 1,
            fps_custom: true,
            fps: 1,
            url: orchestratorUrl,
            shutdown: true,
          } as CreateInputOptions<"browser">["inputSettings"],
        },
      });

      if (newOrch.status === "error") {
        throw new Error("Failed to create orchestrator");
      }

      orchestratorSceneItemId = newOrch.data.sceneItemId;
    }
  }

  // Prune orphaned sources
  prune: {
    if (dontPrune) break prune;

    const orphanedSourcesRequest = await ws.request({
      type: "GetSceneItemList",
      options: { sceneUuid },
    });
    if (orphanedSourcesRequest.status === "error")
      throw new Error("Failed to get orphaned sources");

    const orphanedSources = orphanedSourcesRequest.data.sceneItems.filter(
      (s) => !ownedIds.map((o) => o.sceneItemId).includes(s.sceneItemId),
    );

    for (const orphaned of orphanedSources) {
      // Dont murk the brain
      if (devisId(orphaned.sourceName) === invisPrefix(BREAKFAST_ORCHESTRATOR)) continue;

      await ws.request({
        type: "RemoveSceneItem",
        options: { sceneUuid, sceneItemId: orphaned.sceneItemId },
      });
    }
  }

  // Sort Sources
  ownedIds.sort((a, b) => (a.index < b.index ? 1 : -1));
  for (const { sceneItemId, index } of ownedIds) {
    const orderingRequest = await ws.request({
      type: "SetSceneItemIndex",
      options: { sceneUuid, sceneItemId, sceneItemIndex: ownedIds.length - index },
    });
    if (orderingRequest.status === "error") throw new Error("Failed to order scene items");
  }
  if (orchestratorSceneItemId) {
    const orderingOrchestrator = await ws.request({
      type: "SetSceneItemIndex",
      options: { sceneUuid, sceneItemId: orchestratorSceneItemId, sceneItemIndex: 0 },
    });
    if (orderingOrchestrator.status === "error") throw new Error("Failed to order scene items");
  }
}
