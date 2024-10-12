<script lang="ts">
  import toast from "svelte-french-toast";
  import { createEditor } from "@brekkie/overlay";
  import { Sync } from "@brekkie/overlay";

  import type { PageData } from "./$types";
  export let data: PageData;

  createEditor({
    initial: {
      label: data.overlay.label,
      overlay: data.overlay.sources,
      scripts: data.overlay.scripts,
    },
  });

  let frame: HTMLIFrameElement;
  let twitchChannel: string = "";

  $: if (frame) {
    twitchChannel;
    frame.contentWindow?.location.reload();
  }

  const fitFrame = (el: HTMLIFrameElement) => {
    const parent = el.parentElement;
    if (!parent) return;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      el.style.transform = `scale(${Math.min(width / 1920, height / 1080)})`;
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    return {
      destroy: () => {
        observer.disconnect();
      },
    };
  };
</script>

<div class="absolute inset-0 grid place-content-center overflow-hidden bg-slate-100">
  <div class="flex w-screen justify-center px-2">
    <div
      class="relative aspect-video w-full max-w-3xl overflow-visible rounded border border-slate-700 bg-white"
    >
      <div class="absolute bottom-full">
        <h1 class="text-xl font-semibold">{data.overlay.label}</h1>
      </div>
      <iframe
        class="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
        title={data.overlay.label}
        src="/overlays/local/render/{data.overlay.id}?twitchChannels={twitchChannel}"
        frameborder="0"
        use:fitFrame
        bind:this={frame}
      />
      <div class="absolute inset-x-0 top-full pt-2">
        <div class="flex justify-between">
          <div>
            <h3>Settings</h3>
            <div class="flex gap-2">
              <p>Twitch</p>
              <input
                class="rounded-sm border border-slate-400 px-1"
                type="text"
                placeholder="Enter your twitch username"
                on:keydown={(ev) => {
                  if (ev.key === "Enter") ev.currentTarget.blur();
                }}
                on:blur={(ev) => {
                  twitchChannel = ev.currentTarget.value;
                }}
              />
            </div>
          </div>
          <div class="w-[20rem] pt-0.5">
            <Sync
              renderUrl="{window.location.host}/overlays/render/{data.overlay.id}"
              aftersync={() => {
                toast.success("Overlay synced to OBS!");
              }}
              failedsync={(err) => {
                toast.error(`Failed to sync overlay: ${err.message}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
