import { auth } from "@clerk/nextjs/server";
import { getErrorMessage } from "~/lib/utils";
import { getAblyToken } from "~/server/api/services/user.service";

// ensure Vercel doesn't cache the result of this route,
// as otherwise the token request data will eventually become outdated
// and we won't be able to authenticate on the client side
export const revalidate = 0;

export async function GET(_req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const token = await getAblyToken(userId);
    return new Response(JSON.stringify(token), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to get Ably token:", error);
    return new Response(getErrorMessage(error), { status: 500 });
  }
}
