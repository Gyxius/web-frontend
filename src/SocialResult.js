import React from "react";

function SocialResult({ event, onBack, onChat, onUserClick }) {
  return (
    <div style={styles.container}>
      <div style={styles.resultBox}>
        <div style={styles.resultTitle}>✨ The Event</div>
        <div>Event: {event.name}</div>
        <div>Time: {event.time || event.date || ""}</div>
        <div>Budget: €{event.budget || event.price || ""}</div>
        <div>Description: {event.description}</div>
        <div style={styles.resultTitle}>🧃 The Residents</div>
        {(event.crew_full || event.residents || []).filter(
          item => item && item.name
        ).map((item, idx) => (
          <div key={idx} style={{ ...styles.crewItem, paddingLeft: 20, cursor: "pointer" }} onClick={() => onUserClick && onUserClick(item)}>
            <span style={styles.bold}>
              {item.emoji} {item.name} ({item.country})
            </span>
            {" "}– "{item.desc}"
          </div>
        ))}
      </div>
      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={onChat}>
          ✅ I'm in!
        </button>
        <button style={styles.actionBtn} onClick={onBack}>
          🙅 Meh, spin again
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "40px auto", background: "#f0f4f8", padding: 20, borderRadius: 16, boxShadow: "0 2px 8px #eee" },
  resultBox: { background: "white", padding: 16, borderRadius: 12, marginBottom: 20 },
  resultTitle: { fontWeight: 600, marginTop: 8, marginBottom: 6 },
  crewItem: { marginBottom: 4, color: "#333" },
  bold: { fontWeight: 600 },
  actions: { display: "flex", gap: 8, marginTop: 12 },
  actionBtn: { background: "#5e81ac", color: "white", padding: 8, borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer", flex: 1 },
};

export default SocialResult;
