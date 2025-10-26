import React, { useState } from "react";

export default function AdminAssign({ searches, pendingRequests, onAssignEvent }) {
  // Debug: show pendingRequests
  console.log("[DEBUG] pendingRequests:", pendingRequests);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("");

  // Log admin activities
  const logAdminActivity = (msg) => {
    console.log(`[ADMIN ACTIVITY] ${msg}`);
  };
  const events = [
    { id: "e1", name: "Karaoke on the Rooftop", time: "10:00 PM" },
    { id: "e2", name: "Picnic @ Montsouris", time: "9:00 PM" },
    { id: "e3", name: "Board Games Evening", time: "7:30 PM" },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#f0f4f8", padding: 32, borderRadius: 16, boxShadow: "0 2px 8px #eee" }}>
      {/* DEBUG: Show pendingRequests raw data */}
      <pre style={{ background: "#f0f4f8", color: "#333", fontSize: 12, padding: 8, borderRadius: 8, marginBottom: 8 }}>
        [DEBUG] pendingRequests: {JSON.stringify(pendingRequests, null, 2)}
      </pre>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#3b82f6" }}>Admin Dashboard</h2>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Pending Requests</h3>
        {(!pendingRequests || pendingRequests.length === 0) ? (
          <div>No pending requests.</div>
        ) : (
          <ul style={{ padding: 0 }}>
            {pendingRequests.map((req, idx) => (
              <li key={idx} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 12, marginBottom: 8 }}>
                <div><b>User:</b> {req.user}</div>
                <div><b>Request:</b> {req.event.type || req.event.category || req.event.name || "Event"} {req.event.date ? `| ${req.event.date}` : ""}</div>
                <button
                  style={{ marginTop: 8, background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}
                  onClick={() => {
                    logAdminActivity(`Clicked Assign Event for user ${req.user}`);
                    setSelectedIdx(idx);
                  }}
                >Assign Event</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedIdx !== null && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee", padding: 24, marginBottom: 24 }}>
          <h3>Assign Event to {pendingRequests[selectedIdx].user}</h3>
          {logAdminActivity(`Opened assignment modal for user ${pendingRequests[selectedIdx].user}`)}
          <select value={selectedEvent} onChange={e => {
            setSelectedEvent(e.target.value);
            logAdminActivity(`Selected event ${e.target.value} for user ${pendingRequests[selectedIdx].user}`);
          }} style={{ padding: 8, borderRadius: 6, marginBottom: 12 }}>
            <option value="">-- Choose an Event --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name} ({ev.time})</option>
            ))}
          </select>
          <button style={{ background: "#10b981", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }} onClick={() => {
            logAdminActivity(`Confirmed assignment of event ${selectedEvent} to user ${pendingRequests[selectedIdx].user}`);
            if (onAssignEvent) onAssignEvent(selectedIdx, selectedEvent);
            setSelectedIdx(null);
            setSelectedEvent("");
          }}>Confirm Assignment</button>
          <button style={{ marginLeft: 12, background: "#ef4444", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }} onClick={() => {
            logAdminActivity(`Cancelled assignment for user ${pendingRequests[selectedIdx].user}`);
            setSelectedIdx(null);
          }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
