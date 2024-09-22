import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import type { ExternalAuthModel } from "pocketbase";

export const load: PageLoad = async ({ parent, depends }) => {
  const data = await parent();
  if (!data.pb.authStore.model) redirect(302, "/breakfast/sign-in");

  depends("pb:account");
  const identities = data.pb
    .collection("users")
    .listExternalAuths(data.pb.authStore.model!.id)
    .then((i) =>
      i.reduce(
        (acc, prev) => ({ ...acc, [prev.provider]: prev }),
        {} as Record<string, ExternalAuthModel>,
      ),
    );

  return {
    ...data,
    suspense: {
      identities,
    },
  };
};
