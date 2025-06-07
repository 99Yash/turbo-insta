import { useAuth } from "@clerk/nextjs";
import * as Ably from "ably";
import { api } from "~/trpc/react";

export function useAblyClient() {
  const { userId } = useAuth();
  if (!userId) return null;
  const utils = api.useUtils();

  const ablyClient = new Ably.Realtime({
    authCallback: (_tokenParams, callback) => {
      utils.user.getAblyToken
        .fetch()
        .then((tokenData) => callback(null, tokenData.token))
        .catch((error) => callback(error as Ably.ErrorInfo | string, null));
    },
  });

  return ablyClient;
}
