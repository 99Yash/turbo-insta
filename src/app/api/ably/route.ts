import { auth } from "@clerk/nextjs/server";
import { getAblyToken } from "~/server/api/services/user.service";

export async function GET(_req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = await getAblyToken(userId);
  return new Response(JSON.stringify(token), { status: 200 });
}
