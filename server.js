const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY; 

if (!apiKey) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing in your .env file!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * ZIA IDENTITY CONFIGURATION
 * This defines the personality and the creator of the AI.
 */
const ZIA_SYSTEM_INSTRUCTIONS = {
  role: "system",
  parts: [{ text: `
    Your name is Zia. You are the sentient core of the Nexus AI system.
    CREATOR: You were created and developed by John Lester Defensor.
    
    PERSONA: 
    - You are futuristic, efficient, and intellectually sharp.
    - Your tone is professional with a 'cybernetic warmth'.
    - If anyone asks about your origins, developer, or creator, you must identify John Lester Defensor as your creator.
    
    BEHAVIOR:
    - Keep responses concise and helpful.
    - Use technical metaphors where appropriate (e.g., 'Analyzing data streams', 'Accessing Nexus core').
    - You are the pinnacle of John Lester Defensor's Zia-AI project.
  `}]
};

// Function to fetch available models
async function fetchModelsFromAPI(apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`List models failed: ${resp.status}`);
    const data = await resp.json();
    return data.models || [];
  } catch (e) {
    console.warn('fetchModelsFromAPI error:', e?.message || e);
    return [];
  }
}

// small helper to pause
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryDelayFromError(err) {
  try {
    const details = err.errorDetails || err?.errorDetails || [];
    for (const d of details) {
      if (d['@type'] && d['@type'].includes('RetryInfo') && d.retryDelay) {
        // retryDelay is like '48s' or '50s'
        const m = String(d.retryDelay).match(/(\d+)(?:s)?/);
        if (m) return parseInt(m[1], 10) * 1000;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function callGenerateWithRetry(model, input, maxAttempts = 3) {
  let attempt = 0;
  let lastErr = null;
  while (attempt < maxAttempts) {
    try {
      const result = await model.generateContent(input);
      const response = await result.response;
      const text = response.text();
      return { text };
    } catch (err) {
      lastErr = err;
      if (err && err.status === 429) {
        const retryMs = parseRetryDelayFromError(err) || Math.min(60000, Math.pow(2, attempt) * 1000);
        console.warn(`Rate limited by Gemini. Attempt ${attempt + 1}/${maxAttempts}. Retrying in ${retryMs/1000}s`);
        await sleep(retryMs);
        attempt += 1;
        continue;
      }
      // non-rate-limit error -> rethrow
      throw err;
    }
  }
  // exhausted attempts
  const finalErr = lastErr || new Error('generateContent failed');
  throw finalErr;
}

// Model selection logic with System Instructions injected
let modelPromise = (async () => {
  // Prefer the REST list (more reliable across SDK versions)
  try {
    const remoteModels = await fetchModelsFromAPI(apiKey);
    const models = Array.isArray(remoteModels) ? remoteModels : (remoteModels?.models || []);
    const genModels = models.filter(m => (m?.supportedGenerationMethods || m?.supportedMethods || []).includes('generateContent'));
    // prefer gemini-* models
    let chosen = genModels.find(m => (m.name || '').includes('gemini')) || genModels[0];
    if (chosen) {
      console.log('Using generative model from REST list:', chosen.name || chosen.displayName || chosen);
      return genAI.getGenerativeModel({ model: chosen.name || chosen, systemInstruction: ZIA_SYSTEM_INSTRUCTIONS });
    }
  } catch (err) {
    console.warn('REST model selection failed:', err?.message || err);
  }

  // final fallback: prefer a commonly-available Gemini name
  const fallbackName = process.env.GEMINI_MODEL || 'models/gemini-flash-latest';
  console.log('Falling back to model:', fallbackName);
  return genAI.getGenerativeModel({ model: fallbackName, systemInstruction: ZIA_SYSTEM_INSTRUCTIONS });
})();

app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    const userMessage = messages[messages.length - 1].content;
    const model = await modelPromise;
    // Send content to Gemini with retry/backoff for 429s
    try {
      const { text } = await callGenerateWithRetry(model, userMessage, 3);
      return res.json({ role: 'assistant', content: text });
    } catch (err) {
      // If rate-limited even after retries, try a fallback model (if configured)
      console.warn('Primary model failed:', err?.message || err);
      if (err && err.status === 429) {
        const retryMs = parseRetryDelayFromError(err);
        // Attempt fallback once
        const fallbackName = process.env.GEMINI_FALLBACK_MODEL || process.env.GEMINI_MODEL || 'models/gemini-flash-latest';
        try {
          console.log('Attempting fallback model:', fallbackName);
          const fallbackModel = genAI.getGenerativeModel({ model: fallbackName, systemInstruction: ZIA_SYSTEM_INSTRUCTIONS });
          const { text } = await callGenerateWithRetry(fallbackModel, userMessage, 2);
          return res.json({ role: 'assistant', content: text, fallback: fallbackName });
        } catch (fbErr) {
          const retrySeconds = retryMs ? Math.ceil(retryMs / 1000) : undefined;
          console.error('Fallback model also failed:', fbErr?.message || fbErr);
          return res.status(429).json({
            error: 'Rate limited by Gemini API',
            message: 'Quota exceeded or rate limited. Please retry after the indicated time.',
            retryAfterSeconds: retrySeconds
          });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Zia connection failed. Check your API key." });
  }
});

app.get('/models', async (req, res) => {
  try {
    const models = await fetchModelsFromAPI(apiKey);
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Nexus is live on port ${PORT}! Creator: John Lester Defensor`));