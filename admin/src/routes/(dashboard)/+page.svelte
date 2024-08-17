<script lang="ts">
  import type { ComponentType } from "svelte";

  import type { PageData } from "./$types";
  import { Layers3 } from "lucide-svelte";
  export let data: PageData;
  const { user } = data;

  const tools: {
    label: string;
    description: string;
    href: string;
    icon: ComponentType;
    color: {
      text: string;
      bg: string;
    };
  }[] = [
    {
      label: "Scenes",
      description: "Create overlays and bring flair to your streams",
      href: "/breakfast/scenes",
      icon: Layers3,
      color: { text: "#9b4f7b", bg: "#f9d9ec" },
    },
    {
      label: "Pages",
      description: "Give your community a place to go to find your socials",
      href: "/breakfast/pages",
      icon: Layers3,
      color: { text: "#4f509b", bg: "#c6c7ff" },
    },
  ];
</script>

<h2 class="font-semibold mb-3">Tools</h2>
<div class="border-collapse overflow-hidden sm:grid sm:grid-cols-2 sm:gap-1">
  {#each tools as tool}
    <div
      class="group relative border bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-500 hover:bg-slate-50 sm:rounded-tr-none"
    >
      <div>
        <span
          class="inline-flex rounded-lg p-3 ring-4 ring-white"
          style:color={tool.color.text}
          style:background-color={tool.color.bg}
        >
          <svelte:component this={tool.icon} class="h-6 w-6" />
        </span>
      </div>
      <div class="mt-8">
        <h3 class="text-base font-semibold leading-6 text-gray-900">
          <a href={tool.href} class="focus:outline-none">
            <!-- Extend touch target to entire panel -->
            <span class="absolute inset-0" aria-hidden="true"></span>
            {tool.label}
          </a>
        </h3>
        <p class="mt-2 text-sm text-gray-500">
          {tool.description}
        </p>
      </div>
    </div>
  {/each}
</div>
