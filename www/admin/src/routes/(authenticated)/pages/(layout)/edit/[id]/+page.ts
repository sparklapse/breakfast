import type { Page } from "@sparklapse/breakfast/db";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent();

  const page = await data.pb.collection<Page>("pages").getOne(params.id);

  return {
    page,
  };
};
