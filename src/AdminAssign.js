import React, { useState } from "react";
import users from "./users";

export default function AdminAssign({ searches, pendingRequests, onAssignEvent, userEvents, onRemoveJoinedEvent }) {
  // Debug: show pendingRequests
  console.log("[DEBUG] pendingRequests:", pendingRequests);
  const [selectedIdx, setSelectedIdx] = useState(null);
  // Only keep one selectedEvent state for event modal
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#3b82f6" }}>Admin Dashboard</h2>
      <div style={{ display: "flex", marginBottom: 24 }}>
        <button
          style={{ flex: 1, padding: 12, fontWeight: 600, background: activeTab === "requests" ? "#3b82f6" : "#e0e7ef", color: activeTab === "requests" ? "white" : "#333", border: "none", borderRadius: "8px 0 0 8px", cursor: "pointer" }}
          onClick={() => setActiveTab("requests")}
        >Pending Requests</button>
        <button
          style={{ flex: 1, padding: 12, fontWeight: 600, background: activeTab === "users" ? "#3b82f6" : "#e0e7ef", color: activeTab === "users" ? "white" : "#333", border: "none", borderRadius: "0 8px 0 0", cursor: "pointer" }}
          onClick={() => setActiveTab("users")}
        >All Users</button>
        <button
          style={{ flex: 1, padding: 12, fontWeight: 600, background: activeTab === "events" ? "#3b82f6" : "#e0e7ef", color: activeTab === "events" ? "white" : "#333", border: "none", borderRadius: "0 0 8px 8px", cursor: "pointer" }}
          onClick={() => setActiveTab("events")}
        >All Events</button>
        <button
          style={{ flex: 1, padding: 12, fontWeight: 600, background: activeTab === "joined" ? "#3b82f6" : "#e0e7ef", color: activeTab === "joined" ? "white" : "#333", border: "none", borderRadius: "0 0 8px 8px", cursor: "pointer" }}
          onClick={() => setActiveTab("joined")}
        >All Joined Events</button>
      </div>
      {activeTab === "joined" && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>All Joined Events</h3>
          <ul style={{ padding: 0 }}>
            {Object.entries(userEvents || {}).map(([userKey, events]) => (
              <li key={userKey} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 12, marginBottom: 8 }}>
                <div><b>User:</b> {userKey}</div>
                <div><b>Joined Events:</b></div>
                <ul style={{ paddingLeft: 16 }}>
                  {Array.isArray(events) && events.length > 0 ? events.map((ev, idx) => (
                    <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                      <span>{ev.name} {ev.time ? `(${ev.time})` : ""}</span>
                      <button style={{ marginLeft: 12, background: "#ef4444", color: "white", border: "none", borderRadius: 6, padding: "2px 8px", fontWeight: 600, cursor: "pointer" }} onClick={() => onRemoveJoinedEvent && onRemoveJoinedEvent(userKey, idx)}>Remove</button>
                    </li>
                  )) : <li style={{ color: "#888" }}>No events joined.</li>}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === "requests" && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Pending Requests</h3>
          {(!pendingRequests || pendingRequests.length === 0) ? (
            <div>No pending requests.</div>
          ) : (
            <ul style={{ padding: 0 }}>
              {pendingRequests.map((req, idx) => (
                <li key={idx} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 12, marginBottom: 8 }}>
                  <div><b>User:</b> {typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}</div>
                  <div><b>Request:</b> {req.event.type || req.event.category || req.event.name || "Event"} {req.event.date ? `| ${req.event.date}` : ""}</div>
                  <button
                    style={{ marginTop: 8, background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}
                    onClick={() => {
                      logAdminActivity(`Clicked Assign Event for user ${typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}`);
                      setSelectedIdx(idx);
                    }}
                  >Assign Event</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === "users" && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>All Users</h3>
          <ul style={{ padding: 0 }}>
            {users.map(user => (
              <li key={user.id} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 12, marginBottom: 8, cursor: "pointer" }}
                  onClick={() => setSelectedUser(user)}>
                <div style={{ fontSize: 20 }}>{user.emoji} <b>{user.name}</b> {user.country}</div>
                <div style={{ fontSize: 14, color: "#555" }}>{user.desc}</div>
                {user.city && <div style={{ fontSize: 13, color: "#888" }}><b>City:</b> {user.city}</div>}
                <div style={{ fontSize: 13, color: "#888" }}><b>Languages:</b> {user.languages.join(", ")}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "events" && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>All Events</h3>
          <ul style={{ padding: 0 }}>
            {events.map(ev => (
              <li key={ev.id} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: 12, marginBottom: 8, cursor: "pointer" }}
                  onClick={() => setSelectedEvent(ev)}>
                <div style={{ fontSize: 20 }}><b>{ev.name}</b></div>
                <div style={{ fontSize: 14, color: "#555" }}>Time: {ev.time}</div>
              </li>
            ))}
          </ul>
          {/* Event Details Modal */}
          {selectedEvent && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedEvent(null)}>
              <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #aaa", padding: 32, minWidth: 320, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>✨ The Event</div>
                <div style={{ fontSize: 16, marginBottom: 4 }}><b>Event:</b> {String(selectedEvent.name)}</div>
                <div style={{ fontSize: 15, color: "#444", marginBottom: 4 }}><b>Time:</b> {String(selectedEvent.time || selectedEvent.date)}</div>
                {selectedEvent.budget && <div style={{ fontSize: 15, color: "#444", marginBottom: 4 }}><b>Budget:</b> €{String(selectedEvent.budget)}</div>}
                {selectedEvent.location && <div style={{ fontSize: 15, color: "#444", marginBottom: 4 }}><b>Location:</b> {String(selectedEvent.location)}</div>}
                {selectedEvent.description && <div style={{ fontSize: 15, color: "#444", marginBottom: 4 }}><b>Description:</b> {String(selectedEvent.description)}</div>}
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>🧃 The Residents</div>
                {Array.isArray(selectedEvent.crew) && selectedEvent.crew.length > 0 ? (
                  <ul style={{ paddingLeft: 16 }}>
                    {selectedEvent.crew.map((member, i) => {
                      let info = member;
                      if (typeof member === "object" && member.name) {
                        try {
                          info = require("./users").default.find(u => u.name === member.name) || member;
                        } catch {
                          info = member;
                        }
                      }
                      return (
                        <li key={i} style={{ marginBottom: 6 }}>
                          {info.emoji ? String(info.emoji) + " " : ""}
                          <b>{String(info.name)}</b>
                          {info.country ? ` (${String(info.country)})` : ""}
                          {info.desc ? ` – "${String(info.desc)}"` : ""}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ fontSize: 15, color: "#888" }}>No residents listed.</div>
                )}
                <button style={{ marginTop: 16, background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }} onClick={() => setSelectedEvent(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #aaa", padding: 32, minWidth: 320, maxWidth: 400 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{selectedUser.emoji} {selectedUser.name} {selectedUser.country}</h3>
            <div style={{ fontSize: 16, color: "#555", marginBottom: 8 }}><b>Description:</b> {selectedUser.desc}</div>
            {selectedUser.city && <div style={{ fontSize: 15, color: "#888", marginBottom: 8 }}><b>City:</b> {selectedUser.city}</div>}
            <div style={{ fontSize: 15, color: "#888", marginBottom: 8 }}><b>Languages:</b> {selectedUser.languages.join(", ")}</div>
            <button style={{ marginTop: 16, background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }} onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
      {selectedIdx !== null && activeTab === "requests" && (
        <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee", padding: 24, marginBottom: 24 }}>
          <h3>Assign Event to {typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}</h3>
          {logAdminActivity(`Opened assignment modal for user ${typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}`)}
          <select value={selectedEvent || ""} onChange={e => {
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
