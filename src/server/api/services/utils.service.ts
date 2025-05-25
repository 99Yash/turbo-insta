import { ably } from "~/lib/ably";
import { type GetUserInput } from "../schema/user.schema";

export async function getSocketAuthToken(input: GetUserInput) {
  const tokenReq = await ably.auth.createTokenRequest({
    clientId: input.userId,
  });

  return tokenReq;
}
