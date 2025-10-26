import React from "react";

function AdminPage({ onHome, pendingRequests, onApproveRequest }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Dashboard</h2>
      <p style={styles.subtitle}>Welcome, Admin! Here you can manage users, events, and view statistics.</p>
      <button style={styles.homeBtn} onClick={onHome}>🏠 Back to Login</button>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Pending Event Requests</h3>
        {pendingRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul>
            {pendingRequests.map((req, idx) => (
              <li key={idx} style={{ marginBottom: "1em" }}>
                <strong>User:</strong> {req.user.username || req.user}<br />
                <strong>Event:</strong> {req.event.name || req.event}<br />
                <button onClick={() => onApproveRequest(idx)}>Assign to Event</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Features Coming Soon:</h3>
        <ul>
          <li>View all users</li>
          <li>View all events</li>
          <li>Delete or edit users/events</li>
          <li>See app statistics</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 500, margin: "40px auto", background: "#f0f4f8", padding: 32, borderRadius: 16, boxShadow: "0 2px 8px #eee", textAlign: "center" },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#3b82f6" },
  subtitle: { fontSize: 16, color: "#444", marginBottom: 24 },
  homeBtn: { marginTop: 24, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" },
  section: { marginTop: 32, textAlign: "left" },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
};

export default AdminPage;
