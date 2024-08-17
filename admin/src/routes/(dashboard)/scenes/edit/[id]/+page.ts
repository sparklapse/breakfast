import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, params }) => {
  const { pb } = await parent();

  const [scene, err] = await pb
    .collection("scenes")
    .getOne(params.id)
    .then((v) => [v, null])
    .catch((e) => [null, e]);

  if (err) error(404, err?.message ?? "Not Found");

  return {
    scene,
  };
};
