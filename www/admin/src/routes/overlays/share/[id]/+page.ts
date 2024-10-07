import { error } from "@sveltejs/kit";
import type { Overlay } from "@sparklapse/breakfast/db";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent();

  let overlay: Overlay;
  try {
    overlay = await data.pb.collection("overlays").getOne(params.id);
  } catch {
    error(404, "Overlay not found");
  }

  return {
    overlay,
  };
};

