<script lang="ts">
  import toast from "svelte-french-toast";
  import { siTwitch } from "simple-icons";
  import { goto } from "$app/navigation";
  import { PUBLIC_FEATURE_EXTERNAL_ACCOUNT_MANAGEMENT } from "$env/static/public";

  import type { PageData } from "./$types";
  export let data: PageData;
  const { user } = data;

  $: if ($user && data.pb.authStore.isAuthenticated()) {
    goto("/breakfast");
  }

  const submit = (
    ev: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    },
  ) => {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);

    toast.promise(
      data.pb
        .collection("users")
        .authWithPassword(form.get("username") as string, form.get("password") as string),
      {
        loading: "Signing in...",
        success: "Signed in successfully!",
        error: (err) => `Failed to sign in: ${err.message}`,
      },
    );
  };
</script>

<div class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <img class="mx-auto h-24 w-auto rotate-6" src="/breakfast/logo.png" alt="Breakfast" />
  </div>

  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
    <div class="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
      <form class="space-y-6" on:submit={submit}>
        <div>
          <label for="username" class="block text-sm font-medium leading-6 text-gray-900">
            Username
          </label>
          <div class="mt-2">
            <input
              id="username"
              name="username"
              type="text"
              autocomplete="username"
              required
              class="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium leading-6 text-gray-900">
            Password
          </label>
          <div class="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="flex w-full justify-center rounded-md bg-slate-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
          >
            Sign in
          </button>
        </div>
      </form>

      <div>
        <div class="relative mt-10">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm font-medium leading-6">
            <span class="bg-white px-6 text-gray-900">Or continue with</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4">
          {#if PUBLIC_FEATURE_EXTERNAL_ACCOUNT_MANAGEMENT === "true"}
            <a
              href={import.meta.env.VITE_EXTERNAL_ACCOUNT_LOGIN}
              class="flex w-full cursor-pointer items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
            >
              <img class="size-4 rotate-3" src="/breakfast/logo.png" alt="" />
              <span class="text-sm font-semibold leading-6">Brekkie.stream</span>
            </a>
          {/if}
          <button
            class="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-purple-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
            on:click={() => {
              toast.promise(data.pb.collection("users").authWithOAuth2({ provider: "twitch" }), {
                loading: "Signing in with twitch...",
                success: "Signed in!",
                error: (err) => `Failed to sign in: ${err.message}`,
              });
            }}
          >
            <div class="size-4 *:fill-current">
              {@html siTwitch.svg}
            </div>
            <span class="text-sm font-semibold leading-6">Twitch</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
