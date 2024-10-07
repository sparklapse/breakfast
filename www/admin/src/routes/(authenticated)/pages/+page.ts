import { nanoid } from "nanoid";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();

  const pages = await data.pb.collection("pages").getFullList({ requestKey: nanoid() });

  return {
    pages,
  };
};
