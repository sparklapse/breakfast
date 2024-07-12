import { createOBS } from "$app/context/obs";
import { useSearchParams } from "@solidjs/router";
import { Orchestrator } from "./.lib/Orchestrator";
import { createEffect } from "solid-js";

export default function OrchestratorPage() {
  const [search] = useSearchParams();
  const [obs, OBSProvider] = createOBS({ password: search.obsp });

  createEffect(async () => {
    if (obs.connected()) return;
    await obs.connect();
  });

  return (
    <OBSProvider>
      <Orchestrator />
    </OBSProvider>
  );
}
