<script lang="ts">
  import clsx from "clsx";
  import { readable } from "svelte/store";
  import { fly } from "svelte/transition";
  import { Select } from "bits-ui";
  import {
    useEditor,
    invisId,
    getTransformBounds,
    transformFromPoints,
  } from "@sparklapse/breakfast/overlay";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import type { Transform } from "@sparklapse/breakfast/overlay";

  export let params: string = "";
  export let returnUrl: string = "/breakfast/obs";
  export let beforesync: (() => Promise<void> | void) | undefined = undefined;
  export let aftersync: (() => Promise<void> | void) | undefined = undefined;
  export let failedsync: ((err: any) => Promise<void> | void) | undefined = undefined;

  $: obsConnected = $page.data?.obs.connectedStore ?? readable(false);

  const {
    label,
    sources: { sources },
  } = useEditor();

  const steps: { label: string }[] = [
    {
      label: "Connect",
    },
    {
      label: "Select Scene",
    },
    {
      label: "Sync",
    },
  ];
  let step = 1;
  let sceneUuid = "";

  $: if (!$obsConnected) {
    step = 0;
  } else {
    step = 1;
  }

  $: sceneListRequest = $obsConnected
    ? $page.data!.obs.request({ type: "GetSceneList", options: undefined })
    : undefined;

  let smallestPossibleSource = false;
  const sync = async () => {
    if (!$page.data) return;
    if (sceneUuid === "") return;
    if ($sources.length === 0) throw new Error("Can't sync an empty scene!");

    const existing = await $page.data.obs.request({
      type: "GetSceneItemList",
      options: { sceneUuid },
    });
    if (existing.status === "error") {
      throw existing.error;
    }

    const transform: Transform = smallestPossibleSource
      ? transformFromPoints(...getTransformBounds(...$sources.map((s) => s.transform)), 0)
      : {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
        };
    const css = smallestPossibleSource
      ? `body { transform: translate(${-transform.x}px, ${-transform.y}px) }`
      : "";

    const url = `${window.location.origin}/overlays/local/render/${$page.params.id}?${params}`;

    for (const source of existing.data.sceneItems) {
      if (source.inputKind !== "browser_source") continue;
      const settings = await $page.data.obs.request({
        type: "GetInputSettings",
        options: { inputName: source.sourceName },
      });

      if (settings.status === "error") {
        continue;
      }

      if (settings.data.inputSettings.breakfastOverlayId === $page.params.id) {
        await $page.data.obs.request({
          type: "PressInputPropertiesButton",
          options: { inputName: source.sourceName, propertyName: "refreshnocache" },
        });
        const name = `${$label}${invisId()}`;
        await $page.data.obs.request({
          type: "SetInputName",
          options: { inputName: source.sourceName, newInputName: name },
        });
        await $page.data.obs.request({
          type: "SetInputSettings",
          options: {
            inputName: name,
            inputSettings: {
              css,
              url,
              width: transform.width,
              height: transform.height,
            },
            overlay: true,
          },
        });
        await $page.data.obs.request({
          type: "SetSceneItemTransform",
          options: {
            sceneUuid,
            sceneItemId: source.sceneItemId,
            sceneItemTransform: {
              positionX: transform.x,
              positionY: transform.y,
              scaleX: 1,
              scaleY: 1,
            },
          },
        });
        return;
      }
    }

    const input = await $page.data.obs.request({
      type: "CreateInput",
      options: {
        sceneUuid,
        inputKind: "browser_source",
        inputName: `${$label}${invisId()}`,
        inputSettings: {
          breakfastOverlayId: $page.params.id,
          css,
          url,
          width: transform.width,
          height: transform.height,
        },
      },
    });

    if (input.status === "error") {
      return;
    }

    await $page.data.obs.request({
      type: "SetSceneItemTransform",
      options: {
        sceneUuid,
        sceneItemId: input.data.sceneItemId,
        sceneItemTransform: {
          positionX: transform.x,
          positionY: transform.y,
          scaleX: 1,
          scaleY: 1,
        },
      },
    });
  };
</script>

<div class="mb-4 flex gap-2">
  {#each steps as s, idx}
    <div class="w-full">
      <p>{s.label}</p>
      <div
        class={clsx([
          "h-1 w-full rounded transition-colors",
          step > idx ? "bg-green-700" : "bg-slate-200",
        ])}
      />
    </div>
  {/each}
</div>

{#if $obsConnected}
  {#if step === 1}
    <div out:fly={{ x: -100, duration: 100 }}>
      {#await sceneListRequest}
        <button class="pointer-events-none w-full rounded bg-slate-700 px-1 text-white opacity-75">
          Loading...
        </button>
      {:then request}
        {#if request?.status === "success"}
          {@const sceneList = request.data.scenes
            .map((s) => ({
              value: s.sceneUuid,
              label: s.sceneName,
            }))
            .filter((s) => !s.label.toLowerCase().includes("ephemeral"))}
          <Select.Root
            items={sceneList}
            portal={null}
            onSelectedChange={(changed) => {
              if (!changed) return;
              sceneUuid = changed.value;
              step = 2;
            }}
          >
            <Select.Trigger class="w-full rounded bg-slate-700 px-1 text-white">
              <Select.Value placeholder="Select a scene" />
            </Select.Trigger>
            <Select.Content
              class="z-10 mt-1 rounded bg-white p-2 shadow-lg"
              transition={fly}
              transitionConfig={{ y: -10, duration: 100 }}
            >
              {#each sceneList as scene}
                <Select.Item class="cursor-pointer" value={scene.value}>{scene.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {:else}
          <p>Error getting scenes</p>
        {/if}
      {/await}
    </div>
  {:else if step === 2 || step === 3}
    <div>
      <input id="sync-bounds" type="checkbox" bind:checked={smallestPossibleSource} />
      <label for="sync-bounds">Create smallest possible source</label>
    </div>
    <div class="flex justify-between gap-2" in:fly={{ x: 100, duration: 100, delay: 100 }}>
      <button
        class="w-full rounded bg-slate-700 text-white"
        on:click={async () => {
          await beforesync?.();
          try {
            await sync();
          } catch (err) {
            await failedsync?.(err);
            return;
          }
          await aftersync?.();

          step = 3;
        }}
      >
        Sync
      </button>
      <button
        class="w-full rounded border border-slate-700 text-slate-700"
        on:click={() => {
          sceneUuid = "";
          step = 1;
        }}
      >
        Change Scene
      </button>
    </div>
  {/if}
{:else}
  <div class="flex justify-between gap-2">
    <p class="w-full">OBS is disconnected</p>
    <button
      class="w-full rounded bg-slate-700 px-2 text-white"
      on:click={async () => {
        if (!$page.data?.obs) return;

        const didConnect = await $page.data.obs.easyConnect();
        if (!didConnect || didConnect?.status !== "success") {
          goto("/breakfast/obs/wizard?return=" + returnUrl);
        }
      }}
    >
      Connect
    </button>
  </div>
{/if}
