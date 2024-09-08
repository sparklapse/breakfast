import { nanoid } from "nanoid";
import { error } from "@sveltejs/kit";
import type { RecordModel } from "pocketbase";
import type { Item } from "@sparklapse/breakfast/db";
import type { PageLoad } from "./$types";

export const load = (async ({ parent, params }) => {
  const data = await parent();

  const [item, err] = await data.pb
    .collection<RecordModel & Item>("items")
    .getOne(params.id, { requestKey: nanoid() })
    .then((d) => [d, null] as const)
    .catch((err) => [null, err] as const);

  if (err != null || item == null) {
    error(404, "Item not found");
  }

  return {
    item,
  };
}) satisfies PageLoad;
