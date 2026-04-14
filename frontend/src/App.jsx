import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const WELCOME = "Ready when you are.";

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatTitles, setChatTitles] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  useEffect(() => {
    if (chatHistory.length > 0 && chatHistory[0].type === "user") {
      setChatTitles((prev) => {
        const title = chatHistory[0].message.slice(0, 44);
        if (!title) {
          return prev;
        }

        if (prev[0] === title) {
          return prev;
        }

        const withoutDupes = prev.filter((item) => item !== title);
        return [title, ...withoutDupes].slice(0, 8);
      });
    }
  }, [chatHistory]);

  const startNewChat = () => {
    setChatError("");
    setMessage("");
    setChatHistory([]);
  };

  const typeMessage = (text) => {
    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            message: text.slice(0, i),
            typing: true,
          };
          return updated;
        });

        i += 1;
        if (i > text.length) {
          clearInterval(interval);
          setChatHistory((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              message: text,
              typing: false,
            };
            return updated;
          });
          resolve();
        }
      }, 14);
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    setChatError("");
    setLoading(true);

    const userMessage = message.trim();
    setMessage("");
    setChatHistory((prev) => [...prev, { type: "user", message: userMessage }]);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to process request.");
      }

      setChatHistory((prev) => [...prev, { type: "bot", message: "", confidence: data.confidence, typing: true }]);
      await typeMessage(data.reply);
    } catch (error) {
      setChatError(error.message || "Unable to process request.");
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", message: error.message || "Unable to process request." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onMessageKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="gpt-shell">
      <aside className="gpt-sidebar">
        <div className="sidebar-header">
          <button className="new-chat" onClick={startNewChat}>+ New chat</button>
        </div>
        <div className="sidebar-links">
          <button type="button">Search chats</button>
          <button type="button">Explore GPTs</button>
          <button type="button">Projects</button>
        </div>

        <div className="sidebar-recents">
          <p>Recents</p>
          {chatTitles.map((title, index) => (
            <button key={`${title}-${index}`} type="button">{title}</button>
          ))}
        </div>
      </aside>

      <main className="gpt-main">
        <header className="gpt-topbar">GigAI</header>

        <section className="gpt-thread">
          {chatHistory.length === 0 && (
            <div className="welcome-state">
              <h1>{WELCOME}</h1>
            </div>
          )}

          {chatHistory.length > 0 && (
            <div className="messages">
              {chatHistory.map((item, index) => (
                <article key={index} className={`msg ${item.type}`}>
                  <div className="msg-content">
                    {item.message.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    {item.typing && <span className="typing-caret" />}
                  </div>
                </article>
              ))}

              {loading && <div className="loader">Thinking...</div>}
              <div ref={chatEndRef} />
            </div>
          )}

          {chatError && <p className="error-text chat-error">{chatError}</p>}
        </section>

        <footer className="composer-wrap">
          <div className="composer">
            <button className="icon-btn" type="button">+</button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={onMessageKeyDown}
              rows={1}
              disabled={loading}
              placeholder="Ask anything"
            />
            <button className="icon-btn" type="button" onClick={sendMessage} disabled={loading || !message.trim()}>
              ↑
            </button>
          </div>
          <p className="disclaimer">This chatbot can make mistakes. Verify important details.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
