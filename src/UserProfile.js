import React from "react";

function UserProfile({ user, onBack, onAddFriend, isFriend, onRequestJoinEvent, joinedEvents }) {
  if (!user) return null;
  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <div style={styles.card}>
        <div style={styles.emoji}>{user.emoji}</div>
        <div style={styles.name}>{user.name} ({user.country})</div>
        <div style={styles.type}>Type: {user.type}</div>
        <div style={styles.desc}>{user.desc}</div>
        <div style={styles.info}><b>Age:</b> {user.age}</div>
        <div style={styles.info}><b>House:</b> {user.house}</div>
        <div style={styles.info}><b>Points:</b> {user.points}</div>
        <div style={styles.info}><b>Languages:</b> {user.languages?.join ? user.languages.join(", ") : user.languages}</div>
        <div style={styles.info}><b>Interests:</b> {user.interests?.join ? user.interests.join(", ") : user.interests}</div>
        {!isFriend && (
          <button style={styles.friendBtn} onClick={() => onAddFriend && onAddFriend(user)}>
            Add Friend
          </button>
        )}
        {isFriend && (
          <div style={styles.friendStatus}>✅ You are friends</div>
        )}
        {isFriend && joinedEvents.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Friend's Events:</div>
            {joinedEvents.map((event, idx) => (
              <div key={idx} style={styles.eventCard}>
                <div style={styles.eventName}>{event.name}</div>
                <div style={styles.details}>⏰ {event.time || event.date || ""}</div>
                <div style={styles.details}>💶 Budget: €{event.budget || event.price || ""}</div>
                <button style={styles.joinBtn} onClick={() => onRequestJoinEvent && onRequestJoinEvent(user, event)}>
                  Request to Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "40px auto", padding: 20, background: "#f0f4f8", borderRadius: 16, boxShadow: "0 2px 8px #eee" },
  backBtn: { marginBottom: 16, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  card: { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px #eee" },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 6 },
  type: { fontSize: 16, color: "#555", textAlign: "center", marginBottom: 8 },
  desc: { fontSize: 15, color: "#444", textAlign: "center", marginBottom: 12 },
  info: { fontSize: 14, color: "#333", marginBottom: 6 },
  friendBtn: { marginTop: 16, background: "#10b981", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  friendStatus: { marginTop: 16, color: "#10b981", fontWeight: 600, textAlign: "center" },
  eventCard: { background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 12, boxShadow: "0 1px 4px #eee" },
  eventName: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  details: { fontSize: 14, color: "#444" },
  joinBtn: { marginTop: 8, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 600, cursor: "pointer" },
};

export default UserProfile;
