<script lang="ts" context="module">
  const ITEM_TYPES = [
    {
      label: "Badge",
      value: "BADGE",
    },
    {
      label: "Collectable",
      value: "COLLECTABLE",
    },
    {
      label: "Profile Base",
      value: "PROFILE_BASE",
    },
    {
      label: "Profile Accessory",
      value: "PROFILE_ACCESSORY",
    },
  ];

  const ITEM_VISIBILITY = [
    {
      label: "Public",
      value: "PUBLIC",
    },
    {
      label: "Unlisted",
      value: "UNLISTED",
    },
    {
      label: "Private",
      value: "PRIVATE",
    },
  ];
</script>

<script lang="ts">
  import toast from "svelte-french-toast";
  import Color from "color";
  import { slide } from "svelte/transition";
  import { Combobox, Select, Switch } from "bits-ui";
  import { Image, Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import ColorPicker from "$lib/overlay/sources/inputs/ColorPicker.svelte";
  import type { Item, ItemType, Visibility } from "@sparklapse/breakfast/db";

  import type { PageData } from "./$types";
  export let data: PageData;

  let imageFile: FileList | undefined;
  let imagePreview = "";
  let itemType: string = "COLLECTABLE";
  let makeProfileBaseDefault = false;
  let currency = "";
  let shopPurchasable = false;
  let shopPrices: { [key: string]: number } = {};
  let color: string = Color.hsl({ h: Math.floor(Math.random() * 360), s: 80, l: 85 }).hex();

  const updatePreview = () => {
    if (!imageFile) return;
    if (imagePreview !== "") URL.revokeObjectURL(imagePreview);
    imagePreview = URL.createObjectURL(imageFile[0]);
  };
  $: if (imageFile?.length === 1) updatePreview();

  const createItem = (
    ev: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    },
  ) => {
    ev.preventDefault();

    const formData = new FormData(ev.currentTarget);

    const itemType = formData.get("type") as ItemType | null;
    if (!itemType || (itemType as string) === "" || (itemType as string) === "undefined") {
      return toast.error("You must specify the item type");
    }
    const label = formData.get("label") as string | null;
    if (!label || label === "" || label === "undefined") {
      return toast.error("You must specify the item label");
    }
    const description = formData.get("description") as string | null;
    const visibility = formData.get("visibility") as Visibility | null;
    if (!visibility || (visibility as string) === "" || (visibility as string) === "undefined") {
      return toast.error("You must specify the item visibility");
    }
    const image = imageFile?.length === 1 ? imageFile[0] : null;
    if ((itemType === "PROFILE_BASE" || itemType === "PROFILE_ACCESSORY") && image === null) {
      return toast.error("Profile items must have an image");
    }

    const item: Item = {
      type: itemType,
      label,
      description,
      action: null,
      image,
      shopPurchasable,
      shopInfo: {
        prices: Object.keys(shopPrices).length === 0 ? "free" : shopPrices,
      },
      meta: {
        color,
      },
      visibility,
    };

    toast.promise(
      data.pb
        .collection("items")
        .create(item, {
          query: {
            makeProfileBaseDefault: makeProfileBaseDefault ? true : undefined,
          },
        })
        .then((data) => goto(`/breakfast/items/${data.id}`)),
      {
        loading: "Creating item...",
        success: "Created item!",
        error: (err) => `Failed to create item: ${err.message}`,
      },
    );
  };
</script>

