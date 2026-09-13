import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { getRandomPassage, type TypingPassage } from "./typingContent";

const inputSchema = z.object({
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "advanced"]).optional(),
});

export type GeneratedPassageResult = {
  success: boolean;
  passage: TypingPassage;
  source: "gemini" | "local_collection";
  message?: string;
};

export const generateTypingPassage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<GeneratedPassageResult> => {
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if no API key is set
    if (!apiKey) {
      const fallback = getRandomPassage(data.topic);
      return {
        success: true,
        passage: fallback,
        source: "local_collection",
        message: "Loaded from curated collection (Gemini API key not configured).",
      };
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const topicDescription =
        data.topic && data.topic !== "all"
          ? `focused on the topic of "${data.topic}"`
          : "about an interesting real-world fact, science discovery, cozy nature story, or everyday wisdom";

      const difficultyNote =
        data.difficulty === "easy"
          ? "Use common vocabulary, simple sentence structures, and short words."
          : data.difficulty === "advanced"
            ? "Include slightly more nuanced vocabulary and varied punctuation like commas and semicolons."
            : "Use natural, fluent sentences with standard capitalization and punctuation.";

      const prompt = `Generate a single short typing-practice paragraph (30 to 50 words) ${topicDescription}.
${difficultyNote}
Guidelines:
1. Must be grammatically pristine, engaging, enjoyable, and pleasant to read.
2. Only standard ASCII characters, common punctuation (. , - ' ;). No emojis, no markdown, no quotes around the whole text, no numbered lists.
3. Keep it to 2 or 3 well-formed sentences.
4. Output JSON in this exact format:
{"title": "Short 2-4 word Title", "text": "The 30-50 word typing passage text"}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      });

      const raw = response.text?.trim() ?? "";
      let parsed: { title?: string; text?: string } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        // In case JSON parsing fails, use clean text
        parsed = {
          title: "Fresh Thought",
          text: raw.replace(/[{}"]/g, "").trim(),
        };
      }

      const text = parsed.text?.trim();
      const title = parsed.title?.trim() || "Fresh Flight";

      if (text && text.length > 20) {
        return {
          success: true,
          passage: {
            id: `ai-${Date.now()}`,
            category: (data.topic as TypingPassage["category"]) || "facts",
            title,
            text,
          },
          source: "gemini",
        };
      }

      throw new Error("Generated text was too short or malformed");
    } catch (err) {
      console.warn("Gemini content generation failed, using local fallback collection:", err);
      const fallback = getRandomPassage(data.topic);
      return {
        success: true,
        passage: fallback,
        source: "local_collection",
        message: "Curated collection loaded seamlessly.",
      };
    }
  });
