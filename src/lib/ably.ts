import * as Ably from "ably";
import { env } from "~/env";

export const ably = new Ably.Rest({
  key: env.ABLY_API_KEY,
});
