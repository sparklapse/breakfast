<script lang="ts">
  import Step0 from "./Step0.svelte";
  import Step1 from "./Step1.svelte";
  import Step2 from "./Step2.svelte";
  import Step3 from "./Step3.svelte";

  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  export let data: PageData;
  const obsConnected = data.obs.connectedStore;

  $: if ($obsConnected === true) goto("/breakfast/obs");

  let step = 0;
  $: if (step >= 4) goto("/breakfast/obs");

  const nextStep = () => {
    step++;
  };
  const connect = async (password: string) => {
    const result = await data.obs.connect(password);
    if (result.status === "error") throw result.error;
    localStorage.setItem("obs.password", password);
  };
</script>

{#if step === 0}
  <Step0 {nextStep} />
{:else if step === 1}
  <Step1 {nextStep} />
{:else if step === 2}
  <Step2 {nextStep} />
{:else if step === 3}
  <Step3 {nextStep} {connect} />
{/if}
