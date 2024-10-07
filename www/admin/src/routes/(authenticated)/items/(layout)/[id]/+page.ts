import { nanoid } from "nanoid";
import { error } from "@sveltejs/kit";
import type { RecordModel } from "pocketbase";
import type { Item } from "@sparklapse/breakfast/db";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent();

  let existing: Item | undefined;
  let isDefaultBase = false;
  if (params.id !== "new") {
    const [item, err] = await data.pb
      .collection<RecordModel & Item>("items")
      .getOne(params.id, { requestKey: nanoid() })
      .then((d) => [d, null] as const)
      .catch((err) => [null, err] as const);

    if (err != null || item == null) {
      error(404, "Item not found");
    }

    if (item.type === "PROFILE_BASE") {
      const def = await data.pb.breakfast.viewers.getDefaultProfileItem({ requestKey: nanoid() });
      if (def.id === item.id) isDefaultBase = true;
    }

    existing = item;
  }

  return {
    existing,
    isDefaultBase,
  };
};
