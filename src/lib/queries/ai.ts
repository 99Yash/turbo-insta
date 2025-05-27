import "server-only";

import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { openai_4o_mini } from "~/config/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";
import { DISALLOWED_USERNAMES } from "../utils";

export const generateAltText = async (imagePath: string) => {
  const systemPrompt =
    `You will receive an image. ` +
    `Create an alt text for the image. ` +
    `Be concise. ` +
    `Use adjectives when necessary. ` +
    `Use simple language. ` +
    `No more than 18 words.`;

  const { text } = await generateText({
    model: openai_4o_mini,
    system: systemPrompt,
    abortSignal: AbortSignal.timeout(5000),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imagePath,
          },
        ],
      },
    ],
  });

  return text;
};

export async function generateUniqueUsername(name: string): Promise<string> {
  const systemPrompt = `
    Generate a unique, memorable username based on the person's name.
    Rules:
    - Length should be between 5-8 characters
    - Use only lowercase letters and numbers
    - No special characters
    - Can be a combination of name parts or a creative variation
    - Should be unique and memorable
    Example inputs and outputs:
    - "John Smith" -> "johny8"
    - "Sarah Johnson" -> "sarahj"
    - "Michael Brown" -> "mikeb42"
    Usernames should be unique and memorable. It cannot be "settings" or "signout" or "messages" or "notifications" or "profile" or "home" or "search" or "explore".
  `;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const { text } = await generateText({
      model: openai_4o_mini,
      system: systemPrompt,
      maxTokens: 9,
      abortSignal: AbortSignal.timeout(5000),
      messages: [
        {
          role: "user",
          content: `Generate a username for: ${name}`,
        },
      ],
      tools: {
        validateUsername: {
          description: "Validate a username",
          parameters: z.object({
            username: z.string(),
          }),
          execute: async ({ username }: { username: string }) => {
            return !DISALLOWED_USERNAMES.includes(username.toLowerCase());
          },
        },
      },
    });

    const username = text.trim().toLowerCase();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!existingUser) {
      return username;
    }

    attempts++;
  }

  // If all attempts fail, generate a random username with timestamp
  const timestamp = Date.now().toString().slice(-4);
  return `${name.toLowerCase().slice(0, 4)}${timestamp}`;
}
