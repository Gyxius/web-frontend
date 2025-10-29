import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import users from "./users";
import LocationPicker from "./LocationPicker";
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
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [createEventStep, setCreateEventStep] = useState(1);
  // View mode: 'my' shows only user's joined events, 'friends' shows only friends' joined events
  const [viewMode, setViewMode] = useState("my");

  // Create event form state
  const [newEvent, setNewEvent] = useState({
    name: "",
    location: "cite", // "cite" or "paris"
    venue: "", // Specific venue name (e.g., "Fleurus Bar")
    address: "", // Full address
    coordinates: null, // { lat, lng }
    date: "",
    time: "",
    description: "",
    category: "food",
    languages: [], // Array of languages that will be spoken
    imageUrl: "", // Background image for the event
  });
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const fadeIn = { animation: "fadeIn 0.7s cubic-bezier(0.23, 1, 0.32, 1)" };
  const pulse = { animation: "pulse 1.2s infinite" };

  const socialPoints = 120;
  const nextLevel = 200;

  // Helper functions for display
  const getCategoryEmoji = (category) => {
    const emojiMap = {
      food: "🍽️",
      drinks: "🍹",
      random: "🎲",
      walk: "🚶",
      coffee: "☕",
    };
    return emojiMap[category] || "🎯";
  };

  const getLocationDisplay = (location, venue) => {
    let displayText = "";
    if (location === "cite") displayText = "🏛️ Cité";
    else if (location === "paris") displayText = "🗼 Paris";
    else displayText = `📍 ${location}`;
    
    if (venue) displayText += ` · ${venue}`;
    return displayText;
  };

  const getLanguageFlag = (language) => {
    const flagMap = {
      "French": "🇫🇷",
      "English": "🇬🇧",
      "Spanish": "🇪🇸",
      "German": "🇩🇪",
      "Italian": "🇮🇹",
      "Portuguese": "🇵🇹",
      "Chinese": "🇨🇳",
      "Japanese": "🇯🇵",
      "Korean": "🇰🇷",
      "Arabic": "🇸🇦",
    };
    return flagMap[language] || "🗣️";
  };

  const formatLanguagesForTitle = (languages) => {
    if (!languages || languages.length === 0) return "";
    if (languages.length === 1) {
      return ` - ${getLanguageFlag(languages[0])} ${languages[0]}`;
    }
    // For multiple languages: "🇫🇷 French ↔ English 🇬🇧"
    return ` - ${languages.map((lang, idx) => {
      const flag = getLanguageFlag(lang);
      if (idx === 0) {
        return `${flag} ${lang}`;
      } else if (idx === languages.length - 1) {
        return `${lang} ${flag}`;
      } else {
        return lang;
      }
    }).join(" ↔ ")}`;
  };

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

      {/* Create Event Action Button */}
      <button
        style={{
          width: "100%",
          background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
          color: "white",
          border: "none",
          borderRadius: 14,
          padding: isMobile ? "12px 16px" : "14px 20px",
          fontWeight: 900,
          fontSize: isMobile ? 15 : 16,
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(28,176,246,0.28)",
          marginBottom: isMobile ? 16 : 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
        onClick={() => setShowCreateEventModal(true)}
      >
        ➕ Create Your Own Event
      </button>

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
                      <div style={styles.eventName}>
                        {String(ev.name || ev.type || ev.category || "Event")}
                        {formatLanguagesForTitle(ev.languages)}
                      </div>
                      {ev.imageUrl && (
                        <div style={{
                          width: "100%",
                          height: 160,
                          borderRadius: 12,
                          marginTop: 12,
                          marginBottom: 12,
                          backgroundImage: `url(${ev.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }} />
                      )}
                      {ev.location && (
                        <div style={styles.details}>{getLocationDisplay(ev.location, ev.venue)}</div>
                      )}
                      <div style={styles.details}>⏰ {ev.date ? `${ev.date} at ${ev.time}` : String(ev.time || ev.date || "")}</div>
                      {ev.category && (
                        <div style={styles.details}>
                          {getCategoryEmoji(ev.category)} {ev.category}
                        </div>
                      )}
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
                    {formatLanguagesForTitle(item.languages)}
                  </div>
                  {/* Show event image if available */}
                  {item.imageUrl && (
                    <div style={{
                      width: "100%",
                      height: 160,
                      borderRadius: 12,
                      marginTop: 12,
                      marginBottom: 12,
                      backgroundImage: `url(${item.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }} />
                  )}
                  {/* Show full event details like public events */}
                  {item.location && (
                    <div style={styles.details}>
                      {getLocationDisplay(item.location, item.venue)}{item.place && !item.venue ? ` · ${item.place}` : ""}
                    </div>
                  )}
                  <div style={styles.details}>
                    ⏰ {item.date ? `${item.date} at ${item.time}` : String(item.time || item.date)}
                  </div>
                  {item.category && (
                    <div style={styles.details}>
                      {getCategoryEmoji(item.category)} {item.category}
                    </div>
                  )}
                  {/* Description hidden on homepage - shown only in event detail page */}
                  {/* Budget hidden in simplified flow */}

                  {/* Show Host Information */}
                  {item.host && (
                    <div style={styles.details}>
                      <div style={{ fontWeight: 800, color: theme.accent, marginBottom: 4, marginTop: 8 }}>
                        👤 Host:
                      </div>
                      <div 
                        style={{ fontSize: 13, color: theme.textMuted, marginLeft: 8, cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserClick && onUserClick(item.host);
                        }}
                      >
                        {item.host.emoji ? item.host.emoji + " " : ""}
                        {item.host.name} {item.host.country ? `(${item.host.country})` : ""} 
                        {item.host.bio ? ` – "${item.host.bio}"` : ""}
                      </div>
                    </div>
                  )}

                  {Array.isArray(item.crew) && item.crew.length > 0 && (
                    <div style={styles.details}>
                      🧃 The Residents:
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {item.crew
                          .filter(member => {
                            // Filter out the host from residents list
                            const memberName = typeof member === "object" && member !== null ? member.name : member;
                            return !item.host || memberName !== item.host.name;
                          })
                          .map((member, i) => {
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

      {/* Create Event Modal - Multi-step Wizard */}
      {showCreateEventModal && (
        <div style={styles.modalOverlay} onClick={() => {
          setShowCreateEventModal(false);
          setCreateEventStep(1);
          setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", description: "", category: "food", languages: [], imageUrl: "" });
          setShowAllLanguages(false);
        }}>
          <div style={{...styles.modal, maxHeight: isMobile ? "90vh" : "85vh", overflowY: "visible", padding: isMobile ? 20 : 32}} onClick={(e) => e.stopPropagation()}>
            
            {/* Progress Indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(step => (
                <div
                  key={step}
                  style={{
                    width: createEventStep === step ? 32 : 10,
                    height: 10,
                    borderRadius: 5,
                    background: createEventStep >= step ? theme.primary : theme.track,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            {/* Step 1: Event Name */}
            {createEventStep === 1 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  What's your event called? ✨
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Give it a catchy name!
                </p>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  placeholder="e.g., Coffee & Croissants at Cité"
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? 14 : 16, 
                    borderRadius: 14, 
                    border: `2px solid ${theme.border}`, 
                    fontSize: isMobile ? 16 : 18, 
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                  autoFocus
                />
                <button
                  style={{
                    width: "100%",
                    marginTop: 24,
                    background: newEvent.name.trim() ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                    color: newEvent.name.trim() ? "white" : theme.textMuted,
                    border: "none",
                    borderRadius: 14,
                    padding: isMobile ? "14px" : "16px",
                    fontWeight: 900,
                    fontSize: isMobile ? 16 : 18,
                    cursor: newEvent.name.trim() ? "pointer" : "not-allowed",
                    boxShadow: newEvent.name.trim() ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                  }}
                  onClick={() => newEvent.name.trim() && setCreateEventStep(2)}
                  disabled={!newEvent.name.trim()}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Step 2: Location (Cité or Paris) */}
            {createEventStep === 2 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Where is it? 📍
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Choose the area, then add the exact address
                </p>
                
                {/* Area Category Selection */}
                <div style={{ marginBottom: 32 }}>
                  <p style={{ fontSize: isMobile ? 13 : 14, color: theme.textMuted, marginBottom: 12, fontWeight: 600 }}>
                    📌 Area Category
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                    <button
                      style={{
                        padding: isMobile ? 20 : 24,
                        borderRadius: 14,
                        border: `2px solid ${newEvent.location === "cite" ? theme.primary : theme.border}`,
                        background: newEvent.location === "cite" ? theme.primary : theme.card,
                        color: newEvent.location === "cite" ? "white" : theme.text,
                        fontSize: isMobile ? 16 : 18,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setNewEvent({...newEvent, location: "cite"})}
                    >
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🏛️</div>
                      Cité Universitaire
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                        Inside Cité campus
                      </div>
                    </button>
                    <button
                      style={{
                        padding: isMobile ? 20 : 24,
                        borderRadius: 14,
                        border: `2px solid ${newEvent.location === "paris" ? theme.primary : theme.border}`,
                        background: newEvent.location === "paris" ? theme.primary : theme.card,
                        color: newEvent.location === "paris" ? "white" : theme.text,
                        fontSize: isMobile ? 16 : 18,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setNewEvent({...newEvent, location: "paris"})}
                    >
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🗼</div>
                      Paris
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                        Anywhere in Paris
                      </div>
                    </button>
                  </div>
                </div>

                {/* Exact Address/Venue - Required */}
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: isMobile ? 13 : 14, color: theme.textMuted, marginBottom: 12, fontWeight: 600 }}>
                    📍 Exact Address <span style={{ color: "#FF4B4B" }}>*</span>
                  </p>
                  <LocationPicker
                    onLocationSelect={(location) => {
                      setNewEvent({
                        ...newEvent,
                        venue: location.name,
                        address: location.address,
                        coordinates: { lat: location.lat, lng: location.lng }
                      });
                    }}
                    initialAddress={newEvent.address}
                    theme={theme}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => setCreateEventStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
                    }}
                    onClick={() => setCreateEventStep(3)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Category */}
            {createEventStep === 3 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Coffee here ☕
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Pick a category
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 24 }}>
                  {[
                    { value: "food", label: "Food", emoji: "🍽️" },
                    { value: "drinks", label: "Drinks", emoji: "🍹" },
                    { value: "random", label: "Random", emoji: "🎲" },
                    { value: "walk", label: "A Walk", emoji: "🚶" },
                    { value: "coffee", label: "Coffee", emoji: "☕" },
                  ].map(cat => (
                    <button
                      key={cat.value}
                      style={{
                        padding: isMobile ? 16 : 18,
                        borderRadius: 14,
                        border: `2px solid ${newEvent.category === cat.value ? theme.primary : theme.border}`,
                        background: newEvent.category === cat.value ? theme.primary : theme.card,
                        color: newEvent.category === cat.value ? "white" : theme.text,
                        fontSize: isMobile ? 15 : 16,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                      onClick={() => setNewEvent({...newEvent, category: cat.value})}
                    >
                      <div style={{ fontSize: 28 }}>{cat.emoji}</div>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => setCreateEventStep(2)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
                    }}
                    onClick={() => setCreateEventStep(4)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Date */}
            {createEventStep === 4 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  When's the event? 📅
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Pick a date
                </p>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? 14 : 16, 
                    borderRadius: 14, 
                    border: `2px solid ${theme.border}`, 
                    fontSize: isMobile ? 16 : 18, 
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => setCreateEventStep(3)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: newEvent.date ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                      color: newEvent.date ? "white" : theme.textMuted,
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: newEvent.date ? "pointer" : "not-allowed",
                      boxShadow: newEvent.date ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                    }}
                    onClick={() => newEvent.date && setCreateEventStep(5)}
                    disabled={!newEvent.date}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Time */}
            {createEventStep === 5 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  What time? ⏰
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Pick a time
                </p>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? 14 : 16, 
                    borderRadius: 14, 
                    border: `2px solid ${theme.border}`, 
                    fontSize: isMobile ? 16 : 18, 
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => setCreateEventStep(4)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: newEvent.time ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                      color: newEvent.time ? "white" : theme.textMuted,
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: newEvent.time ? "pointer" : "not-allowed",
                      boxShadow: newEvent.time ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                    }}
                    onClick={() => newEvent.time && setCreateEventStep(6)}
                    disabled={!newEvent.time}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Languages */}
            {createEventStep === 6 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  What languages? 🗣️
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 24 }}>
                  Select all languages that will be spoken
                </p>
                
                {!showAllLanguages ? (
                  <>
                    <p style={{ fontSize: isMobile ? 13 : 14, color: theme.textMuted, marginBottom: 16, fontWeight: 600 }}>
                      Common options
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16 }}>
                      {[
                        { value: "French", emoji: "🇫🇷" },
                        { value: "English", emoji: "🇬🇧" },
                        { value: "Spanish", emoji: "🇪🇸" },
                      ].map(lang => (
                        <button
                          key={lang.value}
                          style={{
                            padding: isMobile ? 16 : 18,
                            borderRadius: 14,
                            border: `2px solid ${newEvent.languages.includes(lang.value) ? theme.primary : theme.border}`,
                            background: newEvent.languages.includes(lang.value) ? theme.primary : theme.card,
                            color: newEvent.languages.includes(lang.value) ? "white" : theme.text,
                            fontSize: isMobile ? 15 : 16,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => {
                            const langs = [...newEvent.languages];
                            const idx = langs.indexOf(lang.value);
                            if (idx > -1) {
                              langs.splice(idx, 1);
                            } else {
                              langs.push(lang.value);
                            }
                            setNewEvent({...newEvent, languages: langs});
                          }}
                        >
                          <div style={{ fontSize: 28 }}>{lang.emoji}</div>
                          <span>{lang.value}</span>
                          {newEvent.languages.includes(lang.value) && (
                            <span style={{ marginLeft: "auto", fontSize: 20 }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      style={{
                        width: "100%",
                        padding: isMobile ? "12px" : "14px",
                        borderRadius: 12,
                        border: `2px solid ${theme.border}`,
                        background: "transparent",
                        color: theme.accent,
                        fontSize: isMobile ? 14 : 15,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: 16,
                      }}
                      onClick={() => setShowAllLanguages(true)}
                    >
                      or browse all
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16, maxHeight: 240, overflowY: "auto" }}>
                      {[
                        { value: "French", emoji: "🇫🇷" },
                        { value: "English", emoji: "🇬🇧" },
                        { value: "Spanish", emoji: "🇪🇸" },
                        { value: "German", emoji: "🇩🇪" },
                        { value: "Italian", emoji: "🇮🇹" },
                        { value: "Portuguese", emoji: "🇵🇹" },
                        { value: "Chinese", emoji: "🇨🇳" },
                        { value: "Japanese", emoji: "🇯🇵" },
                        { value: "Korean", emoji: "🇰🇷" },
                        { value: "Arabic", emoji: "🇸🇦" },
                      ].map(lang => (
                        <button
                          key={lang.value}
                          style={{
                            padding: isMobile ? 14 : 16,
                            borderRadius: 12,
                            border: `2px solid ${newEvent.languages.includes(lang.value) ? theme.primary : theme.border}`,
                            background: newEvent.languages.includes(lang.value) ? theme.primary : theme.card,
                            color: newEvent.languages.includes(lang.value) ? "white" : theme.text,
                            fontSize: isMobile ? 14 : 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                          onClick={() => {
                            const langs = [...newEvent.languages];
                            const idx = langs.indexOf(lang.value);
                            if (idx > -1) {
                              langs.splice(idx, 1);
                            } else {
                              langs.push(lang.value);
                            }
                            setNewEvent({...newEvent, languages: langs});
                          }}
                        >
                          <div style={{ fontSize: 24 }}>{lang.emoji}</div>
                          <span>{lang.value}</span>
                          {newEvent.languages.includes(lang.value) && (
                            <span style={{ marginLeft: "auto", fontSize: 18 }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {newEvent.languages.length > 0 && (
                  <div style={{ 
                    marginBottom: 16, 
                    padding: 12, 
                    background: theme.card, 
                    borderRadius: 12, 
                    border: `2px solid ${theme.primary}`,
                  }}>
                    <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>
                      Selected languages:
                    </p>
                    <p style={{ fontSize: isMobile ? 15 : 16, color: theme.text, fontWeight: 700 }}>
                      {newEvent.languages.join(" ↔ ")}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setCreateEventStep(5);
                      setShowAllLanguages(false);
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: newEvent.languages.length > 0 ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                      color: newEvent.languages.length > 0 ? "white" : theme.textMuted,
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: newEvent.languages.length > 0 ? "pointer" : "not-allowed",
                      boxShadow: newEvent.languages.length > 0 ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                    }}
                    onClick={() => {
                      if (newEvent.languages.length > 0) {
                        setCreateEventStep(7);
                        setShowAllLanguages(false);
                      }
                    }}
                    disabled={newEvent.languages.length === 0}
                  >
                    {showAllLanguages ? "Confirm ✓" : "Next →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 7: Description (Optional) */}
            {createEventStep === 7 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Tell us more! 💬
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Add a description (optional)
                </p>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="What should people know about this event? (optional)"
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? 14 : 16, 
                    borderRadius: 14, 
                    border: `2px solid ${theme.border}`, 
                    fontSize: isMobile ? 15 : 16, 
                    minHeight: 120,
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => setCreateEventStep(6)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
                    }}
                    onClick={() => setCreateEventStep(8)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Image Upload (Optional) */}
            {createEventStep === 8 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Add a cover image 🖼️
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Make your event stand out! (optional)
                </p>
                
                {/* Image Preview */}
                {newEvent.imageUrl && (
                  <div style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 14,
                    marginBottom: 16,
                    backgroundImage: `url(${newEvent.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: `2px solid ${theme.border}`,
                    position: "relative",
                  }}>
                    <button
                      onClick={() => setNewEvent({...newEvent, imageUrl: ''})}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                
                {/* File Upload */}
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Image is too large! Please choose an image smaller than 2MB.");
                          return;
                        }
                        
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewEvent({...newEvent, imageUrl: reader.result});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ 
                      width: "100%", 
                      padding: isMobile ? 12 : 14, 
                      borderRadius: 14, 
                      border: `2px solid ${theme.border}`, 
                      fontSize: isMobile ? 14 : 15, 
                      boxSizing: "border-box",
                      cursor: "pointer",
                      background: theme.card,
                    }}
                  />
                  <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 8, marginBottom: 0 }}>
                    📸 Upload your own image (max 2MB)
                  </p>
                </div>

                {/* Or divider */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  marginBottom: 16,
                  color: theme.textMuted,
                  fontSize: 14,
                }}>
                  <div style={{ flex: 1, height: 1, background: theme.border }} />
                  <span>or</span>
                  <div style={{ flex: 1, height: 1, background: theme.border }} />
                </div>
                
                {/* URL Input */}
                <input
                  type="text"
                  value={newEvent.imageUrl && !newEvent.imageUrl.startsWith('data:') ? newEvent.imageUrl : ''}
                  onChange={(e) => setNewEvent({...newEvent, imageUrl: e.target.value})}
                  placeholder="Paste image URL (e.g., https://example.com/image.jpg)"
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? 14 : 16, 
                    borderRadius: 14, 
                    border: `2px solid ${theme.border}`, 
                    fontSize: isMobile ? 14 : 15, 
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    marginBottom: 8,
                  }}
                />
                
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 24, fontStyle: "italic" }}>
                  � Use an image URL from Unsplash, Pexels, or Imgur
                </p>

                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: isMobile ? "14px" : "16px",
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      background: theme.card,
                      color: theme.text,
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                    }}
                    onClick={() => setCreateEventStep(7)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: "pointer",
                      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
                    }}
                    onClick={() => {
                      // Save to adminEvents in localStorage so it appears in public events
                      try {
                        const saved = localStorage.getItem("adminEvents");
                        const events = saved ? JSON.parse(saved) : [];
                        
                        // Get current user's profile information
                        const hostInfo = users.find(
                          (u) => u.name.toLowerCase() === userName.toLowerCase()
                        );
                        
                        const newEventObj = {
                          id: Date.now(),
                          name: newEvent.name,
                          location: newEvent.location,
                          venue: newEvent.venue,
                          address: newEvent.address,
                          coordinates: newEvent.coordinates,
                          date: newEvent.date,
                          time: newEvent.time,
                          description: newEvent.description,
                          category: newEvent.category,
                          languages: newEvent.languages,
                          imageUrl: newEvent.imageUrl,
                          isPublic: true,
                          createdBy: userName,
                          host: hostInfo ? {
                            name: hostInfo.name,
                            emoji: hostInfo.emoji,
                            country: hostInfo.country,
                            bio: hostInfo.bio,
                          } : null,
                          participants: [userName],
                          crew: [userName],
                        };
                        events.push(newEventObj);
                        localStorage.setItem("adminEvents", JSON.stringify(events));
                        
                        // Also add to user's joined events
                        onJoinPublicEvent && onJoinPublicEvent(newEventObj);
                        
                        // Reset form and close
                        setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", description: "", category: "food", languages: [], imageUrl: "" });
                        setCreateEventStep(1);
                        setShowCreateEventModal(false);
                        setShowAllLanguages(false);
                        alert("🎉 Event created successfully! It will appear in public events.");
                      } catch (err) {
                        alert("Failed to create event. Please try again.");
                      }
                    }}
                  >
                    Create Event ✨
                  </button>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                fontSize: 24,
                color: theme.textMuted,
                cursor: "pointer",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                setShowCreateEventModal(false);
                setCreateEventStep(1);
                setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", description: "", category: "food", languages: [], imageUrl: "" });
                setShowAllLanguages(false);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialHome;