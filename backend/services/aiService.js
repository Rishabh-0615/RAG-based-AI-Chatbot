import Knowledge from "../models/knowledgeModel.js";
import AIUsage from "../models/aiUsageModel.js";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getRuntimeConfig = () => ({
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || "",
  maxRequestsPerHour: parseInt(process.env.MAX_AI_REQUESTS_PER_HOUR, 10) || 20,
});

const isGeminiKeyInvalidError = (error) => {
  const text = String(error?.message || "");
  const apiMessage = String(error?.response?.data?.error?.message || "");
  return (
    text.includes("API key not valid") ||
    text.includes("API_KEY_INVALID") ||
    apiMessage.includes("API key not valid") ||
    apiMessage.includes("API_KEY_INVALID")
  );
};

const isTransientGeminiError = (error) => {
  const status = error?.status || error?.response?.status;
  const message = String(error?.message || "").toLowerCase();
  const apiMessage = String(error?.response?.data?.error?.message || "").toLowerCase();
  const combined = `${message} ${apiMessage}`;

  return (
    status === 429 ||
    status === 503 ||
    combined.includes("high demand") ||
    combined.includes("service unavailable") ||
    combined.includes("resource exhausted") ||
    combined.includes("timeout")
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateGeminiResponseWithRetry = async (geminiApiKey, prompt) => {
  const maxAttempts = 3;
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      await sleep(600 * attempt);
    }
  }

  throw lastError || new Error("Gemini response generation failed after retries.");
};

export const checkRateLimit = async (userId) => {
  const { maxRequestsPerHour } = getRuntimeConfig();
  const usage = await AIUsage.findOne({ userId });
  const now = new Date();

  if (!usage) {
    await AIUsage.create({ userId, requestCount: 1, windowStart: now });
    return;
  }

  const oneHour = 60 * 60 * 1000;

  if (now - usage.windowStart > oneHour) {
    usage.requestCount = 1;
    usage.windowStart = now;
    await usage.save();
    return;
  }

  if (usage.requestCount >= maxRequestsPerHour) {
    throw new Error("AI request limit exceeded.");
  }

  usage.requestCount += 1;
  await usage.save();
};

export const buildConversationContext = (conversation, newMessage) => {
  const lastMessages = conversation.messages.slice(-7);
  const contextText = lastMessages
    .map((msg) => `${msg.sender}: ${msg.text}`)
    .join("\n");
  return contextText + `\nuser: ${newMessage}`;
};

export const generateEmbedding = async (text) => {
  const { geminiApiKey } = getRuntimeConfig();

  if (!geminiApiKey) {
    return null;
  }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiApiKey}`,
    {
      content: { parts: [{ text }] },
    }
  ).catch((error) => {
    if (isGeminiKeyInvalidError(error)) {
      return { data: { embedding: { values: null } } };
    }
    throw error;
  });

  return response?.data?.embedding?.values || null;
};

export const retrieveRelevantKnowledge = async (embedding) => {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return await Knowledge.find({}).limit(3);
  }

  const results = await Knowledge.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: 50,
        limit: 3,
      },
    },
    {
      $addFields: { score: { $meta: "vectorSearchScore" } },
    },
  ]);

  if (!results.length) {
    return await Knowledge.find({}).limit(3);
  }

  return results;
};

export const generateAIResponse = async (retrievedDocs, conversationContext, role) => {
  const { geminiApiKey } = getRuntimeConfig();
  const knowledgeText = retrievedDocs.map((doc) => doc.content).join("\n\n");

  const prompt = `You are a Credit Intelligence Assistant for a gig worker lending platform.
Answer questions about loans, credit scores, eligibility, interest rates, repayment, insurance, and tax.
Use ONLY the provided policy context. Be helpful and professional.
If not found say: "I cannot find this in our credit policies."

IMPORTANT: Detect the language of the user's message and reply in the SAME language.
If the user writes in Marathi, reply in Marathi.
If the user writes in Hindi, reply in Hindi.
If the user writes in English, reply in English.
Same for any other language.

User Role: ${role}
Policy Context:
${knowledgeText}

Conversation:
${conversationContext}`;

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend .env.");
  }

  try {
    return await generateGeminiResponseWithRetry(geminiApiKey, prompt);
  } catch (error) {
    if (isTransientGeminiError(error)) {
      throw new Error("Gemini is currently experiencing high demand. Please retry in a few seconds.");
    }

    if (isGeminiKeyInvalidError(error)) {
      throw new Error("GEMINI_API_KEY is invalid. Please update it in backend .env.");
    }

    throw error;
  }
};

