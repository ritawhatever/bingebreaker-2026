import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini
// NOTE: process.env.API_KEY is assumed to be available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMotivation = async (): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: "Generate a short, powerful, 1-sentence motivation quote specifically for someone avoiding night-time snacking.",
    });
    return response.text || "You are stronger than your cravings.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Every healthy choice is a victory.";
  }
};

export const getCoachResponse = async (userMessage: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // Transform simple history to Gemini format if needed, but for simple generateContent we can just use chat structure
    // We will use the chat helper for maintaining context easier in a real app, 
    // but here we can just do a stateless call with context or use the chat API.
    
    const chat = ai.chats.create({
        model: model,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: history
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini Coach Error:", error);
    return "I'm having trouble connecting to my brain right now, but remember: Urges are like waves, they rise and then fall. Ride it out.";
  }
};
