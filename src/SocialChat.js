import React, { useState, useEffect, useRef } from "react";

function SocialChat({
  event,
  initialMessages = [],
  currentUser,
  onSendMessage,
  onBack,
  onHome,
  onUserClick,
  onLeaveEvent,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, event]);

  const sendMsg = () => {
    if (!input.trim()) return;
    const msg = { from: currentUser, text: input.trim() };
    setMessages((m) => [...m, msg]);
    setInput("");
    onSendMessage && onSendMessage(msg);
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages update
    const box = chatBoxRef.current;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages]);

  // 🟢 Duolingo-inspired theme (same palette direction as SocialHome)
  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#1CB0F6",
    gold: "#FFDE59",
    danger: "#EA2B2B",
    border: "#EEF2F7",
    track: "#E5E7EB",
    shadow: "0 4px 14px rgba(0,0,0,0.06)",
    shadowSoft: "0 10px 30px rgba(0,0,0,0.08)",
    radius: 16,
    radiusLg: 20,
  };

  const styles = {
    container: {
      maxWidth: 480,
      margin: "32px auto",
      background: theme.bg,
      padding: 20,
      borderRadius: theme.radiusLg,
      boxShadow: theme.shadow,
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, sans-serif",
      border: `1px solid ${theme.border}`,
    },

    // Event recap
    resultBox: {
      background: theme.card,
      padding: 16,
      borderRadius: theme.radius,
      marginBottom: 16,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    resultTitle: {
      fontWeight: 900,
      marginTop: 8,
      marginBottom: 8,
      color: theme.primary,
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
    },
    crewItem: { marginBottom: 6, color: theme.textMuted },
    bold: { fontWeight: 800, color: theme.text },

    // Chat area
    chat: {
      background: theme.card,
      padding: 16,
      borderRadius: theme.radius,
      marginBottom: 12,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    chatHeader: {
      fontWeight: 900,
      marginBottom: 10,
      color: theme.accent,
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
    },
    chatBox: {
      height: 260,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius,
      padding: 10,
      marginBottom: 10,
      background: "#FBFDFC",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    // message row wrapper
    row: {
      display: "flex",
      width: "100%",
    },
    rowRight: { justifyContent: "flex-end" },
    bubble: {
      maxWidth: "78%",
      padding: "10px 12px",
      borderRadius: 16,
      lineHeight: 1.35,
      fontSize: 14.5,
      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      border: `1px solid ${theme.border}`,
      background: "#FFFFFF",
      color: theme.text,
    },
    bubbleMe: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(88,204,2,0.25)",
    },
    bubbleName: {
      display: "block",
      fontWeight: 800,
      marginBottom: 4,
      fontSize: 12,
      color: theme.textMuted,
    },
    bubbleNameMe: {
      color: "rgba(255,255,255,0.9)",
    },

    // Input row
    chatInput: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },
    input: {
      border: `1px solid ${theme.border}`,
      borderRadius: 999,
      padding: "10px 14px",
      margin: "4px 0",
      flex: 1,
      outline: "none",
      background: "#FFFFFF",
      fontSize: 14.5,
    },
    sendBtn: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      border: "none",
      borderRadius: 999,
      padding: "10px 16px",
      fontWeight: 900,
      fontSize: 14,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
      transition: "transform 0.12s ease, box-shadow 0.2s",
    },

    // Footer CTA buttons
    backBtn: {
      marginTop: 10,
      background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(28,176,246,0.20)",
      width: "100%",
    },
    homeBtn: {
      marginTop: 10,
      background: "#FFFFFF",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      width: "100%",
    },
    leaveBtn: {
      marginTop: 10,
      background: theme.danger,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(234,43,43,0.20)",
      width: "100%",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.resultBox}>
        <div style={styles.resultTitle}>✨ The Event</div>
        <div><span style={styles.bold}>Event:</span> {event?.name}</div>
        <div><span style={styles.bold}>Time:</span> {event?.time}</div>
        <div><span style={styles.bold}>Budget:</span> €{event?.budget}</div>

        <div style={styles.resultTitle}>🧃 The Residents</div>
        {(event?.crew_full || event?.crew || []).map((item, i) => (
          <div
            key={i}
            style={{ ...styles.crewItem, cursor: "pointer" }}
            onClick={() => onUserClick && onUserClick(item)}
          >
            <span style={styles.bold}>
              {item.emoji} {item.name} ({item.country})
            </span>{" "}
            – "{item.desc}"
          </div>
        ))}
      </div>

      <div style={styles.chat}>
        <div style={styles.chatHeader}>💬 Group Chat</div>

        <div style={styles.chatBox} ref={chatBoxRef}>
          {messages.map((m, i) => {
            const mine = m.from === currentUser;
            return (
              <div
                key={i}
                style={{ ...styles.row, ...(mine ? styles.rowRight : {}) }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(mine ? styles.bubbleMe : {}),
                  }}
                >
                  <span
                    style={{
                      ...styles.bubbleName,
                      ...(mine ? styles.bubbleNameMe : {}),
                    }}
                  >
                    {mine ? "You" : m.from}
                  </span>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.chatInput}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            style={styles.input}
            onKeyDown={(e) => (e.key === "Enter" ? sendMsg() : null)}
          />
          <button style={styles.sendBtn} onClick={sendMsg}>Send</button>
        </div>
      </div>

      <button style={styles.backBtn} onClick={onBack}>Back to Results</button>
      <button style={styles.homeBtn} onClick={onHome}>Go to Homepage</button>
      <button
        style={styles.leaveBtn}
        onClick={() => onLeaveEvent && onLeaveEvent(event)}
      >
        Leave Event
      </button>
    </div>
  );
}

export default SocialChat;