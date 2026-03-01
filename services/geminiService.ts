import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

export const askProfessorSparky = async (context: string, question: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Professor Sparky is on a coffee break (Missing API Key).";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context of the app state: ${context}\n\nUser Question: ${question}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I'm scratching my head on that one!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oops! My radio signal is breaking up. Try again later.";
  }
};
