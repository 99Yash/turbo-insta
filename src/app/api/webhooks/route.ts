import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { generateUniqueUsername } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Verify the payload with the headers
    const evt = await verifyWebhook(req);

    console.info(
      `Webhook with and ID of ${evt.data.id} and type of ${evt.type}`,
    );

    switch (evt.type) {
      case "user.created": {
        const {
          id: clerkId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = evt.data;

        if (!email_addresses?.[0]?.email_address) {
          console.error("No email address found for user:", clerkId);
          return new Response("No email address found", { status: 400 });
        }

        const name =
          `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";
        const username = await generateUniqueUsername(name);

        try {
          await db.insert(users).values({
            id: clerkId,
            email: email_addresses[0].email_address,
            name,
            username,
            imageUrl: image_url,
            isVerified: false,
          });

          console.info(`Created user in database with username: ${username}`);

          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });
        } catch (error) {
          console.error("Error creating user in database:", error);
          return new Response("Failed to create user", { status: 500 });
        }
        break;
      }
      case "user.updated": {
        const {
          id: clerkId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = evt.data;

        if (!email_addresses?.[0]?.email_address) {
          console.error("No email address found for user:", clerkId);
          return new Response("No email address found", { status: 400 });
        }

        const name =
          `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";
        const username = await generateUniqueUsername(name);

        try {
          await db
            .update(users)
            .set({
              email: email_addresses[0].email_address,
              name,
              username,
              imageUrl: image_url,
            })
            .where(eq(users.id, clerkId));

          console.info(`Updated user in database with username: ${username}`);

          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });
        } catch (error) {
          console.error("Error updating user in database:", error);
          return new Response("Failed to update user", { status: 500 });
        }
        break;
      }
      case "user.deleted":
        break;
      case "session.created":
        break;
      default:
        break;
    }

    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
