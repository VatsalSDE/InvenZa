import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Exporting the model instance (gemini-1.5-flash)
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log("Gemini initialized");

export default geminiModel;
