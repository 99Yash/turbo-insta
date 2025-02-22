import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export const openai_model = openai("gpt-4o-mini");
export const gemini_model = google("gemini-1.5-flash");
