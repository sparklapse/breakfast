import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import type { RecordModel } from "pocketbase";
import type { Viewer } from "@sparklapse/breakfast/db";

export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent();

  const viewer = await data.pb
    .collection<RecordModel & Viewer>("viewers")
    .getOne(params.id)
    .catch(() => {
      error(404, "Viewer not found");
    });

  const { providers, providerIds } = await data.pb.breakfast.viewers.getById(params.id);
  viewer.providers = providers;
  viewer.providerIds = providerIds;

  return {
    viewer,
  };
};
