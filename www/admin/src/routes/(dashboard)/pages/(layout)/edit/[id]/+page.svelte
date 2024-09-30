<script lang="ts">
  import toast from "svelte-french-toast";
  import Upload from "lucide-svelte/icons/upload";
  import { page } from "$app/stores";
  import { DefinedEditor } from "@sparklapse/breakfast/io";
  import type { Page } from "@sparklapse/breakfast/db";

  import type { PageData } from "./$types";
  export let data: PageData;

  let lang = window.navigator.language.split("-")[0];
  const languages = [lang, ...(data.page.data?.map((p) => p.lang).filter((p) => p !== lang) ?? [])];
  $: pageData =
    data.page.data?.find((p) => lang === p.lang) ?? ({} as NonNullable<Page["data"]>[0]);

  let addLang = false;

  const uploadHtml = async (file: File) => {
    const html = await file.text();
    await data.pb.collection("pages").update($page.params.id, {
      html,
    });
  };
</script>

<div class="mb-2 flex items-baseline justify-between">
  <h2>Edit Page</h2>
  <div>
    <label
      class="flex cursor-pointer items-center gap-1 rounded bg-slate-700 px-2 py-1 text-white shadow-sm"
      for="upload-html"><Upload size="1rem" />Upload HTML</label
    >
    <input
      id="upload-html"
      class="hidden"
      type="file"
      accept="text/html"
      on:input={(ev) => {
        if (!ev.currentTarget.files || ev.currentTarget.files?.length !== 1) return;
        const file = ev.currentTarget.files[0];
        toast.promise(uploadHtml(file), {
          loading: "Uploading HTML...",
          success: "HTML Uploaded!",
          error: (err) => `Failed to upload HTML: ${err.message}`,
        });
        ev.currentTarget.value = "";
      }}
    />
  </div>
</div>

{#if data.page.schema !== null}
  <DefinedEditor
    inputs={data.page.schema}
    values={pageData}
    onchange={(input, value) => {
      pageData[input.id] = value;
    }}
    assetHelpers={{
      getAssets: async (filter) => {
        const query = await data.pb.collection("assets").getList(1, 50, { sort: "-created", filter: `label ~ "${filter}"` });
        const { items } = query;

        return items.map((i) => ({
          label: i.label,
          thumb: data.pb.files.getUrl(i, i.asset, { thumb: "512x512f"}),
          url: data.pb.files.getUrl(i, i.asset),
        }));
      },
      uploadAsset: async (file) => {
        const url = await toast.promise(
          data.pb.collection("assets").create(
            {label: file.name, asset: file},
          ).then((record) => data.pb.files.getUrl(record, record.asset)),
          {
            loading: "Uploading asset...",
            success: "Asset uploaded!",
            error: (err) => `Failed to upload asset: ${err.message}`,
          },
        );

        return url;
      },
    }}
  />
  <div class="mt-4 flex items-start justify-between">
    <div>
      <div>
        <label for="language">Language: </label>
        {#if addLang}
          <input
            id="language"
            type="text"
            maxlength="2"
            placeholder="Enter a language code"
            on:keydown={(ev) => ev.key === "Enter" && ev.currentTarget.blur()}
            on:blur={(ev) => {
              const code = ev.currentTarget.value;
              if (code.trim().length !== 2) return;
              languages.push(code);
              lang = code;
              data.page.data?.push({ lang: code });
              addLang = false;
            }}
          />
        {:else}
          <select id="language" class="px-2" bind:value={lang}>
            {#each languages as l}
              <option value={l}>{l}</option>
            {/each}
          </select>
          <button
            class="rounded bg-slate-700 px-2 text-white"
            on:click={() => {
              addLang = true;
              setTimeout(() => document.getElementById("language")?.focus(), 100);
            }}>Add</button
          >
        {/if}
      </div>
      <a
        class="text-sm underline"
        href="https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes#Table"
        target="_blank">Don't know your language code?</a
      >
    </div>
    <button class="bg-slate-700 text-white py-1 px-2 rounded shadow-sm" on:click={() => {
      toast.promise(
        data.pb.collection("pages").update(data.page.id, {data: data.page.data}),
        {
          loading: "Saving page data...",
          success: "Page data saved!",
          error: (err) => `Failed to save page data: ${err.message}`,
        },
      );
    }}>Save</button>
  </div>
{:else}
  <p>This page has no schema that can be edited :/</p>
{/if}
