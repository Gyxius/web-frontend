import React, { useState, useEffect } from "react";
import users from "./users";

// Interesting places for event creation
const places = {
  Cité: [
    { id: "cite-1", name: "🏛️ Cité Universitaire Main Building", description: "Historic central building" },
    { id: "cite-2", name: "🌳 Cité Park", description: "Green space for outdoor activities" },
    { id: "cite-3", name: "🍽️ Cité Restaurant", description: "Main dining hall" },
    { id: "cite-4", name: "☕ Cité Café", description: "Cozy café for casual meetups" },
    { id: "cite-5", name: "📚 Cité Library", description: "Study and reading space" },
    { id: "cite-6", name: "🎭 Cité Theater", description: "Performance and events venue" },
    { id: "cite-7", name: "🏃 Cité Sports Complex", description: "Gym and sports facilities" },
    { id: "cite-8", name: "🎨 Cité Art Studio", description: "Creative workspace" },
  ],
  Paris: [
    { id: "paris-1", name: "🗼 Eiffel Tower Area", description: "Iconic landmark and surroundings" },
    { id: "paris-2", name: "🎨 Louvre Museum", description: "World-famous art museum" },
    { id: "paris-3", name: "🌉 Seine Riverside", description: "Scenic river walks" },
    { id: "paris-4", name: "🏰 Notre-Dame Area", description: "Historic cathedral district" },
    { id: "paris-5", name: "🌳 Luxembourg Gardens", description: "Beautiful public park" },
    { id: "paris-6", name: "🎭 Montmartre", description: "Artistic neighborhood" },
    { id: "paris-7", name: "☕ Latin Quarter Cafés", description: "Student area with cafés" },
    { id: "paris-8", name: "🛍️ Champs-Élysées", description: "Famous avenue" },
    { id: "paris-9", name: "🏛️ Musée d'Orsay", description: "Impressionist art museum" },
    { id: "paris-10", name: "🌺 Tuileries Garden", description: "Historic formal garden" },
  ],
};

