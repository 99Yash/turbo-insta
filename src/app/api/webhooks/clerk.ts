import { type WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { buffer } from "micro";
import { type NextApiRequest, type NextApiResponse } from "next";
import { Webhook } from "svix";
import { generateUniqueUsername } from "~/lib/queries/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405);
  }
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  // Get the headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Error occured -- no svix headers" });
  }

  console.info("headers", req.headers, svix_id, svix_signature, svix_timestamp);
  // Get the body
  const body = (await buffer(req)).toString();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).json({ Error: err });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.info(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.info("Webhook body:", body);
  // TODO - handle the event
  switch (eventType) {
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
        return res.status(400).json({ error: "No email address found" });
      }

      const name =
        `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Anonymous";
      const username = await generateUniqueUsername(name);

      try {
        await db.insert(users).values({
          clerkId,
          email: email_addresses[0].email_address,
          name,
          username,
          imageUrl: image_url,
          isVerified: false,
        });

        console.info(`Created user in database: ${username}`);
      } catch (error) {
        console.error("Error creating user in database:", error);
        return res.status(500).json({ error: "Failed to create user" });
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
        return res.status(400).json({ error: "No email address found" });
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
          .where(eq(users.clerkId, clerkId));

        console.info(`Updated user in database: ${username}`);
      } catch (error) {
        console.error("Error updating user in database:", error);
        return res.status(500).json({ error: "Failed to update user" });
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
  return res.status(200).json({ response: "Success" });
}
