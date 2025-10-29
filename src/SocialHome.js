import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import users from "./users";
import "./SocialHome.animations.css";

function SocialHome({
  userName = "Guest",
  onJoinEvent,
  onEditProfile,
  joinedEvents = [],
  suggestedEvents = [],
  publicEvents = [],
  onJoinPublicEvent,
  onAcceptSuggestion,
  onDeclineSuggestion,
  onJoinedEventClick,
  onUserClick,
  onLeaveEvent,
  pendingRequests = [],
  onCancelPendingRequest,
  onOpenPendingRequest,
  showDebug,
  friendEvents = [],
  onRequestJoinEvent,
  friendRequestsIncoming = [],
  onAcceptFriendRequestFrom,
  onDeclineFriendRequestFrom,
}) {
  if (showDebug) {
    console.log("[DEBUG] joinedEvents for", userName, joinedEvents);
  }

  const [selectedPending, setSelectedPending] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // View mode: 'my' shows only user's joined events, 'friends' shows only friends' joined events
  const [viewMode, setViewMode] = useState("my");

  const fadeIn = { animation: "fadeIn 0.7s cubic-bezier(0.23, 1, 0.32, 1)" };
  const pulse = { animation: "pulse 1.2s infinite" };

  const socialPoints = 120;
  const nextLevel = 200;

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

  const isMobile = window.innerWidth <= 600;
  
  const styles = {
    container: {
      position: "relative",
      minHeight: "100vh",
      background: theme.bg,
      padding: isMobile ? 12 : 24,
      maxWidth: 520,
      margin: "0 auto",
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
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
      fontSize: isMobile ? 18 : 22,
      fontWeight: 800,
      marginBottom: isMobile ? 12 : 18,
      color: theme.text,
      letterSpacing: "-0.2px",
    },

    // Progress pill like Duolingo XP bar
    progressBox: {
      backgroundColor: theme.track,
      borderRadius: 999,
      overflow: "hidden",
      marginBottom: isMobile ? 16 : 22,
      height: isMobile ? 22 : 26,
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
      padding: isMobile ? 14 : 20,
      borderRadius: isMobile ? 14 : theme.radiusLg,
      marginBottom: isMobile ? 16 : 22,
      boxShadow: theme.shadow,
      border: "1px solid #EEF2F7",
    },
    highlightTitle: {
      fontSize: isMobile ? 14 : 16,
      fontWeight: 900,
      marginBottom: 8,
      color: theme.primary,
      letterSpacing: "0.3px",
    },
    highlightEvent: {
      fontSize: isMobile ? 17 : 20,
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
      padding: isMobile ? 14 : 20,
      borderRadius: isMobile ? 14 : theme.radiusLg,
      marginBottom: isMobile ? 10 : 14,
      boxShadow: theme.shadow,
      border: "1px solid #EEF2F7",
      cursor: "pointer",
      position: "relative",
      transition: "box-shadow 0.2s, transform 0.2s",
      ...fadeIn,
    },
    eventName: {
      fontSize: isMobile ? 16 : 18.5,
      fontWeight: 800,
      marginBottom: 8,
      color: theme.text,
      letterSpacing: "-0.2px",
    },
    details: { fontSize: isMobile ? 13 : 14.5, color: theme.textMuted },

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

    joinButtonRow: { display: "flex", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 22, flexWrap: "wrap" },
    joinButton: {
      flex: 1,
      minWidth: isMobile ? "100%" : "auto",
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      border: "none",
      borderRadius: 14,
      padding: isMobile ? "12px 0" : "14px 0",
      fontWeight: 900,
      fontSize: isMobile ? 15 : 16,
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
    pendingTextWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    meta: {
      fontSize: 12.5,
      color: theme.textMuted,
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
      bottom: isMobile ? 16 : 32,
      right: isMobile ? 16 : "calc(50vw - 260px + 32px)",
      background: `radial-gradient(120% 120% at 30% 20%, ${theme.primary} 0%, ${theme.primaryDark} 70%)`,
      width: isMobile ? 56 : 64,
      height: isMobile ? 56 : 64,
      borderRadius: isMobile ? 16 : 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 12px 28px rgba(88,204,2,0.40)",
      fontSize: isMobile ? 26 : 30,
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
      borderRadius: isMobile ? 14 : theme.radiusLg,
      padding: isMobile ? 18 : 28,
      boxShadow: theme.shadowSoft,
      minWidth: isMobile ? "90vw" : 340,
      maxWidth: isMobile ? "90vw" : 500,
      maxHeight: isMobile ? "85vh" : "none",
      overflowY: isMobile ? "auto" : "visible",
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
      border: "1px solid #EEF2F7",
    },
  };
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img 
          src={`${API_URL}/static/assets/logo.png`} 
          alt="Lemi Logo" 
          style={{ width: 40, height: 40, objectFit: 'contain' }}
        />
        <button style={styles.iconButton} onClick={() => onEditProfile && onEditProfile()}>
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

      <div style={styles.greeting}>Hi {userName} 👋</div>

      <div style={styles.progressBox}>
        <div style={{ ...styles.progressBar, width: `${(socialPoints / nextLevel) * 100}%` }} />
        <span style={styles.progressText}>Level 2 Explorer ({socialPoints}/{nextLevel})</span>
      </div>

      {/* Public Events - Open to Everyone */}
      {(() => {
        // Filter out events that user has already joined
        const availablePublicEvents = publicEvents.filter(event => 
          !joinedEvents.some(je => String(je.id) === String(event.id))
        );
        
        if (!availablePublicEvents || availablePublicEvents.length === 0) {
          return null; // Don't show section if no events available
        }
        
        return (
        <div style={styles.highlightCard}>
          <div style={styles.highlightTitle}>🌍 Public Events</div>
          <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
            Open events you can join right now!
          </div>
          {availablePublicEvents.slice(0, 3).map((event, idx) => {
            return (
            <div key={idx} style={{ 
              background: theme.bg, 
              padding: 14, 
              borderRadius: 12, 
              marginBottom: 10,
              border: `1px solid ${theme.track}`,
            }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.text, marginBottom: 6 }}>
                {event.name}
              </div>
              <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 4 }}>
                📍 {event.location} {event.place ? `· ${event.place}` : ""}
              </div>
              <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 4 }}>
                ⏰ {event.date} at {event.time}
              </div>
              {event.languages && event.languages.length > 0 && (
                <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 4 }}>
                  🗣️ {event.languages.join(" ↔ ")}
                </div>
              )}
              {event.category && (
                <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 10 }}>
                  🎯 {event.category}
                </div>
              )}
              <button
                style={{
                  ...styles.joinButton,
                  padding: "10px 16px",
                  fontSize: 14,
                  width: "100%",
                }}
                onClick={() => onJoinPublicEvent && onJoinPublicEvent(event)}
              >
                🎉 Join Event
              </button>
            </div>
            );
          })}
          {availablePublicEvents.length > 3 && (
            <div style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", marginTop: 8 }}>
              +{availablePublicEvents.length - 3} more public event{availablePublicEvents.length - 3 !== 1 ? "s" : ""} available
            </div>
          )}
        </div>
        );
      })()}

      {/* Suggested Events from Admin */}
      {suggestedEvents && suggestedEvents.length > 0 && (
        <div style={{ ...styles.highlightCard, borderLeft: `4px solid ${theme.primary}` }}>
          <div style={{ ...styles.highlightTitle, color: theme.primary }}>✨ Event Suggestions for You</div>
          <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
            The admin found {suggestedEvents.length} event{suggestedEvents.length !== 1 ? "s" : ""} matching your preferences!
          </div>
          {suggestedEvents.map((event, idx) => {
            const matchPercentage = event.matchPercentage || 100;
            const matchDetails = event.matchDetails || {};
            const isPerfectMatch = matchPercentage === 100;
            
            return (
            <div key={idx} style={{ 
              background: theme.bg, 
              padding: 14, 
              borderRadius: 12, 
              marginBottom: 10,
              border: `1px solid ${theme.track}`,
            }}>
              {/* Match Score Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>
                  {event.name}
                </div>
                <div style={{
                  background: isPerfectMatch ? 
                    `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : 
                    matchPercentage >= 75 ? theme.gold :
                    matchPercentage >= 50 ? theme.accent : theme.textMuted,
                  color: isPerfectMatch || matchPercentage >= 50 ? "white" : theme.text,
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}>
                  {isPerfectMatch ? "✨ Perfect Match" : `${matchPercentage}% Match`}
                </div>
              </div>
              
              {/* Criteria Match Indicators */}
              {!isPerfectMatch && (
                <div style={{ 
                  background: "rgba(255,222,89,0.1)", 
                  border: "1px solid rgba(255,222,89,0.3)",
                  borderRadius: 8, 
                  padding: 10, 
                  marginBottom: 10,
                  fontSize: 12.5,
                }}>
                  <div style={{ fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                    💡 Match Details:
                  </div>
                  {matchDetails.location !== null && (
                    <div style={{ color: matchDetails.location ? theme.primary : theme.textMuted, marginBottom: 3 }}>
                      {matchDetails.location ? "✅" : "⚠️"} Location: {event.location} 
                      {!matchDetails.location && event.userRequest?.location && ` (you wanted ${event.userRequest.location})`}
                    </div>
                  )}
                  {matchDetails.category !== null && (
                    <div style={{ color: matchDetails.category ? theme.primary : theme.textMuted, marginBottom: 3 }}>
                      {matchDetails.category ? "✅" : "⚠️"} Category: {event.category}
                      {!matchDetails.category && event.userRequest?.category && ` (you wanted ${event.userRequest.category})`}
                    </div>
                  )}
                  {matchDetails.language !== null && (
                    <div style={{ color: matchDetails.language ? theme.primary : theme.textMuted, marginBottom: 3 }}>
                      {matchDetails.language ? "✅" : "⚠️"} Language: {event.languages?.join(", ")}
                      {!matchDetails.language && event.userRequest?.language && ` (you wanted ${event.userRequest.language})`}
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontStyle: "italic", color: theme.textMuted }}>
                    Still a great opportunity to meet new people! 🌟
                  </div>
                </div>
              )}
              
              <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 4 }}>
                📍 {event.location} {event.place ? `· ${event.place}` : ""}
              </div>
              <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 4 }}>
                ⏰ {event.date} at {event.time}
              </div>
              {event.languages && event.languages.length > 0 && (
                <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 10 }}>
                  🗣️ {event.languages.join(" ↔ ")}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  style={{
                    ...styles.joinButton,
                    padding: "10px 16px",
                    fontSize: 14,
                    flex: 1,
                  }}
                  onClick={() => onAcceptSuggestion && onAcceptSuggestion(idx, event)}
                >
                  ✅ Accept & Join
                </button>
                <button
                  style={{
                    ...styles.cancelButton,
                    padding: "10px 16px",
                    fontSize: 14,
                    flex: 1,
                    marginTop: 0,
                  }}
                  onClick={() => onDeclineSuggestion && onDeclineSuggestion(idx, event)}
                >
                  ❌ Decline
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

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
      </div>

      {/* Friends' Joined Events (only in friends view) */}
      {viewMode === "friends" && (
        <div style={styles.section} id="friends-joined-events">
          <div style={styles.sectionTitle}>👥 Friends’ Joined Events</div>
          {Array.isArray(friendEvents) && friendEvents.length > 0 ? (
            <ul style={{ padding: 0 }}>
              {friendEvents.map((fe, i) => (
                <li key={i} style={{ listStyle: "none", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, color: theme.text, marginBottom: 8 }}>
                  {fe.friend?.emoji ? fe.friend.emoji + " " : ""}
                  {fe.friend?.name || fe.friend?.username} {fe.friend?.country || ""}
                  </div>
                  {fe.events.map((ev, j) => (
                    <div key={j} style={{ ...styles.eventCard, cursor: "default" }}>
                      <div style={styles.eventName}>{String(ev.name || ev.type || ev.category || "Event")}</div>
                      <div style={styles.details}>⏰ {String(ev.time || ev.date || "")}</div>
                      {/* Budget hidden in simplified flow */}
                      <button
                        style={{ ...styles.joinButton, padding: "10px 12px", alignSelf: "flex-start", marginTop: 10 }}
                        onClick={() => onRequestJoinEvent && onRequestJoinEvent(fe.friend, ev)}
                      >
                        Request to Join
                      </button>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.empty}>No friends’ joined events yet.</div>
          )}
        </div>
      )}

      {viewMode === "my" && (
        <>
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
                  {/* Show full event details like public events */}
                  {item.location && (
                    <div style={styles.details}>
                      📍 {item.location}{item.place ? ` · ${item.place}` : ""}
                    </div>
                  )}
                  <div style={styles.details}>
                    ⏰ {item.date ? `${item.date} at ${item.time}` : String(item.time || item.date)}
                  </div>
                  {item.languages && item.languages.length > 0 && (
                    <div style={styles.details}>
                      🗣️ {item.languages.join(" ↔ ")}
                    </div>
                  )}
                  {item.category && (
                    <div style={styles.details}>
                      🎯 {item.category}
                    </div>
                  )}
                  {item.description && (
                    <div style={{ ...styles.details, fontStyle: "italic" }}>
                      {item.description}
                    </div>
                  )}
                  {/* Budget hidden in simplified flow */}

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
        </>
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
          onClick={() => setViewMode((m) => (m === "my" ? "friends" : "my"))}
        >
          {viewMode === "my" ? "👥 Friends’ Events" : "🎟️ My Events"}
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Pending Requests</div>
        {(() => {
          const entries = Array.isArray(pendingRequests)
            ? pendingRequests.map((req, idx) => ({ req, idx }))
            : [];
          const pendingOnly = entries.filter(x => !x.req.stage || x.req.stage < 3);
          if (pendingOnly.length === 0) {
            return <div style={styles.empty}>No pending requests.</div>;
          }
          return (
            <ul style={{ padding: 0 }}>
              {pendingOnly.map(({ req, idx }) => (
                <li 
                  key={idx} 
                  style={{ ...styles.pendingCard, cursor: 'pointer' }}
                  onClick={() => {
                    if (onOpenPendingRequest) {
                      onOpenPendingRequest(idx); // pass original index
                    }
                  }}
                >
                  <span style={styles.pendingTextWrap}>
                    {(() => {
                      const ev = req.event || {};
                      const title = ev.name || ev.category || ev.place || ev.location || "Request";
                      const parts = [];
                      if (ev.place && ev.place !== title) parts.push(ev.place);
                      if (ev.location && ev.location !== title && ev.location !== ev.place) parts.push(ev.location);
                      // Preferences from SocialForm
                      if (ev.timePreference) parts.push(ev.timePreference.replace(/-/g, ' '));
                      if (ev.timeOfDay) parts.push(ev.timeOfDay);
                      if (ev.language) parts.push(`lang: ${ev.language}`);
                      // Calendar details if present
                      if (ev.date) parts.push(ev.time ? `${ev.date} at ${ev.time}` : ev.date);
                      if (ev.details) parts.push(ev.details);
                      return (
                        <>
                          <strong style={{ color: '#1F2937' }}>{title}</strong>
                          {parts.length > 0 && (
                            <span className="pending-sub" style={{ color: '#6B7280' }}>
                              {parts.join(' · ')}
                            </span>
                          )}
                          {(() => {
                            const ts = req.createdAt || (Array.isArray(req.history) && req.history.length > 0 ? req.history[0].ts : null);
                            if (!ts) return null;
                            const d = new Date(ts);
                            const when = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            return (
                              <span style={styles.meta}>Requested on {when}</span>
                            );
                          })()}
                        </>
                      );
                    })()}
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
          );
        })()}

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