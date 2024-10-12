import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import type { RecordModel } from "pocketbase";
import type { Viewer } from "@brekkie/overlay";

export const load: PageLoad = async ({ parent, params, depends }) => {
  const data = await parent();

  const viewer = await data.pb
    .collection<RecordModel & Viewer>("viewers")
    .getOne(params.id)
    .catch(() => {
      error(404, "Viewer not found");
    });

  depends("db:viewer");

  const { providers, providerIds } = await data.pb.breakfast.viewers.getById(params.id);
  viewer.providers = providers;
  viewer.providerIds = providerIds;

  const profileItems = data.pb.breakfast.viewers.getProfileItems(params.id);
  const items = data.pb.collection("viewer_items").getFullList({
    filter: `owner = '${params.id}'`,
    expand: "item",
  }) as Promise<(RecordModel & { expand: { item: any } })[]>;

  return {
    viewer,
    suspense: {
      profileItems,
      items,
    },
  };
};
