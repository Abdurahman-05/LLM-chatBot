// POST /api/chat: receives the conversation and returns Gemini's reply.
// This runs only on the server, so the API key never reaches the browser.
import { GoogleGenAI, ApiError } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_MESSAGE_LENGTH = 4000; // characters per message
const MAX_HISTORY = 20; // previous messages sent as context
const TIMEOUT_MS = 30000; // give up on Gemini after 30 seconds

const SYSTEM_INSTRUCTION =
  "You are Nova AI, a friendly, helpful AI assistant. Give clear, accurate answers. " +
  "Use Markdown (lists, code blocks) when it makes the answer easier to read.";

// Checks the request body. Returns an error string, or null if it is valid.
function validateChatRequest(body) {
  const { message, history } = body || {};
  if (typeof message !== "string" || message.trim() === "") return "Message cannot be empty.";
  if (message.length > MAX_MESSAGE_LENGTH) return `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`;
  if (history !== undefined && !Array.isArray(history)) return "History must be a list.";
  for (const item of history || []) {
    const validRole = item && (item.role === "user" || item.role === "model");
    if (!validRole || typeof item.text !== "string" || item.text.length > 20000) {
      return "History contains an invalid message.";
    }
  }
  return null;
}

// Sends the conversation to Gemini and returns the reply text.
async function askGemini(apiKey, message, history) {
  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    ...history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];
  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  });
  return response.text;
}

// Turns any Gemini/network error into a status code and a short, safe message.
function toFriendlyError(error) {
  if (error.name === "TimeoutError" || error.name === "AbortError") {
    return [504, "The AI took too long to respond. Please try again."];
  }
  if (error instanceof ApiError) {
    if (error.status === 429) return [429, "Rate limit or quota reached. Please wait a moment and try again."];
    if (error.status === 400 && /API key/i.test(error.message)) return [500, "The server's Gemini API key is invalid."];
    if (error.status === 401 || error.status === 403) return [500, "The server's Gemini API key is invalid or not allowed."];
    if (error.status === 404) return [500, "The configured Gemini model was not found. Check GEMINI_MODEL."];
    return [502, "Gemini returned an error. Please try again."];
  }
  return [502, "Could not reach Gemini. Check the server's internet connection."];
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server is missing GEMINI_API_KEY. See the README to set it up." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const validationError = validateChatRequest(body);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const reply = await askGemini(apiKey, body.message.trim(), body.history || []);
    if (!reply || !reply.trim()) {
      return Response.json({ error: "The AI returned an empty response. Please try rephrasing." }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (error) {
    const [status, message] = toFriendlyError(error);
    console.error(`Gemini request failed (${status}):`, error.message);
    return Response.json({ error: message }, { status });
  }
}
