"use client";

// The chat page: keeps the conversation in React state and talks to POST /api/chat.
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  { icon: "💡", title: "Explain a concept", text: "Explain a difficult concept, like recursion, in simple terms." },
  { icon: "✍️", title: "Help me write", text: "Help me write a short, polite email asking for a deadline extension." },
  { icon: "🚀", title: "Project ideas", text: "Give me ideas for a beginner programming project." },
];

export default function ChatPage() {
  // Each message: { role: "user" | "model" | "error", text: "..." }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to the newest message whenever the list changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(text) {
    const message = text.trim();
    if (!message || isLoading) return;

    // Only successful user/AI messages are sent as context (error bubbles and failed messages are left out).
    const history = messages.filter((m) => m.role !== "error" && !m.failed);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.reply !== "string") {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (error) {
      const text = error instanceof TypeError ? "Cannot reach the server. Is it running?" : error.message;
      // Mark the user message as failed so it is not sent as context later.
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "user", text: message, failed: true },
        { role: "error", text },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    // Enter sends, Shift+Enter adds a new line.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    setInput("");
  }

  // The sidebar shows the current chat, named after its first message.
  const chatTitle = messages.find((m) => m.role === "user")?.text;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">✦</span> Nova AI
        </div>
        <button className="new-chat" type="button" onClick={clearChat} disabled={isLoading}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New chat
        </button>
        {chatTitle && (
          <>
            <p className="sidebar-label">Today</p>
            <div className="chat-item active">{chatTitle}</div>
          </>
        )}
        <p className="sidebar-footer">Your AI assistant · Powered by Google Gemini</p>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar-title">Nova AI</span>
          <button className="icon-button" type="button" onClick={clearChat} disabled={isLoading} aria-label="New chat">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <main className={`messages ${messages.length === 0 ? "empty" : ""}`}>
          {messages.length === 0 ? (
            <section className="welcome">
              <div className="welcome-logo">✦</div>
              <h2>
                Hi, I&apos;m <span>Nova</span>. What can I help with?
              </h2>
              <p>I&apos;m your AI assistant. Ask me anything, and I&apos;ll do my best to help.</p>
            </section>
          ) : (
            <div className="thread">
              {messages.map((message, index) => (
                <div key={index} className={`msg ${message.role}`}>
                  {message.role === "model" ? <ReactMarkdown>{message.text}</ReactMarkdown> : message.text}
                </div>
              ))}
              {isLoading && <div className="msg model thinking" aria-label="AI is typing" />}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        <form
          className={`composer ${messages.length === 0 ? "centered" : ""}`}
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <div className="input-box">
            <textarea
              rows={1}
              placeholder="Message Nova AI"
              maxLength={4000}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button type="submit" className="send" disabled={isLoading || !input.trim()} aria-label="Send message">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {messages.length === 0 && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s.title} type="button" className="suggestion" onClick={() => sendMessage(s.text)}>
                  <span>{s.icon}</span> {s.title}
                </button>
              ))}
            </div>
          )}
          <p className="hint">AI can make mistakes. Check important info.</p>
        </form>
      </div>
    </div>
  );
}
