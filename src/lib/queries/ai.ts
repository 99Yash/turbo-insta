import "server-only";

import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { openai_4o_mini } from "~/config/ai";
import { db } from "~/server/db";
import { users } from "~/server/db/schema/users";

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
    abortSignal: AbortSignal.timeout(20000),
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
  console.info(`🎯 Generating username for: "${name}"`);

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
    Usernames should be unique and memorable. It cannot be "settings" or "signout" or "messages" or "notifications" or "profile" or "home" or "search" or "explore". Obviously strip the quotes.
  `;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      console.info(
        `🔄 Username generation attempt ${attempts + 1}/${maxAttempts}`,
      );

      const { text } = await generateText({
        model: openai_4o_mini,
        system: systemPrompt,
        maxTokens: 9,
        abortSignal: AbortSignal.timeout(10000), // Increased to 10 seconds for username generation
        messages: [
          {
            role: "user",
            content: `Generate a username for: ${name}`,
          },
        ],
      });

      const username = text.trim().toLowerCase();
      console.info(`🎲 Generated candidate username: "${username}"`);

      console.info("🔍 Checking if username is already taken...");
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!existingUser) {
        console.info(`✅ Username "${username}" is available!`);
        return username;
      }

      console.info(
        `❌ Username "${username}" is already taken, trying again...`,
      );
      attempts++;
    } catch (error) {
      console.error(
        `❌ Error in username generation attempt ${attempts + 1}:`,
        error,
      );
      attempts++;

      // If this is the last attempt, don't continue the loop
      if (attempts >= maxAttempts) {
        break;
      }
    }
  }

  // If all attempts fail, generate a random username with timestamp
  console.info("🔄 All AI attempts failed, generating fallback username...");
  const timestamp = Date.now().toString().slice(-4);
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 4);

  // Ensure we have at least some characters from the name
  const namePrefix = sanitizedName || "user";
  const fallbackUsername = `${namePrefix}${timestamp}`;

  console.info(`🆘 Using fallback username: "${fallbackUsername}"`);

  // Double-check this username doesn't exist (very unlikely but just in case)
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, fallbackUsername),
    });

    if (existingUser) {
      // Add a random suffix if it somehow exists
      const randomSuffix = Math.random().toString(36).substring(2, 4);
      const finalUsername = `${fallbackUsername}${randomSuffix}`;
      console.info(`🔄 Fallback username existed, using: "${finalUsername}"`);
      return finalUsername;
    }
  } catch (error) {
    console.error("❌ Error checking fallback username uniqueness:", error);
    // Continue with the fallback username anyway
  }

  return fallbackUsername;
}
