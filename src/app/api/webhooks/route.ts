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
    console.info("🔍 Webhook received, starting verification...");

    // Verify the payload with the headers
    const evt = await verifyWebhook(req);

    console.info(
      `✅ Webhook verified successfully with ID: ${evt.data.id} and type: ${evt.type}`,
    );

    switch (evt.type) {
      case "user.created": {
        console.info("👤 Processing user.created event...");

        const {
          id: clerkId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = evt.data;

        console.info(`📋 User data extracted:`, {
          clerkId,
          email: email_addresses?.[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        });

        if (!email_addresses?.[0]?.email_address) {
          console.error("❌ No email address found for user:", clerkId);
          return new Response("No email address found", { status: 400 });
        }

        const name =
          `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";

        console.info(`🏷️  Generated name: "${name}"`);
        console.info("🎯 Generating unique username...");

        let username: string;
        try {
          username = await generateUniqueUsername(name);
          console.info(`✅ Username generated successfully: "${username}"`);
        } catch (error) {
          console.error("❌ Error generating username:", error);
          // Fallback to a simple username
          username = `user${Date.now().toString().slice(-6)}`;
          console.info(`🔄 Using fallback username: "${username}"`);
        }

        console.info("💾 Attempting to insert user into database...");
        console.info("🔗 Database connection status:", {
          dbExists: !!db,
          nodeEnv: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? "Present" : "Missing",
        });

        const userInsertData = {
          id: clerkId,
          email: email_addresses[0].email_address,
          name,
          username,
          imageUrl: image_url,
          isVerified: false,
        };

        console.info("📝 User data to insert:", userInsertData);

        try {
          // Test database connection first
          console.info("🔍 Testing database connection...");
          const testQuery = await db.query.users.findFirst({
            where: eq(users.id, "test-connection-id"),
          });
          console.info(
            "✅ Database connection test completed (no user found is expected)",
          );

          // Insert the user
          const insertResult = await db.insert(users).values(userInsertData);
          console.info(
            "✅ User insert query executed successfully:",
            insertResult,
          );

          // Verify the user was actually inserted
          console.info("🔍 Verifying user was inserted...");
          const insertedUser = await db.query.users.findFirst({
            where: eq(users.id, clerkId),
          });

          if (insertedUser) {
            console.info("✅ User successfully verified in database:", {
              id: insertedUser.id,
              username: insertedUser.username,
              email: insertedUser.email,
            });
          } else {
            console.error(
              "❌ CRITICAL: User was not found in database after insert!",
            );
            return new Response("User insert verification failed", {
              status: 500,
            });
          }

          console.info("🔄 Updating Clerk user with username...");
          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });
          console.info("✅ Clerk user updated successfully");
        } catch (error) {
          console.error("❌ CRITICAL ERROR in database operations:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userData: userInsertData,
          });
          return new Response("Failed to create user", { status: 500 });
        }
        break;
      }
      case "user.updated": {
        console.info("👤 Processing user.updated event...");

        const {
          id: clerkId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = evt.data;

        console.info(`📋 Update data for user ${clerkId}:`, {
          email: email_addresses?.[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        });

        if (!email_addresses?.[0]?.email_address) {
          console.error("❌ No email address found for user:", clerkId);
          return new Response("No email address found", { status: 400 });
        }

        const name =
          `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";

        // Only generate new username if current user doesn't have one
        console.info("🔍 Checking existing user...");
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, clerkId),
          columns: { username: true },
        });

        if (!existingUser) {
          console.error("❌ User not found in database:", clerkId);
          return new Response("User not found", { status: 404 });
        }

        let username = existingUser.username;
        if (!username) {
          console.info("🎯 User has no username, generating one...");
          try {
            username = await generateUniqueUsername(name);
            console.info(`✅ Username generated: "${username}"`);
          } catch (error) {
            console.error("❌ Error generating username:", error);
            username = `user${Date.now().toString().slice(-6)}`;
            console.info(`🔄 Using fallback username: "${username}"`);
          }
        }

        try {
          console.info("💾 Updating user in database...");
          await db
            .update(users)
            .set({
              email: email_addresses[0].email_address,
              name,
              username,
              imageUrl: image_url,
            })
            .where(eq(users.id, clerkId));

          console.info(
            `✅ User updated in database with username: ${username}`,
          );

          console.info("🔄 Updating Clerk user with username...");
          const cc = await clerkClient();
          await cc.users.updateUser(clerkId, {
            username,
          });
          console.info("✅ Clerk user updated successfully");
        } catch (error) {
          console.error("❌ Error updating user in database:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            clerkId,
          });
          return new Response("Failed to update user", { status: 500 });
        }
        break;
      }
      case "user.deleted":
        console.info("🗑️  User deleted event received (no action needed)");
        break;
      case "session.created":
        console.info("🔑 Session created event received (no action needed)");
        break;
      default:
        console.info(`ℹ️  Unhandled webhook event type: ${evt.type}`);
        break;
    }

    console.info("✅ Webhook processing completed successfully");
    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("❌ CRITICAL WEBHOOK ERROR:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response("Internal server error", { status: 500 });
  }
}
