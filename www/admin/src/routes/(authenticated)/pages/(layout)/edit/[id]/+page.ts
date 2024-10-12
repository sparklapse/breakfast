import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent();

  const page = await data.pb
    .collection<{
      id: string;
      path: string;
      html: string;
      schema: any;
      data: { lang: string; [key: string]: any }[];
    }>("pages")
    .getOne(params.id);

  return {
    page,
  };
};
