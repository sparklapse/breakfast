import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, params }) => {
  const { pb } = await parent();

  const [overlay, err] = await pb
    .collection("overlays")
    .getOne(params.id)
    .then((v) => [v, null])
    .catch((e) => [null, e]);

  if (err) error(404, err?.message ?? "Not Found");

  return {
    overlay,
  };
};
