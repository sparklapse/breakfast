import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";
import type { OverlayScript } from "@sparklapse/breakfast/scripts";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const overlays = data.pb
    .collection("overlays")
    .getFullList({ fields: "id,label,scripts", requestKey: nanoid() })
    .then((ovs) =>
      ovs.map(({ label, id, scripts }) => ({
        label: label as string,
        value: id,
        scripts: (scripts ?? []) as OverlayScript[],
      })),
    );

  return {
    suspense: {
      overlays,
    },
  };
};