<form on:submit={createItem}>
  <div class="space-y-12">
    <div class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
      <div>
        <h2 class="text-base font-semibold leading-7 text-gray-900">Item Info</h2>
        <p class="mt-1 text-sm leading-6 text-gray-600">What are we making today?</p>
      </div>

      <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div class="sm:col-span-2">
          <label for="label" class="block text-sm font-medium leading-6 text-gray-900">Label</label>
          <div class="mt-2">
            <input
              id="label"
              name="label"
              type="text"
              class="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
              required
            />
          </div>
        </div>

        <div class="sm:col-span-2">
          <label for="label" class="block text-sm font-medium leading-6 text-gray-900">Color</label>
          <div class="mt-2 flex gap-2">
            <ColorPicker class="h-9 shadow-sm" label="" value={color} />
          </div>
        </div>

        <div class="col-span-full">
          <label for="description" class="block text-sm font-medium leading-6 text-gray-900"
            >Description</label
          >
          <div class="mt-2">
            <textarea
              id="description"
              name="description"
              rows="3"
              class="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
            ></textarea>
          </div>
        </div>

        <div class="col-span-full">
          <label for="image" class="block text-sm font-medium leading-6 text-gray-900">Image</label>
          {#if imageFile?.length === 1}
            {@const file = imageFile[0]}
            <div class="flex flex-col gap-2">
              <img
                class="mt-2 flex h-52 w-full justify-center rounded-lg border border-dashed border-gray-900/25 object-contain px-4 py-2"
                src={imagePreview}
                alt={file.name}
              />
              <div class="flex items-center justify-between">
                <p>{file.name}</p>
                <button
                  type="button"
                  class="rounded bg-red-700 px-2 text-white"
                  on:click={() => {
                    imageFile = undefined;
                  }}>Remove</button
                >
              </div>
            </div>
          {:else}
            <button
              type="button"
              class="mt-2 flex w-full justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
              on:dragover={(ev) => {
                ev.preventDefault();
              }}
              on:drop={(ev) => {
                ev.preventDefault();
                if (ev.dataTransfer?.files) {
                  if (ev.dataTransfer.files.length !== 1) {
                    toast.error("Only 1 image is allowed");
                    return;
                  }
                  if (!ev.dataTransfer.files[0].type.startsWith("image/")) {
                    toast.error("File must be an image");
                    return;
                  }

                  imageFile = ev.dataTransfer.files;
                }
              }}
              on:click={() => document.getElementById("image")?.click()}
            >
              <div class="text-center">
                <Image class="mx-auto h-12 w-12 text-gray-300" />
                <div class="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    for="image"
                    class="relative cursor-pointer rounded-md font-semibold text-slate-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-slate-600 focus-within:ring-offset-2 hover:text-slate-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      class="sr-only"
                      accept="image/*"
                      bind:files={imageFile}
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 100MB</p>
              </div>
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
      <div>
        <h2 class="text-base font-semibold leading-7 text-gray-900">Configuration</h2>
        <p class="mt-1 text-sm leading-6 text-gray-600">Important properties of your item.</p>
      </div>

      <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
        <div class="sm:col-span-3">
          <label for="type" class="block text-sm font-medium leading-6 text-gray-900">Type</label>
          <div class="mt-2">
            <Select.Root
              items={ITEM_TYPES}
              onSelectedChange={(selected) => {
                if (!selected) return;
                itemType = selected?.value;
              }}
            >
              <Select.Input id="type" name="type" class="hidden" required />
              <Select.Trigger
                class="block w-full rounded-md border-0 bg-white px-2 py-1.5 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
              >
                <Select.Value placeholder="Select an item type" />
              </Select.Trigger>
              <Select.Content class="mt-1 rounded bg-white shadow-lg">
                {#each ITEM_TYPES as iType}
                  <Select.Item
                    class="cursor-pointer px-2 py-1 hover:bg-slate-50"
                    value={iType.value}>{iType.label}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        <div class="sm:col-span-3">
          <label for="shopPurchasable" class="block text-sm font-medium leading-6 text-gray-900"
            >Purchasable</label
          >
          <div class="mt-2.5">
            <Switch.Root
              class="relative w-14 rounded-full bg-slate-400 transition-colors data-[state=checked]:bg-green-600"
              bind:checked={shopPurchasable}
            >
              <Switch.Thumb
                class="m-0.5 flex size-7 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-6"
              />
            </Switch.Root>
          </div>
        </div>

        <div class="sm:col-span-4">
          <label for="email" class="block text-sm font-medium leading-6 text-gray-900"
            >Visiblity</label
          >
          <div class="mt-2">
            <Select.Root name="visibility " items={ITEM_VISIBILITY} selected={ITEM_VISIBILITY[0]}>
              <Select.Input id="visibility" name="visibility" class="hidden" required />
              <Select.Trigger
                class="block w-full rounded-md border-0 bg-white px-2 py-1.5 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
              >
                <Select.Value placeholder="Select a visibility" />
              </Select.Trigger>
              <Select.Content class="mt-1 rounded bg-white shadow-lg">
                {#each ITEM_VISIBILITY as iType}
                  <Select.Item
                    class="cursor-pointer px-2 py-1 hover:bg-slate-50"
                    value={iType.value}>{iType.label}</Select.Item
                  >
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </div>
    </div>

    {#if itemType === "PROFILE_BASE"}
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3"
        transition:slide={{ axis: "y" }}
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">Profile Options</h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            Give your viewers their own way to express themselves.
          </p>
        </div>

        <div class="max-w-2xl space-y-10 md:col-span-2">
          <div class="sm:col-span-3">
            <label for="shopPurchasable" class="block text-sm font-medium leading-6 text-gray-900"
              >Make Default</label
            >
            <p class="text-sm text-slate-400">
              This will give all new viewers this item by default. This will replace the current
              default.
            </p>
            <div class="mt-2.5">
              <Switch.Root
                class="relative w-14 rounded-full bg-slate-400 transition-colors data-[state=checked]:bg-green-600"
                bind:checked={makeProfileBaseDefault}
              >
                <Switch.Thumb
                  class="m-0.5 flex size-7 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-6"
                />
              </Switch.Root>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if shopPurchasable}
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3"
        transition:slide={{ axis: "y" }}
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">Shop Info</h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">How will this be sold to your viewers.</p>
        </div>

        <div class="max-w-2xl space-y-10 md:col-span-2">
          <div class="sm:col-span-4">
            <p class="block text-sm font-medium leading-6 text-gray-900">Prices</p>
            <form
              class="flex gap-2"
              on:submit={(ev) => {
                ev.preventDefault();
                const data = new FormData(ev.currentTarget);

                {
                  const currency = data.get("price-add-currency")?.toString();
                  const costStr = data.get("price-add-cost")?.toString();

                  if (!currency || !costStr) return;

                  const cost = parseInt(costStr);
                  if (Number.isNaN(cost)) {
                    toast.error("Enter a valid cost");
                    return;
                  }

                  shopPrices = {
                    ...shopPrices,
                    [currency]: cost,
                  };
                }

                ev.currentTarget.reset();
                currency = "";
              }}
            >
              {#await data.pb.breakfast.viewers.activeCurrencies()}
                <div class="h-8 w-72 animate-pulse rounded bg-gray-200" />
              {:then { currencies }}
                {@const filtered = currencies
                  .filter((c) => c.includes(currency))
                  .map((c) => ({ value: c }))}
                <div
                  class="flex w-fit rounded bg-white px-2 py-1 outline-slate-700 ring-1 ring-inset ring-gray-300 focus-within:outline"
                >
                  <Combobox.Root items={filtered} bind:inputValue={currency}>
                    <Combobox.Input
                      name="price-add-currency"
                      class="outline-none"
                      placeholder="What currency?"
                      required
                      on:keydown={(ev) => {
                        if (ev.detail.originalEvent.key === "Enter") {
                          if (filtered.length > 0) currency = filtered[0].value;
                          const costElem = document.querySelector("#price-add-cost");
                          if (!costElem) return;
                          if (!(costElem instanceof HTMLInputElement)) return;
                          if (costElem.value === "") costElem.focus();
                        }
                      }}
                    />
                    <Combobox.Content class="mt-1 rounded bg-white shadow-lg">
                      {#each filtered as cur}
                        <Combobox.Item class="cursor-pointer px-2 py-1" value={cur.value}>
                          {cur.value}
                        </Combobox.Item>
                      {/each}
                    </Combobox.Content>
                  </Combobox.Root>
                  <input
                    class="w-20 text-right outline-none"
                    id="price-add-cost"
                    name="price-add-cost"
                    type="number"
                    min="0"
                    placeholder="Cost"
                    required
                  />
                </div>
              {/await}
              <button class="rounded bg-slate-700 px-2 text-white" type="submit">Add Price</button>
            </form>
            <ul class="mt-2 text-sm text-gray-600">
              {#each Object.entries(shopPrices) as [currency, cost]}
                <li class="flex max-w-md justify-between">
                  <p>
                    {currency} - {cost}
                  </p>
                  <button
                    class="text-red-900"
                    type="button"
                    on:click={() => {
                      delete shopPrices[currency];
                      shopPrices = { ...shopPrices };
                    }}><Trash2 size="1rem" /></button
                  >
                </li>
              {:else}
                <li>No prices added yet! If no price is added, this item will be free.</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="mt-6 flex items-center justify-end gap-x-6">
    <button
      type="submit"
      class="rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
      >Create</button
    >
  </div>
</form>
