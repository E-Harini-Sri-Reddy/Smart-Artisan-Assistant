import React, { useState } from "react";
import { ActionIcon } from "@mantine/core";
import { Minus, X, Send } from "lucide-react";

import aiIcon from "../images/ai-assistant-removebg.png";

export const AIAssistantButton = () => {
  const [opened, setOpened] = useState(false);

  // Message State
  const [message, setMessage] = useState("");

  // Chat Messages
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello 👋 I am your AI Assistant.\nHow can I help you today?",
      time: "10:30 AM",
    },
  ]);

  // Send Message
  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      type: "user",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  return (
    <>
      {/* Floating AI Button */}
      {!opened && (
        <div
          onClick={() => setOpened(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 18px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #9c6238, #b97848)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.22)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "18px",
            transition: "all 0.3s ease",
            userSelect: "none",
          }}
        >
          {/* Smaller Avatar */}
          <img
            src={aiIcon}
            alt="AI Assistant"
            style={{
              width: 20,
              height: 20,
              objectFit: "contain",
              borderRadius: "50%",
              background: "#fff",
              padding: 0,
            }}
          />

          <span>Ask AI</span>
        </div>
      )}

      {/* Chat Window */}
      {opened && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 370,
            height: 540,
            background: "#fff",
            borderRadius: 18,
            overflow: "hidden",
            zIndex: 1001,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.25s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #9c6238, #b97848)",
              color: "#fff",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <img
                src={aiIcon}
                alt="AI Assistant"
                style={{
                  width: 42,
                  height: 42,
                  objectFit: "contain",
                  borderRadius: "50%",
                  background: "#fff",
                  padding: 2,
                }}
              />

              <span
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                AI Assistant
              </span>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <ActionIcon
                variant="transparent"
                color="white"
                onClick={() => setOpened(false)}
              >
                <X size={18} />
              </ActionIcon>
            </div>
          </div>

          {/* Chat Body */}
          <div
            style={{
              flex: 1,
              padding: 16,
              background: "#f7f7f7",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.type === "user" ? "flex-end" : "flex-start",
                }}
              >
                {/* BOT MESSAGE */}
                {msg.type === "bot" ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      maxWidth: "85%",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#efe4db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={aiIcon}
                        alt="Bot"
                        style={{
                          width: 24,
                          height: 24,
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        background: "#fff",
                        padding: "12px 14px",
                        borderRadius: 14,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #eee",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: "#333",
                          lineHeight: 1.5,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {msg.text}
                      </p>

                      <span
                        style={{
                          display: "block",
                          marginTop: 8,
                          fontSize: 11,
                          color: "#999",
                        }}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* USER MESSAGE */
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #9c6238, #b97848)",
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: "16px 16px 4px 16px",
                      maxWidth: "75%",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                    </p>

                    <span
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 10,
                        opacity: 0.8,
                        textAlign: "right",
                      }}
                    >
                      {msg.time}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Input */}
          <div
            style={{
              padding: 14,
              borderTop: "1px solid #eee",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  padding: "0 14px",
                  outline: "none",
                  fontSize: 14,
                }}
              />

              <button
                onClick={handleSend}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, #9c6238, #b97848)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};