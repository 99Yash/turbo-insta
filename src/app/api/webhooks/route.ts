import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { generateUniqueUsername } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

// Add a GET endpoint for testing
export async function GET() {
  console.log(
    `[Webhook] GET request received - webhook endpoint is accessible`,
  );
  return new Response("Webhook endpoint is working", { status: 200 });
}

export async function POST(req: NextRequest) {
  console.log(`[Webhook] Received ${req.method} request to /api/webhooks`);

  if (req.method !== "POST") {
    console.log(`[Webhook] Rejected non-POST request`);
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    console.log(`[Webhook] Attempting to verify webhook...`);
    // Verify the payload with the headers
    const evt = await verifyWebhook(req);

    console.info(
      `[Webhook] Successfully verified webhook with ID ${evt.data.id} and type ${evt.type}`,
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

        console.log(`[Webhook] Generating username for: ${name}`);
        const username = await generateUniqueUsername(name);
        console.log(`[Webhook] Generated username: ${username}`);

        try {
          console.log(`[Webhook] Inserting user into database...`);
          await db.insert(users).values({
            id: clerkId,
            email: email_addresses[0].email_address,
            name,
            username,
            imageUrl: image_url,
            isVerified: false,
          });

          console.info(
            `[Webhook] ✅ Successfully created user in database with username: ${username}`,
          );

          console.log(`[Webhook] Updating Clerk user with username...`);
          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });
          console.log(
            `[Webhook] ✅ Successfully updated Clerk user with username`,
          );
        } catch (error) {
          console.error("[Webhook] ❌ Error creating user in database:", error);
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

        // Only generate new username if current user doesn't have one
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, clerkId),
          columns: { username: true },
        });

        if (!existingUser) {
          console.error("User not found in database:", clerkId);
          return new Response("User not found", { status: 404 });
        }

        let username = existingUser.username;
        if (!username) {
          username = await generateUniqueUsername(name);
        }

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

    console.log(`[Webhook] ✅ Webhook processing completed successfully`);
    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("[Webhook] ❌ Webhook processing error:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("[Webhook] Error message:", error.message);
      console.error("[Webhook] Error stack:", error.stack);
    }

    return new Response("Internal server error", { status: 500 });
  }
}
