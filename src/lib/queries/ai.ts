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
    `Do not pass 99 characters. ` +
    `Use simple language. `;

  const { text } = await generateText({
    model: openai_4o_mini,
    system: systemPrompt,
    maxTokens: 25,
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
