import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { generateUniqueUsername } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

type UserEventData = {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string;
};

type ExtractedUserData = {
  clerkId: string;
  email: string;
  name: string;
  imageUrl?: string;
};

/**
 * Extracts and validates user data from webhook event
 */
const extractUserData = (eventData: UserEventData): ExtractedUserData => {
  const {
    id: clerkId,
    email_addresses,
    first_name,
    last_name,
    image_url,
  } = eventData;

  if (!email_addresses?.[0]?.email_address) {
    throw new Error(`No email address found for user: ${clerkId}`);
  }

  const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";

  return {
    clerkId,
    email: email_addresses[0].email_address,
    name,
    imageUrl: image_url,
  };
};

/**
 * Updates the Clerk user with the provided username
 */
const updateClerkUser = async (
  clerkId: string,
  username: string,
): Promise<void> => {
  const cc = await clerkClient();
  await cc.users.updateUser(clerkId, { username });
};

/**
 * Handles user creation logic
 */
const handleUserCreation = async (
  userData: ExtractedUserData,
): Promise<void> => {
  const { clerkId, email, name, imageUrl } = userData;

  const username = await generateUniqueUsername(name);

  try {
    await db.insert(users).values({
      id: clerkId,
      email,
      name,
      username,
      imageUrl,
      isVerified: false,
    });

    console.info(`Created user in database with username: ${username}`);
    await updateClerkUser(clerkId, username);
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw new Error("Failed to create user");
  }
};

/**
 * Handles user update logic
 */
const handleUserUpdate = async (userData: ExtractedUserData): Promise<void> => {
  const { clerkId, email, name, imageUrl } = userData;

  // Check if user exists and get existing username
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, clerkId),
    columns: { username: true },
  });

  if (!existingUser) {
    throw new Error(`User not found in database: ${clerkId}`);
  }

  // Generate username only if user doesn't have one
  let username = existingUser.username;
  if (!username) {
    username = await generateUniqueUsername(name);
  }

  try {
    await db
      .update(users)
      .set({
        email,
        name,
        username,
        imageUrl,
      })
      .where(eq(users.id, clerkId));

    console.info(`Updated user in database with username: ${username}`);
    await updateClerkUser(clerkId, username);
  } catch (error) {
    console.error("Error updating user in database:", error);
    throw new Error("Failed to update user");
  }
};

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
        try {
          const userData = extractUserData(evt.data);
          await handleUserCreation(userData);
        } catch (error) {
          console.error("Error in user.created:", error);
          return new Response(
            error instanceof Error ? error.message : "Failed to create user",
            {
              status:
                error instanceof Error && error.message.includes("No email")
                  ? 400
                  : 500,
            },
          );
        }
        break;
      }
      case "user.updated": {
        try {
          const userData = extractUserData(evt.data);
          await handleUserUpdate(userData);
        } catch (error) {
          console.error("Error in user.updated:", error);
          const isUserNotFound =
            error instanceof Error && error.message.includes("User not found");
          const isEmailMissing =
            error instanceof Error && error.message.includes("No email");

          return new Response(
            error instanceof Error ? error.message : "Failed to update user",
            {
              status: isUserNotFound ? 404 : isEmailMissing ? 400 : 500,
            },
          );
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
