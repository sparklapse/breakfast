<script lang="ts">
  import toast from "svelte-french-toast";
  import { goto } from "$app/navigation";

  import type { PageData } from "./$types";
  export let data: PageData;

  const submit = (
    ev: SubmitEvent & {
      currentTarget: EventTarget & HTMLFormElement;
    },
  ) => {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;

    toast.promise(data.pb.breakfast.setup.runSetup({ username, password }), {
      loading: "Creating account...",
      success: () => {
        data.pb
          .collection("users")
          .authWithPassword(username, password)
          .then(() => goto("/breakfast"));
        return "Account Created! Welcome te Breakfast!";
      },
      error: (err) => `Failed to setup account: ${err.message}`,
    });
  };
</script>

<div class="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-sm space-y-10">
    <div>
      <img class="mx-auto h-24 w-auto rotate-3" src="/breakfast/logo.png" alt="Breakfast" />
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Create your account
      </h2>
    </div>
    <form class="space-y-6" on:submit={submit}>
      <div class="relative -space-y-px rounded-md shadow-sm">
        <div
          class="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-gray-300"
        ></div>
        <div>
          <label for="username" class="sr-only">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            class="relative block w-full rounded-t-md border-0 px-2 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
            placeholder="Username"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            class="relative block w-full rounded-b-md border-0 px-2 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-slate-600 sm:text-sm sm:leading-6"
            placeholder="Password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          class="flex w-full justify-center rounded-md bg-slate-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
        >
          Create Account
        </button>
      </div>
    </form>
  </div>
</div>
