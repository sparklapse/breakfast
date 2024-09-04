import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const overlays = data.pb
    .collection("overlays")
    .getFullList({ fields: "id,label", requestKey: nanoid() })
    .then((ovs) => ovs.map(({ label, id }) => ({ label, value: id })));

  return {
    suspense: {
      overlays,
    },
  };
};
