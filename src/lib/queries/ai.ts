import { generateText } from "ai";
import { openai_model } from "~/config/product";

export const generateAltText = async (imagePath: string) => {
  const systemPrompt =
    `You will receive an image. ` +
    `Please create an alt text for the image. ` +
    `Be concise. ` +
    `Use adjectives only when necessary. ` +
    `Do not pass 100 characters. ` +
    `Use simple language. `;

  const { text } = await generateText({
    model: openai_model,
    system: systemPrompt,
    maxTokens: 30,
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
