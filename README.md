# Nova AI

A simple AI chatbot web app. You type a message, it is sent to Google's Gemini AI, and the reply appears in the chat. The app remembers the current conversation, so you can ask follow-up questions.

## Technologies

- **Next.js + React**: the chat page and a server-side API route, `POST /api/chat`
- **@google/genai**: Google's official Gemini SDK (used only on the server)
- **react-markdown**: shows AI replies as formatted text (lists, code blocks)

## Project structure

```
chatbot/
├── app/
│   ├── page.js            # Chat page (React): messages, input, loading, errors
│   ├── layout.js          # Page wrapper and title
│   ├── globals.css        # Styling
│   └── api/chat/route.js  # Server route that calls Gemini (API key lives here)
├── .env.example           # Template for your environment variables
└── package.json
```

How it works: the page sends `{ message, history }` to `POST /api/chat`. The route checks the input, sends the conversation (last 20 messages) to Gemini, and returns `{ "reply": "..." }`, or `{ "error": "..." }` with an HTTP error status. The API key is only read on the server and never reaches the browser.

## Setup

**Requirements:** Node.js 20 or newer.

1. **Get a Gemini API key:** go to <https://aistudio.google.com/apikey>, sign in with a Google account, and click **Create API key**.
2. **Create your `.env` file** in the project folder by copying the template:
   ```
   copy .env.example .env        (Windows)
   cp .env.example .env          (macOS/Linux)
   ```
   Then open `.env` and replace `your-api-key-here` with your key:
   ```
   GEMINI_API_KEY=AIza...your key...
   GEMINI_MODEL=gemini-3.8-flash
   ```
   `.env` is listed in `.gitignore`, so it won't be committed. Never name the key with a `NEXT_PUBLIC_` prefix, because that would send it to the browser.
3. **Install dependencies:**
   ```
   npm install
   ```
4. **Start the app:**
   ```
   npm run dev
   ```
   For a production build instead, run `npm run build` and then `npm start`.
5. Open **http://localhost:3000** in your browser.

## Testing a conversation

1. Click a suggestion, or type "What is the capital of France?" and press **Enter**. Shift+Enter adds a new line.
2. Ask a follow-up: "What is its population?" The answer should be about Paris, which shows the conversation history is sent.
3. Click **+ New chat**, then ask "What did I just ask you?" The AI should not know, because the context was reset.
4. Try sending an empty message. The Send button stays disabled.

## Common errors

| Message in the chat | Cause / fix |
|---|---|
| "Server is missing GEMINI_API_KEY" | `.env` is missing or has no key. Create it (step 2) and restart `npm run dev`. |
| "The server's Gemini API key is invalid" | Check for typos or extra spaces in `.env`, or create a new key in AI Studio. |
| "The configured Gemini model was not found" | Change `GEMINI_MODEL` to a current model name from the [Gemini models list](https://ai.google.dev/gemini-api/docs/models). |
| "Rate limit or quota reached" | The free tier limits requests per minute and per day. Wait a minute, or check your quota in AI Studio. |
| "Could not reach Gemini" | The server has no internet connection, or a firewall/proxy is blocking it. |
| "The AI took too long to respond" | Gemini didn't answer within 30 seconds. Try again. |
| "Cannot reach the server. Is it running?" | The browser can't reach the app. Start it with `npm run dev`. |
