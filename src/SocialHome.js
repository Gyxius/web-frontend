import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import users from "./users";
import "./SocialHome.animations.css";

function SocialHome({
  userName = "Guest",
  onJoinEvent,
  joinedEvents = [],
  onJoinedEventClick,
  onUserClick,
  onLeaveEvent,
  pendingRequests = [],
  onCancelPendingRequest,
  showDebug,
  friendRequestsIncoming = [],
  onAcceptFriendRequestFrom,
  onDeclineFriendRequestFrom,
}) {
  if (showDebug) {
    console.log("[DEBUG] joinedEvents for", userName, joinedEvents);
  }

  const [selectedPending, setSelectedPending] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fadeIn = { animation: "fadeIn 0.7s cubic-bezier(0.23, 1, 0.32, 1)" };
  const pulse = { animation: "pulse 1.2s infinite" };

  const socialPoints = 120;
  const nextLevel = 200;
  const highlightEvent = {
    name: "Karaoke on the Rooftop",
    time: "10:00 PM",
    attendees: 22,
  };

  const friendsActivity = [];

  // 🟢 Duolingo-inspired theme
  const theme = {
    bg: "#F7F7F5",          // off-white used in Duolingo surfaces
    card: "#FFFFFF",
    text: "#1F2937",        // slate-800
    textMuted: "#6B7280",   // slate-500
    primary: "#58CC02",     // Duolingo green
    primaryDark: "#37B300", // darker green for gradient/hover
    accent: "#1CB0F6",      // sky blue links/sections
    gold: "#FFDE59",        // crown gold
    danger: "#EA2B2B",      // Duolingo red
    track: "#E5E7EB",       // progress track
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
      maxWidth: 520,
      margin: "0 auto",
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, sans-serif",
    },
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    iconButton: { background: "none", border: "none", cursor: "pointer" },
    points: {
      fontSize: 15,
      fontWeight: 700,
      color: theme.text,
      padding: "6px 10px",
      borderRadius: 999,
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    },
    greeting: {
      fontSize: 22,
      fontWeight: 800,
      marginBottom: 18,
      color: theme.text,
      letterSpacing: "-0.2px",
    },

    // Progress pill like Duolingo XP bar
    progressBox: {
      backgroundColor: theme.track,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: 22,
      height: 26,
      position: "relative",
    },
    progressBar: {
      height: "100%",
      background: `linear-gradient(90deg, ${theme.primaryDark}, ${theme.primary})`,
      borderRadius: 999,
      transition: "width 0.4s ease",
    },
    progressText: {
      position: "absolute",
      left: "50%",
      top: 0,
      transform: "translateX(-50%)",
      fontSize: 12.5,
      color: "white",
      fontWeight: 800,
      textShadow: "0 1px 0 rgba(0,0,0,0.15)",
    },

    // Cards
    highlightCard: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: theme.radiusLg,
      marginBottom: 22,
      boxShadow: theme.shadow,
      border: "1px solid #EEF2F7",
    },
    highlightTitle: {
      fontSize: 16,
      fontWeight: 900,
      marginBottom: 8,
      color: theme.primary,
      letterSpacing: "0.3px",
    },
    highlightEvent: {
      fontSize: 20,
      fontWeight: 800,
      marginBottom: 6,
      color: theme.text,
      letterSpacing: "-0.2px",
    },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 800,
      marginBottom: 10,
      color: theme.accent,
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    title: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 18,
      textAlign: "center",
      color: theme.primary,
      letterSpacing: "-0.2px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    empty: {
      textAlign: "center",
      marginTop: 22,
      fontSize: 16,
      color: theme.textMuted,
    },

    eventCard: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: theme.radiusLg,
      marginBottom: 14,
      boxShadow: theme.shadow,
      border: "1px solid #EEF2F7",
      cursor: "pointer",
      position: "relative",
      transition: "box-shadow 0.2s, transform 0.2s",
      ...fadeIn,
    },
    eventName: {
      fontSize: 18.5,
      fontWeight: 800,
      marginBottom: 8,
      color: theme.text,
      letterSpacing: "-0.2px",
    },
    details: { fontSize: 14.5, color: theme.textMuted },

    leaveButton: {
      marginTop: 12,
      background: theme.danger,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "9px 14px",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
      boxShadow: "0 2px 6px rgba(234,43,43,0.18)",
    },

    joinButtonRow: { display: "flex", gap: 14, marginBottom: 22 },
    joinButton: {
      flex: 1,
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      border: "none",
      borderRadius: 14,
      padding: "14px 0",
      fontWeight: 900,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
      transition: "transform 0.12s ease, box-shadow 0.2s",
    },

    pendingCard: {
      background: theme.card,
      borderRadius: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: 16,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 15,
      color: theme.textMuted,
      border: "1px solid #EEF2F7",
    },
    cancelButton: {
      background: theme.danger,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 14,
      boxShadow: "0 2px 6px rgba(234,43,43,0.18)",
    },

    // Floating action button
    fab: {
      position: "fixed",
      bottom: 32,
      right: "calc(50vw - 260px + 32px)",
      background: `radial-gradient(120% 120% at 30% 20%, ${theme.primary} 0%, ${theme.primaryDark} 70%)`,
      width: 64,
      height: 64,
      borderRadius: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 12px 28px rgba(88,204,2,0.40)",
      fontSize: 30,
      color: "white",
      border: "none",
      cursor: "pointer",
      zIndex: 100,
      transition: "transform 0.15s ease",
      ...pulse,
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
      maxWidth: 500,
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, sans-serif",
      border: "1px solid #EEF2F7",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.iconButton} onClick={() => setShowProfileModal(true)}>
          <FaUserCircle size={40} color={theme.primary} />
        </button>

        {showProfileModal && (
          <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              {(() => {
                const userInfo = users.find(
                  (u) => u.name.toLowerCase() === userName.toLowerCase()
                );
                if (!userInfo) return <div>No profile info found for {userName}.</div>;
                return (
                  <>
                    <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: theme.text }}>
                      {userInfo.emoji} {userInfo.name} {userInfo.country}
                    </h3>
                    <div style={{ fontSize: 16, color: theme.textMuted, marginBottom: 8 }}>
                      <b>Description:</b> {userInfo.desc}
                    </div>
                    {userInfo.city && (
                      <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}>
                        <b>City:</b> {userInfo.city}
                      </div>
                    )}
                    <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}>
                      <b>Languages:</b> {userInfo.languages.join(", ")}
                    </div>
                    <button style={styles.cancelButton} onClick={() => setShowProfileModal(false)}>
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <span style={styles.points}>⭐ {socialPoints} pts</span>
      </div>

      <div style={styles.greeting}>Hi {userName} 👋, ready for tonight?</div>

      <div style={styles.progressBox}>
        <div style={{ ...styles.progressBar, width: `${(socialPoints / nextLevel) * 100}%` }} />
        <span style={styles.progressText}>Level 2 Explorer ({socialPoints}/{nextLevel})</span>
      </div>

      <div style={styles.highlightCard}>
        <div style={styles.highlightTitle}>🔥 Popular Tonight</div>
        <div style={styles.highlightEvent}>{highlightEvent.name}</div>
        <div style={styles.details}>⏰ {highlightEvent.time} · 👥 {highlightEvent.attendees} joined</div>
      </div>

      <div style={styles.section}>
        {/* Friend Requests Notification */}
        {friendRequestsIncoming && friendRequestsIncoming.length > 0 && (
          <div style={{ ...styles.highlightCard, marginTop: -4 }}>
            <div style={{ ...styles.highlightTitle, color: theme.accent }}>🔔 Friend Requests</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {friendRequestsIncoming.map((req, idx) => {
                const fromKey = req.from;
                const fromUser = users.find(u => u.name === fromKey || u.username === fromKey);
                const label = fromUser ? `${fromUser.emoji || ""} ${fromUser.name} ${fromUser.country || ""}` : fromKey;
                return (
                  <li key={idx} style={{ marginBottom: 10, listStyle: "disc", color: theme.text }}>
                    <span style={{ fontWeight: 700 }}>{label}</span>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        style={{
                          ...styles.joinButton,
                          padding: "10px 12px",
                          flex: "unset",
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                        }}
                        onClick={() => onAcceptFriendRequestFrom && onAcceptFriendRequestFrom(fromKey)}
                      >
                        Accept
                      </button>
                      <button
                        style={{
                          ...styles.cancelButton,
                          padding: "10px 12px",
                          marginTop: 0,
                        }}
                        onClick={() => onDeclineFriendRequestFrom && onDeclineFriendRequestFrom(fromKey)}
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div style={styles.sectionTitle}>👥 Friends are going to</div>
        {friendsActivity.map((f, idx) => (
          <div key={idx} style={styles.details}>
            • {f.name} → {f.event}
          </div>
        ))}
      </div>

      <div style={styles.title}>🎟️ My Joined Events</div>
      {joinedEvents.length === 0 ? (
        <div style={styles.empty}>You haven’t joined any events yet.</div>
      ) : (
        <div>
          {joinedEvents.map((item, idx) => (
            <div
              key={idx}
              style={styles.eventCard}
              className="eventCard"
              onClick={() => {
                console.log(
                  `[ACTIVITY] user "${userName}": clicked on joined event "${item.name || item.type || item.category || "Event"}"`,
                  item
                );
                onJoinedEventClick(item);
              }}
            >
              <div style={styles.eventName}>
                {String(item.name || item.type || item.category || "Event")}
              </div>
              <div style={styles.details}>⏰ {String(item.time || item.date)}</div>
              {item.budget && <div style={styles.details}>💶 Budget: €{String(item.budget)}</div>}

              {Array.isArray(item.crew) && item.crew.length > 0 && (
                <div style={styles.details}>
                  🧃 The Residents:
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {item.crew.map((member, i) => {
                      let userInfo =
                        typeof member === "object" && member !== null
                          ? member
                          : users.find((u) => u.name === member || u.username === member);
                      if (!userInfo) userInfo = { name: member };
                      return (
                        <li key={i} style={{ fontSize: 13, color: theme.textMuted }}>
                          {userInfo.emoji ? userInfo.emoji + " " : ""}
                          {userInfo.name} {userInfo.country ? `(${userInfo.country})` : ""} – "
                          {userInfo.desc || "No description."}"
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <button
                style={styles.leaveButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onLeaveEvent(item);
                }}
              >
                Leave
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.joinButtonRow}>
        <button style={styles.joinButton} className="joinButton" onClick={onJoinEvent}>
          ➕ Join a New Event
        </button>
        <button
          style={{
            ...styles.joinButton,
            background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
            boxShadow: "0 6px 16px rgba(28,176,246,0.28)",
          }}
          className="joinButton"
          onClick={() => onUserClick && onUserClick("friends")}
        >
          👥 Friends’ Events
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Pending Requests</div>
        {pendingRequests.length === 0 ? (
          <div style={styles.empty}>No pending requests.</div>
        ) : (
          <ul style={{ padding: 0 }}>
            {pendingRequests.map((req, idx) => (
              <li key={idx} style={styles.pendingCard} onClick={() => setSelectedPending(req)}>
                <span>
                  {req.event && (
                    <>
                      <strong>{req.event.type || req.event.category || "Event"}</strong>
                      {req.event.date && <> | <span>{req.event.date}</span></>}
                      {req.event.location && <> | <span>{req.event.location}</span></>}
                      {req.event.details && <> | <span>{req.event.details}</span></>}
                    </>
                  )}
                </span>
                <button
                  style={styles.cancelButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelPendingRequest(idx);
                  }}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedPending && (
          <div style={styles.modalOverlay} onClick={() => setSelectedPending(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontWeight: 900, marginBottom: 10 }}>Pending Request Details</h3>
              <pre
                style={{
                  fontSize: 14,
                  background: "#F9FAFB",
                  padding: 12,
                  borderRadius: 12,
                  maxHeight: 300,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(selectedPending, null, 2)}
              </pre>
              <button style={styles.cancelButton} onClick={() => setSelectedPending(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        style={styles.fab}
        className="fab"
        onClick={() => onUserClick && onUserClick("roulette")}
        title="Try your luck"
      >
        🎲
      </button>
    </div>
  );
}

export default SocialHome;