<script lang="ts">
  import clsx from "clsx";
  import { fade, fly } from "svelte/transition";
  import {
    Gift,
    Home,
    Layers,
    Image,
    SquareGanttChart,
    Menu,
    UsersRound,
    Joystick,
  } from "lucide-svelte";
  import { page } from "$app/stores";
  import Obs from "$lib/components/icons/OBS.svelte";
  import type { ComponentType } from "svelte";

  import type { LayoutData } from "./$types";
  export let data: LayoutData;
  const { user } = data;

  const navItems: { label: string; icon: ComponentType; href: string; route?: string }[] = [
    { label: "Dashboard", icon: Home, href: "/breakfast", route: "/(dashboard)" },
    {
      label: "Viewers",
      icon: UsersRound,
      href: "/breakfast/viewers",
      route: "/(dashboard)/viewers",
    },
    {
      label: "Items",
      icon: Gift,
      href: "/breakfast/items",
      route: "/(dashboard)/items",
    },
    {
      label: "Events",
      icon: SquareGanttChart,
      href: "/breakfast/events",
      route: "/(dashboard)/events",
    },
    {
      label: "Overlays",
      icon: Layers,
      href: "/breakfast/overlays",
      route: "/(dashboard)/overlays",
    },
    {
      label: "Controller",
      icon: Joystick,
      href: "/breakfast/controller",
      route: "/(dashboard)/controller",
    },
    { label: "Assets", icon: Image, href: "/breakfast/assets", route: "/(dashboard)/assets" },
    { label: "OBS", icon: Obs, href: "/breakfast/obs", route: "/(dashboard)/obs" },
  ];

  let mobileMenuOpen = false;
  $: if ($page) mobileMenuOpen = false;
</script>

<div class="absolute inset-0 bg-slate-100">
  {#if mobileMenuOpen}
    <div class="relative z-10 lg:hidden" role="dialog" aria-modal="true">
      <div
        class="fixed inset-0 bg-gray-900/80"
        aria-hidden="true"
        on:pointerdown={() => {
          mobileMenuOpen = false;
        }}
        transition:fade={{ duration: 250 }}
      />

      <div
        class="fixed inset-y-0 left-0 flex w-full max-w-sm"
        transition:fly={{ x: -100, duration: 250 }}
      >
        <div class="relative mr-16 flex w-full max-w-xs flex-1">
          <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button
              type="button"
              class="-m-2.5 p-2.5"
              on:click={() => {
                mobileMenuOpen = false;
              }}
            >
              <span class="sr-only">Close sidebar</span>
              <svg
                class="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
            <div class="flex h-16 shrink-0 items-center">
              <img class="h-8 w-auto" src="/breakfast/logo.png" alt="Breakfast" />
            </div>
            <nav class="flex flex-1 flex-col">
              <ul role="list" class="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" class="-mx-2 space-y-1">
                    {#each navItems as item}
                      {@const currentPage = $page.route.id === item.route}
                      <li>
                        <a
                          href={item.href}
                          class={clsx([
                            "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                            currentPage
                              ? "bg-gray-50 text-slate-600"
                              : "text-gray-600 hover:bg-gray-50 hover:text-slate-700",
                          ])}
                        >
                          <svelte:component
                            this={item.icon}
                            class={clsx([
                              "h-6 w-6 shrink-0",
                              currentPage
                                ? "text-slate-600"
                                : "text-gray-400 group-hover:text-slate-600",
                            ])}
                          />
                          {item.label}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Desktop Sidebar -->
  <div
    class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col"
    transition:fly|global={{ x: -100, duration: 250 }}
  >
    <div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
      <div class="flex h-16 shrink-0 items-center">
        <img class="h-8 w-auto rotate-3" src="/breakfast/logo.png" alt="Breakfast" />
      </div>
      <nav class="flex flex-1 flex-col">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" class="-mx-2 space-y-1">
              {#each navItems as item}
                {@const currentPage = $page.route.id === item.route}
                <li>
                  <a
                    href={item.href}
                    class={clsx([
                      "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                      currentPage
                        ? "bg-gray-50 text-slate-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-slate-700",
                    ])}
                  >
                    <svelte:component
                      this={item.icon}
                      class={clsx([
                        "h-6 w-6 shrink-0",
                        currentPage ? "text-slate-600" : "text-gray-400 group-hover:text-slate-600",
                      ])}
                    />
                    {item.label}
                  </a>
                </li>
              {/each}
            </ul>
          </li>
          <li class="-mx-6 mt-auto">
            <a
              href="/breakfast/account"
              class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
            >
              <img class="h-8 w-8 rounded-full bg-gray-50" src="/breakfast/profile.jpg" alt="" />
              <span class="sr-only">Your profile</span>
              <span aria-hidden="true">{$user?.username}</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!-- Mobile Top Nav -->
  <div
    class="sticky top-0 z-40 flex h-16 items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden"
  >
    <button
      type="button"
      class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
      on:click={() => {
        mobileMenuOpen = !mobileMenuOpen;
      }}
    >
      <span class="sr-only">Open sidebar</span>
      <Menu class="h-6 w-6" />
    </button>
    <div class="flex-1 text-sm font-semibold leading-6 text-gray-900">
      {navItems.find((i) => $page.route.id === i.route)?.label ?? ""}
    </div>
    <a href="/breakfast/account">
      <span class="sr-only">Your profile</span>
      <img class="h-8 w-8 rounded-full bg-gray-50" src="/breakfast/profile.jpg" alt="" />
    </a>
  </div>

  <main
    class="relative isolate h-[calc(100%-4rem)] overflow-y-auto px-4 py-10 sm:px-6 lg:ml-72 lg:h-full lg:px-8"
    transition:fade|global={{ duration: 100 }}
  >
    <slot />
  </main>
</div>
