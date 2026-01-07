const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
 // Change line 5 to this:
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);
  
  try {
    const models = await genAI.listModels(); // This asks Google for your available models
    console.log("✅ Your available models are:");
    console.log(models);
  } catch (e) {
    console.error("❌ Error listing models:", e);
  }
}

listModels();