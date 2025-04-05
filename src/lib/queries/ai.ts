import { generateText } from "ai";
import { openai_model } from "~/config/ai";

export const generateAltText = async (imagePath: string) => {
  const systemPrompt =
    `You will receive an image. ` +
    `Create an alt text for the image. ` +
    `Be concise. ` +
    `Use adjectives when necessary. ` +
    `Do not pass 99 characters. ` +
    `Use simple language. `;

  const { text } = await generateText({
    model: openai_model,
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
