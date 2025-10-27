import React, { useState } from "react";

function SocialChat({ event, initialMessages = [], currentUser, onSendMessage, onBack, onHome, onUserClick, onLeaveEvent }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, event]);

  const sendMsg = () => {
    if (!input.trim()) return;
    const msg = { from: currentUser, text: input.trim() };
    setMessages((m) => [...m, msg]);
    setInput("");
    if (onSendMessage) onSendMessage(msg);
  };

  return (
    <div style={styles.container}>
      <div style={styles.resultBox}>
        <div style={styles.resultTitle}>✨ The Event</div>
        <div>Event: {event?.name}</div>
        <div>Time: {event?.time}</div>
        <div>Budget: €{event?.budget}</div>
        <div style={styles.resultTitle}>🧃 The Residents</div>
        {(event?.crew_full || event?.crew || []).map((item, i) => (
          <div key={i} style={{ ...styles.crewItem, cursor: "pointer" }} onClick={() => onUserClick && onUserClick(item)}>
            <span style={styles.bold}>{item.emoji} {item.name} ({item.country})</span> – "{item.desc}"
          </div>
        ))}
      </div>
      <div style={styles.chat}>
        <div style={styles.chatHeader}>💬 Group Chat</div>
        <div style={styles.chatBox}>
          {messages.map((m, i) => (
            <div key={i}>
              <span style={styles.bold}>
                {m.from === currentUser ? "You" : m.from}:
              </span> {m.text}
            </div>
          ))}
        </div>
        <div style={styles.chatInput}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Say something..."
            style={{ ...styles.input, flex: 1 }}
          />
          <button style={styles.sendBtn} onClick={sendMsg}>Send</button>
        </div>
      </div>
      <button style={styles.backBtn} onClick={onBack}>Back to Results</button>
      <button style={styles.homeBtn} onClick={onHome}>Go to Homepage</button>
      <button style={styles.leaveBtn} onClick={() => onLeaveEvent && onLeaveEvent(event)}>Leave Event</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "40px auto", background: "#f0f4f8", padding: 20, borderRadius: 16, boxShadow: "0 2px 8px #eee" },
  resultBox: { background: "white", padding: 16, borderRadius: 12, marginBottom: 20 },
  resultTitle: { fontWeight: 600, marginTop: 8, marginBottom: 6 },
  crewItem: { marginBottom: 4, color: "#333" },
  bold: { fontWeight: 600 },
  chat: { background: "#fff", padding: 16, borderRadius: 12, marginBottom: 16 },
  chatHeader: { fontWeight: 600, marginBottom: 8 },
  chatBox: { height: 180, border: "1px solid #d1dce5", borderRadius: 6, padding: 8, marginBottom: 8, background: "#f7f9fb", overflowY: "auto" },
  chatInput: { display: "flex", alignItems: "center", gap: 8 },
  input: { border: "1px solid #ccc", borderRadius: 6, padding: 8, margin: "4px 0" },
  sendBtn: { background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  backBtn: { marginTop: 16, background: "#5e81ac", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  homeBtn: { marginTop: 8, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  leaveBtn: { marginTop: 8, background: "#e63946", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
};

export default SocialChat;