export default function AdminAssign({ searches, pendingRequests, onAssignEvent, userEvents, onRemoveJoinedEvent }) {
  // Debug: show pendingRequests
  console.log("[DEBUG] pendingRequests:", pendingRequests);
  
  // Manage events list with state to allow removal - start with empty list
  const [events, setEvents] = useState([]);
  
  const [selectedIdx, setSelectedIdx] = useState(null);
  // Only keep one selectedEvent state for event modal
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedEventForModal, setSelectedEventForModal] = useState(null); // For viewing event details
  const [selectedEventId, setSelectedEventId] = useState(""); // For assignment dropdown
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestDetailIdx, setRequestDetailIdx] = useState(null);
  
  // Create Event state
  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    location: "Cité",
    place: "",
    date: "",
    time: "",
    category: "food",
    languages: [], // Array of languages for exchange
    description: "",
  });

  // When opening the assign panel for a request, preselect the first matching event
  useEffect(() => {
    if (selectedIdx !== null && Array.isArray(pendingRequests)) {
      const req = pendingRequests[selectedIdx];
      if (!req) return;
      const filtered = (events || []).filter(ev => matchesRequest(ev, req));
      if (!selectedEventId && filtered.length > 0) {
        setSelectedEventId(String(filtered[0].id));
      }
    }
  }, [selectedIdx, pendingRequests, selectedEventId, events]);

  // Event assignment matching - only checks: timeOfDay, location, category, language
  const matchesRequest = (ev, req) => {
    const e = ev || {};
    const r = (req && req.event) || {};
    
    // 1. Location match (Cité or Paris)
    if (r.location && e.location && String(e.location).toLowerCase() !== String(r.location).toLowerCase()) {
      return false;
    }
    
    // 2. Category match (food, drinks, party, random, walk)
    if (r.category && e.category !== r.category) {
      return false;
    }
    
    // 3. Language match - check if requested language is in event's languages array
    if (r.language) {
      if (Array.isArray(e.languages)) {
        if (!e.languages.includes(r.language)) return false;
      } else if (e.language !== r.language) {
        // Fallback for old format
        return false;
      }
    }
    
    // 4. Time of Day match (morning, afternoon, evening, night, whole-day)
    if (r.timeOfDay && r.timeOfDay !== "whole-day") {
      // Derive timeOfDay from event start time string (e.time like "19:00")
      const toMinutes = (hhmm) => {
        if (!hhmm || typeof hhmm !== "string") return null;
        const [h, m] = hhmm.split(":");
        const hh = parseInt(h, 10);
        const mm = parseInt(m, 10);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        return hh * 60 + mm;
      };
      const mins = toMinutes(e.time);
      let evTod = null;
      if (mins !== null) {
        if (mins >= 5 * 60 && mins < 12 * 60) evTod = "morning";        // 5:00 - 11:59
        else if (mins >= 12 * 60 && mins < 17 * 60) evTod = "afternoon"; // 12:00 - 16:59
        else if (mins >= 17 * 60 && mins < 21 * 60) evTod = "evening";   // 17:00 - 20:59
        else evTod = "night";                                             // 21:00 - 4:59
      }
      if (evTod && evTod !== r.timeOfDay) return false;
    }
    
    return true;
  };

  // Log admin activities
  const logAdminActivity = (msg) => {
    console.log(`[ADMIN ACTIVITY] ${msg}`);
  };
  
  // Handle event removal
  const handleRemoveEvent = (eventId) => {
    if (window.confirm("Are you sure you want to remove this event?")) {
      setEvents(events.filter(ev => ev.id !== eventId));
      logAdminActivity(`Removed event: ${eventId}`);
      // Close modal if it's open for this event
      if (selectedEventForModal && selectedEventForModal.id === eventId) {
        setSelectedEventForModal(null);
      }
    }
  };
  // Events now provided by a shared dataset (see src/events.js)

  // Duolingo-inspired theme to match SocialHome
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
    track: "#E5E7EB",
    border: "#EEF2F7",
    shadow: "0 4px 14px rgba(0,0,0,0.06)",
    shadowSoft: "0 10px 30px rgba(0,0,0,0.08)",
    radius: 18,
    radiusLg: 22,
  };

  const styles = {
    container: {
      position: "relative",
      minHeight: "100vh",
      background: theme.bg,
      padding: 24,
      maxWidth: 680,
      margin: "0 auto",
  fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },
    title: {
      fontSize: 24,
      fontWeight: 900,
      marginBottom: 18,
      textAlign: "center",
      color: theme.primary,
      letterSpacing: "-0.2px",
    },
    tabs: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 8,
      marginBottom: 18,
    },
    tabBtn: (active) => ({
      padding: 12,
      fontWeight: 900,
      background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
      color: active ? "white" : theme.text,
      border: `1px solid ${active ? theme.primary : theme.border}`,
      borderRadius: 14,
      cursor: "pointer",
      boxShadow: active ? "0 6px 16px rgba(88,204,2,0.28)" : "0 1px 3px rgba(0,0,0,0.06)",
    }),
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 10,
      color: theme.accent,
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    card: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: theme.radius,
      marginBottom: 12,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
    },
    itemRow: {
      background: theme.card,
      borderRadius: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: 16,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 15,
      color: theme.text,
      border: `1px solid ${theme.border}`,
    },
    primaryBtn: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
    },
    accentBtn: {
      background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 14,
      boxShadow: "0 6px 16px rgba(28,176,246,0.28)",
    },
    dangerBtn: {
      background: theme.danger,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "6px 10px",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 13,
      boxShadow: "0 2px 6px rgba(234,43,43,0.18)",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    },
    modal: {
      background: theme.card,
      borderRadius: theme.radiusLg,
      padding: 28,
      boxShadow: theme.shadowSoft,
      minWidth: 340,
      maxWidth: 520,
      border: `1px solid ${theme.border}`,
  fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },
    subtitle: { fontSize: 14, color: theme.textMuted },
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>🛠️ Admin Dashboard</div>
      <div style={styles.tabs}>
        <button style={styles.tabBtn(activeTab === "requests")} onClick={() => setActiveTab("requests")}>Pending Requests</button>
        <button style={styles.tabBtn(activeTab === "users")} onClick={() => setActiveTab("users")}>All Users</button>
        <button style={styles.tabBtn(activeTab === "events")} onClick={() => setActiveTab("events")}>All Events</button>
        <button style={styles.tabBtn(activeTab === "create")} onClick={() => setActiveTab("create")}>Create Event</button>
        <button style={styles.tabBtn(activeTab === "joined")} onClick={() => setActiveTab("joined")}>Joined Events</button>
      </div>
      {activeTab === "joined" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎟️ All Joined Events</div>
          <ul style={{ padding: 0 }}>
            {Object.entries(userEvents || {}).map(([userKey, events]) => (
              <li key={userKey} style={styles.card}>
                <div style={{ fontWeight: 800, color: theme.text, marginBottom: 8 }}>👤 {userKey}</div>
                <div style={{ ...styles.subtitle, marginBottom: 8 }}>Joined Events:</div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {Array.isArray(events) && events.length > 0 ? (
                    events.map((ev, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ color: theme.text }}>{ev.name} {ev.time ? `(${ev.time})` : ""}</span>
                        <button style={{ ...styles.dangerBtn, marginLeft: 12 }} onClick={() => onRemoveJoinedEvent && onRemoveJoinedEvent(userKey, idx)}>Remove</button>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: theme.textMuted }}>No events joined.</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === "create" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>➕ Create New Event</div>
          <div style={styles.card}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Event Name</label>
              <input
                type="text"
                value={createEventForm.name}
                onChange={(e) => setCreateEventForm({ ...createEventForm, name: e.target.value })}
                placeholder="e.g., French Coffee Chat"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Location</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 12,
                    border: `2px solid ${createEventForm.location === "Cité" ? theme.primary : theme.border}`,
                    background: createEventForm.location === "Cité" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                    color: createEventForm.location === "Cité" ? "white" : theme.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  onClick={() => setCreateEventForm({ ...createEventForm, location: "Cité", place: "" })}
                >
                  🏠 Cité
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 12,
                    border: `2px solid ${createEventForm.location === "Paris" ? theme.primary : theme.border}`,
                    background: createEventForm.location === "Paris" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                    color: createEventForm.location === "Paris" ? "white" : theme.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                  onClick={() => setCreateEventForm({ ...createEventForm, location: "Paris", place: "" })}
                >
                  🗼 Paris
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Choose a Place</label>
              <select
                value={createEventForm.place}
                onChange={(e) => setCreateEventForm({ ...createEventForm, place: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  fontSize: 14,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">-- Select a place --</option>
                {places[createEventForm.location].map((place) => (
                  <option key={place.id} value={place.name}>
                    {place.name} - {place.description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Date</label>
                <input
                  type="date"
                  value={createEventForm.date}
                  onChange={(e) => setCreateEventForm({ ...createEventForm, date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Time</label>
                <input
                  type="time"
                  value={createEventForm.time}
                  onChange={(e) => setCreateEventForm({ ...createEventForm, time: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Category</label>
                <select
                  value={createEventForm.category}
                  onChange={(e) => setCreateEventForm({ ...createEventForm, category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    fontSize: 14,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="food">🍽️ Food</option>
                  <option value="drinks">🍹 Drinks</option>
                  <option value="party">🎉 Party</option>
                  <option value="random">🎲 Random</option>
                  <option value="walk">🚶 A Walk</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                Language Exchange (select 2-3 languages)
              </label>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: 8,
                maxHeight: "200px",
                overflowY: "auto",
                padding: "8px",
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                background: "#FAFAFA",
              }}>
                {[
                  { id: "Spanish", label: "🇪🇸 Spanish" },
                  { id: "French", label: "🇫🇷 French" },
                  { id: "English", label: "🇬🇧 English" },
                  { id: "Italian", label: "🇮🇹 Italian" },
                  { id: "German", label: "🇩🇪 German" },
                  { id: "Portuguese", label: "🇵🇹 Portuguese" },
                  { id: "Japanese", label: "🇯🇵 Japanese" },
                  { id: "Mandarin", label: "🇨🇳 Mandarin" },
                  { id: "Korean", label: "🇰🇷 Korean" },
                  { id: "Arabic", label: "🇸🇦 Arabic" },
                  { id: "Russian", label: "🇷🇺 Russian" },
                  { id: "Hindi", label: "🇮🇳 Hindi" },
                  { id: "Dutch", label: "🇳🇱 Dutch" },
                  { id: "Swedish", label: "🇸🇪 Swedish" },
                  { id: "Polish", label: "🇵🇱 Polish" },
                  { id: "Turkish", label: "🇹🇷 Turkish" },
                  { id: "Greek", label: "🇬🇷 Greek" },
                  { id: "Hebrew", label: "🇮🇱 Hebrew" },
                ].map((lang) => (
                  <label
                    key={lang.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: createEventForm.languages.includes(lang.id) ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : "white",
                      color: createEventForm.languages.includes(lang.id) ? "white" : theme.text,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: createEventForm.languages.includes(lang.id) ? 900 : 600,
                      border: `1px solid ${createEventForm.languages.includes(lang.id) ? theme.primary : theme.border}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={createEventForm.languages.includes(lang.id)}
                      onChange={(e) => {
                        const langs = e.target.checked
                          ? [...createEventForm.languages, lang.id]
                          : createEventForm.languages.filter(l => l !== lang.id);
                        setCreateEventForm({ ...createEventForm, languages: langs });
                      }}
                      style={{ marginRight: 6, cursor: "pointer" }}
                    />
                    {lang.label}
                  </label>
                ))}
              </div>
              {createEventForm.languages.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: theme.accent, fontWeight: 600 }}>
                  Selected: {createEventForm.languages.join(" ↔ ")}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Description (optional)</label>
              <textarea
                value={createEventForm.description}
                onChange={(e) => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                placeholder="Add details about the event..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              style={{
                ...styles.primaryBtn,
                width: "100%",
                padding: "12px",
                fontSize: 15,
              }}
              onClick={() => {
                if (!createEventForm.name || !createEventForm.place || !createEventForm.date || !createEventForm.time) {
                  alert("Please fill in all required fields: Event Name, Place, Date, and Time");
                  return;
                }
                if (createEventForm.languages.length < 2) {
                  alert("Please select at least 2 languages for the language exchange");
                  return;
                }
                logAdminActivity(`Created new event: ${createEventForm.name} at ${createEventForm.place}`);
                // Here you would typically call a function to add the event to your events array
                alert(`Event "${createEventForm.name}" created successfully!\n\nLocation: ${createEventForm.location}\nPlace: ${createEventForm.place}\nDate: ${createEventForm.date}\nTime: ${createEventForm.time}\nLanguages: ${createEventForm.languages.join(" ↔ ")}`);
                // Reset form
                setCreateEventForm({
                  name: "",
                  location: "Cité",
                  place: "",
                  date: "",
                  time: "",
                  category: "food",
                  languages: [],
                  description: "",
                });
              }}
            >
              ✨ Create Event
            </button>
          </div>
        </div>
      )}
      {activeTab === "requests" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📝 Pending Requests</div>
          {(() => {
            const entries = Array.isArray(pendingRequests)
              ? pendingRequests.map((req, idx) => ({ req, idx }))
              : [];
            const pendingOnly = entries.filter(x => !x.req.stage || x.req.stage < 3);
            if (pendingOnly.length === 0) {
              return <div style={{ ...styles.card, color: theme.textMuted }}>No pending requests.</div>;
            }
            return (
              <ul style={{ padding: 0 }}>
                {pendingOnly.map(({ req, idx }) => (
                  <li
                    key={idx}
                    style={{ ...styles.itemRow, cursor: "pointer" }}
                    onClick={() => setRequestDetailIdx(idx)}
                    title="Click to view full request"
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}</div>
                      <div style={{ fontSize: 13.5, color: theme.textMuted }}>
                        {req.event?.location || req.event?.category || req.event?.name || "Event"}
                        {req.event?.date ? ` | ${req.event.date}` : ""}
                        {req.targetFriend ? ` | via ${req.targetFriend}` : ""}
                      </div>
                    </div>
                    <button
                      style={styles.primaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        logAdminActivity(`Clicked Assign Event for user ${typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}`);
                        setSelectedIdx(idx); // use original index
                        setSelectedEventId(""); // Reset dropdown selection
                      }}
                    >Assign Event</button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      )}

      {requestDetailIdx !== null && (
        <div style={styles.modalOverlay} onClick={() => setRequestDetailIdx(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: theme.accent, marginBottom: 10 }}>Request Details</div>
            {(() => {
              const req = pendingRequests[requestDetailIdx] || {};
              const userLabel = typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user || "");
              const ev = req.event || {};
              return (
                <>
                  <div style={{ marginBottom: 8 }}><b>User:</b> {userLabel}</div>
                  {req.targetFriend && (
                    <div style={{ marginBottom: 8 }}><b>Target Friend:</b> {String(req.targetFriend)}</div>
                  )}
                  <div style={{ fontWeight: 800, marginTop: 10, marginBottom: 6, color: theme.primary }}>Event Payload</div>
                  <ul style={{ margin: 0, paddingLeft: 16, color: theme.text }}>
                    {Object.keys(ev).length === 0 ? (
                      <li style={{ color: theme.textMuted }}>No event payload provided.</li>
                    ) : (
                      Object.entries(ev).map(([k, v]) => (
                        <li key={k}>
                          <b>{k}:</b> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </li>
                      ))
                    )}
                  </ul>
                  <div style={{ fontWeight: 800, marginTop: 12, marginBottom: 6, color: theme.accent }}>Raw</div>
                  <pre style={{ background: "#F9FAFB", padding: 12, borderRadius: 12, border: `1px solid ${theme.border}`, maxHeight: 280, overflow: "auto", fontSize: 13 }}>
                    {JSON.stringify(req, null, 2)}
                  </pre>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                    <button style={styles.accentBtn} onClick={() => setRequestDetailIdx(null)}>Close</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {activeTab === "users" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>👥 All Users</div>
          <ul style={{ padding: 0 }}>
            {users.map(user => (
              <li key={user.id} style={{ ...styles.card, cursor: "pointer" }} onClick={() => setSelectedUser(user)}>
                <div style={{ fontSize: 18.5, fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                  {user.emoji} {user.name} {user.country}
                </div>
                <div style={{ fontSize: 14, color: theme.textMuted }}>{user.desc}</div>
                {user.city && <div style={{ fontSize: 13, color: theme.textMuted }}><b>City:</b> {user.city}</div>}
                <div style={{ fontSize: 13, color: theme.textMuted }}><b>Languages:</b> {user.languages.join(", ")}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "events" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📅 All Events ({events.length})</div>
          <ul style={{ padding: 0 }}>
            {events.map(ev => (
              <li key={ev.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div 
                  style={{ flex: 1, cursor: "pointer" }} 
                  onClick={() => setSelectedEventForModal(ev)}
                >
                  <div style={{ fontSize: 18.5, fontWeight: 800, color: theme.text }}>{ev.name}</div>
                  <div style={{ fontSize: 14, color: theme.textMuted }}>Time: {ev.time}</div>
                  {ev.languageLabels && (
                    <div style={{ fontSize: 13, color: theme.accent, marginTop: 4 }}>{ev.languageLabels}</div>
                  )}
                </div>
                <button
                  style={styles.dangerBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveEvent(ev.id);
                  }}
                  title="Remove this event"
                >
                  🗑️ Remove
                </button>
              </li>
            ))}
          </ul>
          {/* Event Details Modal */}
          {selectedEventForModal && (
            <div style={styles.modalOverlay} onClick={() => setSelectedEventForModal(null)}>
              <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10, color: theme.primary }}>✨ The Event</div>
                <div style={{ fontSize: 16, marginBottom: 4 }}><b>Event:</b> {String(selectedEventForModal.name)}</div>
                <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Time:</b> {String(selectedEventForModal.time || selectedEventForModal.date)}</div>
                {/* Budget hidden in simplified flow */}
                {selectedEventForModal.location && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Location:</b> {String(selectedEventForModal.location)}</div>}
                {selectedEventForModal.description && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}><b>Description:</b> {String(selectedEventForModal.description)}</div>}
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 16, marginBottom: 8, color: theme.accent }}>🧃 The Residents</div>
                {Array.isArray(selectedEventForModal.crew) && selectedEventForModal.crew.length > 0 ? (
                  <ul style={{ paddingLeft: 16 }}>
                    {selectedEventForModal.crew.map((member, i) => {
                      let info = member;
                      if (typeof member === "object" && member.name) {
                        try {
                          info = require("./users").default.find(u => u.name === member.name) || member;
                        } catch {
                          info = member;
                        }
                      }
                      return (
                        <li key={i} style={{ marginBottom: 6, color: theme.text }}>
                          {info.emoji ? String(info.emoji) + " " : ""}
                          <b>{String(info.name)}</b>
                          {info.country ? ` (${String(info.country)})` : ""}
                          {info.desc ? ` – "${String(info.desc)}"` : ""}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ fontSize: 15, color: theme.textMuted }}>No residents listed.</div>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button style={{ ...styles.accentBtn, flex: 1 }} onClick={() => setSelectedEventForModal(null)}>Close</button>
                  <button 
                    style={{ ...styles.dangerBtn, flex: 1, padding: "8px 14px" }} 
                    onClick={() => {
                      handleRemoveEvent(selectedEventForModal.id);
                    }}
                  >
                    🗑️ Remove Event
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: theme.text }}>
              {selectedUser.emoji} {selectedUser.name} {selectedUser.country}
            </h3>
            <div style={{ fontSize: 16, color: theme.textMuted, marginBottom: 8 }}><b>Description:</b> {selectedUser.desc}</div>
            {selectedUser.city && <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}><b>City:</b> {selectedUser.city}</div>}
            <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}><b>Languages:</b> {selectedUser.languages.join(", ")}</div>
            <button style={{ ...styles.accentBtn, marginTop: 16 }} onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
      {selectedIdx !== null && activeTab === "requests" && (
        <div style={styles.card}>
          <div style={{ fontWeight: 900, marginBottom: 10, color: theme.accent }}>
            Assign Event to {typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}
          </div>
          {logAdminActivity(`Opened assignment modal for user ${typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}`)}
          {(() => {
            const req = pendingRequests[selectedIdx];
            const filtered = (events || []).filter(ev => matchesRequest(ev, req));
            return (
              <>
                <select value={selectedEventId || ""} onChange={e => {
            setSelectedEventId(e.target.value);
            logAdminActivity(`Selected event ${e.target.value} for user ${pendingRequests[selectedIdx].user}`);
                }} style={{ padding: 10, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 8, width: "100%" }}>
                  <option value="">-- Choose a Matching Event --</option>
                  {filtered.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.time})</option>
                  ))}
                </select>
                {filtered.length === 0 && (
                  <div style={{ color: theme.textMuted, fontSize: 13.5, marginBottom: 8 }}>
                    No events match this request. Adjust the user's request or add more events.
                  </div>
                )}
              </>
            );
          })()}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.primaryBtn} onClick={() => {
              logAdminActivity(`Confirmed assignment of event ${selectedEventId} to user ${pendingRequests[selectedIdx].user}`);
              if (onAssignEvent) onAssignEvent(selectedIdx, selectedEventId);
              setSelectedIdx(null);
              setSelectedEventId("");
            }}>Confirm Assignment</button>
            <button style={styles.dangerBtn} onClick={() => {
              logAdminActivity(`Cancelled assignment for user ${pendingRequests[selectedIdx].user}`);
              setSelectedIdx(null);
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
