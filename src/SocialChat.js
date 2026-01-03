import React, { useState, useEffect, useRef } from "react";
import * as api from "./api";
import { getCountryFlag } from "./countryFlags";
import ImageCropper from "./ImageCropper";
import LocationPicker from "./LocationPicker";

// Helper to check if end time is valid (can be next day)
// Returns false only if end time is same as or before start time on same day
function isValidEndTime(startTime, endTime) {
  if (!startTime || !endTime) return true;
  
  // Convert times to minutes for comparison
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  // If end time is less than start time, assume it's next day (valid)
  // Only invalid if end time equals or is just slightly after start on same day
  if (endMinutes <= startMinutes && endMinutes > startMinutes - 60) {
    // Within 1 hour of start time or equal - likely same day, invalid
    return false;
  }
  
  return true;
}

// Convert ISO date and 24h time to human-friendly format
// Example: "2025-11-05" + "20:30" → "Wednesday, 5 November · 8:30 PM"
function formatHumanDate(isoDate, time24) {
  if (!isoDate) return "";
  
  try {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    
    // Get day of week
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[date.getDay()];
    
    // Get month name
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[date.getMonth()];
    
    // Format time if provided
    let timeStr = "";
    if (time24) {
      const [hours, minutes] = time24.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      timeStr = ` · ${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
    }
    
    return `${dayOfWeek}, ${day} ${monthName}${timeStr}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return isoDate;
  }
}

function SocialChat({
  event,
  initialMessages = [],
  currentUser,
  onSendMessage,
  onBack,
  onHome,
  onUserClick,
  onLeaveEvent,
  onEditEvent,
  onDeleteEvent,
  onCreateHangout,
  onEventClick,
  allUsers = [],
  onNotificationRead,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [showManageHostsModal, setShowManageHostsModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const chatBoxRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [templateEvent, setTemplateEvent] = useState(null);
  const [relatedHangouts, setRelatedHangouts] = useState([]);
  
  // Load user profiles from localStorage to get homeCountry
  const getLocalUserProfile = (username) => {
    if (!username) return null;
    try {
      const saved = localStorage.getItem(`userProfile_${username}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  // Server-fetched authoritative profiles (populated on mount/update)
  const [serverProfiles, setServerProfiles] = useState({});
  
  // Merge event host/attendee data with their profile (prefer server profile when available)
  const enrichUserWithProfile = (user) => {
    if (!user) return user;
    let username = null;
    if (typeof user === "string") {
      username = user;
    } else {
      username = user.name || user.username || null;
    }
    const base = typeof user === "object" && user ? user : (username ? { name: username } : {});
    if (!username) return base;
    // Prefer server profile if we fetched it, otherwise fall back to localStorage
    const profile = serverProfiles[username] || getLocalUserProfile(username);
    if (!profile) return base;
    // Ensure migration: support legacy homeCountry / countriesFrom -> homeCountries
    const migrated = { ...profile };
    if (!Array.isArray(migrated.homeCountries)) {
      if (migrated.homeCountry) migrated.homeCountries = [migrated.homeCountry];
      else if (Array.isArray(migrated.countriesFrom) && migrated.countriesFrom.length > 0) migrated.homeCountries = [...migrated.countriesFrom];
      else migrated.homeCountries = [];
    }
    return { ...base, ...migrated };
  };

  // Fetch server profiles for host + attendees when event changes and cache to localStorage
  useEffect(() => {
    let mounted = true;
    const loadProfiles = async () => {
      try {
        const names = new Set();
        if (event?.host && (event.host.name || event.host.username)) names.add(event.host.name || event.host.username);
        // crew_full is set by parent; also consider event.participants array
        const crew = event?.crew_full || event?.crew || [];
        crew.forEach(c => {
          const n = (typeof c === 'string') ? c : (c.name || c.username);
          if (n) names.add(n);
        });

        if (names.size === 0) return;
        const fetches = Array.from(names).map(async (username) => {
          try {
            const p = await api.getUserProfile(username);
            if (p) {
              // cache to localStorage for faster subsequent loads
              try { localStorage.setItem(`userProfile_${username}`, JSON.stringify(p)); } catch {}
              return [username, p];
            }
            return [username, null];
          } catch (e) {
            // ignore individual failures
            return [username, null];
          }
        });

        const results = await Promise.all(fetches);
        if (!mounted) return;
        const map = {};
        results.forEach(([username, profile]) => {
          if (profile) map[username] = profile;
        });
        // merge into state
        setServerProfiles(prev => ({ ...prev, ...map }));
      } catch (e) {
        // ignore overall failures
        console.error('Failed to fetch server profiles for event:', e);
      }
    };
    loadProfiles();
    return () => { mounted = false; };
  }, [event?.id, event?.crew, event?.crew_full, event?.host]);
  const [imageFile, setImageFile] = useState(null); // Store uploaded file for later upload
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [editedEvent, setEditedEvent] = useState({
    name: event?.name || "",
    location: event?.location || "cite",
    date: event?.date || "",
    time: event?.time || "",
    endTime: event?.endTime || "",
    description: event?.description || "",
    category: event?.category || "food",
    languages: event?.languages || [],
    imageUrl: event?.imageUrl || "",
    targetInterests: event?.targetInterests || [],
    targetCiteConnection: event?.targetCiteConnection || [],
    targetReasons: event?.targetReasons || [],
  });

  // Sync editedEvent with event prop changes
  useEffect(() => {
    setEditedEvent({
      name: event?.name || "",
      location: event?.location || "cite",
      date: event?.date || "",
      time: event?.time || "",
      endTime: event?.endTime || "",
      description: event?.description || "",
      category: event?.category || "food",
      languages: event?.languages || [],
      capacity: event?.capacity || 6,
      imageUrl: event?.imageUrl || "",
      targetInterests: event?.targetInterests || [],
      targetCiteConnection: event?.targetCiteConnection || [],
      targetReasons: event?.targetReasons || [],
    });
  }, [event]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, event]);

  // Fetch template event if this hangout is based on a featured event
  useEffect(() => {
    const fetchTemplateEvent = async () => {
      if (event?.templateEventId) {
        try {
          const template = await api.getEventById(event.templateEventId);
          setTemplateEvent(template);
        } catch (error) {
          console.error("Failed to fetch template event:", error);
        }
      } else {
        setTemplateEvent(null);
      }
    };
    fetchTemplateEvent();
  }, [event?.templateEventId]);

  // Fetch related hangouts if this is a featured event
  useEffect(() => {
    const fetchRelatedHangouts = async () => {
      if (event?.isFeatured) {
        try {
          const allEvents = await api.getAllEvents();
          const hangouts = allEvents.filter(
            (e) => e.templateEventId === event.id
          );
          setRelatedHangouts(hangouts);
        } catch (error) {
          console.error("Failed to fetch related hangouts:", error);
          setRelatedHangouts([]);
        }
      } else {
        setRelatedHangouts([]);
      }
    };
    fetchRelatedHangouts();
  }, [event?.id, event?.isFeatured]);

  const sendMsg = async () => {
    if (!input.trim()) return;
    const username = currentUser;
    const messageText = input.trim();
    const msg = { from: username, text: messageText };

    // Optimistic UI update
    setMessages((m) => [...m, msg]);
    setInput("");

    try {
      // Send to backend from here to ensure correct payload shape
      if (event?.id) {
        await api.sendChatMessage(event.id, username, messageText);
      }

      // Notify parent to update its chatHistory (parent should not re-send to API)
      onSendMessage && onSendMessage(msg);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
      // Optionally: remove optimistic message or mark as failed. Keep optimistic for now.
    }
  };

  const deleteMsg = async (messageId) => {
    if (!messageId) return;
    if (!window.confirm("Delete this message?")) return;
    
    const username = currentUser;
    
    // Optimistically remove from UI
    setMessages((m) => m.filter(msg => msg.id !== messageId));

    try {
      if (event?.id) {
        await api.deleteChatMessage(event.id, messageId, username);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert(error.message || "Failed to delete message. You may not have permission.");
      // Reload messages to restore state
      if (event?.id) {
        try {
          const messages = await api.getChatMessages(event.id);
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            from: msg.username,
            text: msg.message,
            ts: new Date(msg.timestamp).getTime()
          }));
          setMessages(formattedMessages);
        } catch (reloadError) {
          console.error("Failed to reload messages:", reloadError);
        }
      }
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages update
    const box = chatBoxRef.current;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages]);

  // Mark notifications as read when opening this chat
  useEffect(() => {
    const markAsRead = async () => {
      if (event?.id && currentUser) {
        const username = currentUser?.username || currentUser?.name || currentUser;
        try {
          await api.markNotificationsRead(username, event.id);
          // Trigger notification count refresh in parent
          if (onNotificationRead) {
            onNotificationRead();
          }
        } catch (error) {
          console.error("Failed to mark notifications as read:", error);
        }
      }
    };
    markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, currentUser]); // Removed onNotificationRead to prevent infinite loop

  // 🟢 Duolingo-inspired theme (same palette direction as SocialHome)
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
    border: "#EEF2F7",
    track: "#E5E7EB",
    shadow: "0 4px 14px rgba(0,0,0,0.06)",
    shadowSoft: "0 10px 30px rgba(0,0,0,0.08)",
    radius: 16,
    radiusLg: 20,
  };

  const styles = {
    container: {
      maxWidth: 680,
      margin: "0 auto",
      background: theme.bg,
      minHeight: "100vh",
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },

    // Event header with image placeholder
    eventHeader: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      height: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 48,
      color: "white",
      marginBottom: 24,
    },

    // Main content area
    contentWrapper: {
      padding: "0 24px 24px 24px",
    },

    // Event title and meta
    eventTitle: {
      fontSize: 32,
      fontWeight: 900,
      color: theme.text,
      marginBottom: 0,
      lineHeight: 1.2,
      flex: 1,
    },

    metaRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      fontSize: 16,
      color: theme.textMuted,
    },

    metaIcon: {
      fontSize: 20,
      width: 24,
      textAlign: "center",
    },

    languageBadge: {
      display: "inline-block",
      background: theme.track,
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 14,
      fontWeight: 600,
      color: theme.text,
      marginRight: 8,
      marginTop: 8,
    },

    // Sections
    section: {
      background: theme.card,
      padding: 24,
      borderRadius: theme.radius,
      marginBottom: 32,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 800,
      color: theme.text,
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },

    // Host section
    hostCard: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: 16,
      background: theme.bg,
      borderRadius: 12,
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
    },

    hostAvatar: {
      fontSize: 48,
      width: 64,
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: theme.card,
      borderRadius: "50%",
      border: `2px solid ${theme.border}`,
    },

    hostInfo: {
      flex: 1,
    },

    hostName: {
      fontSize: 18,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 4,
    },

    hostBio: {
      fontSize: 14,
      color: theme.textMuted,
      lineHeight: 1.4,
    },

    // Attendees
    attendeesList: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
    },

    attendeeCard: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: theme.bg,
      borderRadius: 8,
      cursor: "pointer",
      transition: "transform 0.2s",
      fontSize: 14,
      fontWeight: 600,
    },

    attendeeAvatar: {
      fontSize: 24,
    },

    crewItem: { marginBottom: 6, color: theme.textMuted },
    bold: { fontWeight: 800, color: theme.text },

    // Chat area
    chat: {
      background: theme.card,
      padding: 16,
      borderRadius: theme.radius,
      marginBottom: 12,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    chatHeader: {
      fontWeight: 900,
      marginBottom: 10,
      color: theme.accent,
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
    },
    chatBox: {
      height: 260,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius,
      padding: 10,
      marginBottom: 10,
      background: "#FBFDFC",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    // message row wrapper
    row: {
      display: "flex",
      width: "100%",
    },
    // avatar shown next to each message
    avatarWrapper: {
      width: 36,
      height: 36,
      borderRadius: 999,
      overflow: 'hidden',
      marginRight: 8,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      border: `1px solid ${theme.border}`,
    },
    avatarImg: {
      width: 36,
      height: 36,
      display: 'block',
    },
    rowRight: { justifyContent: "flex-end" },
    bubble: {
      maxWidth: "78%",
      padding: "10px 12px",
      borderRadius: 16,
      lineHeight: 1.35,
      fontSize: 14.5,
      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      border: `1px solid ${theme.border}`,
      background: "#FFFFFF",
      color: theme.text,
    },
    bubbleMe: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(88,204,2,0.25)",
    },
    bubbleName: {
      display: "block",
      fontWeight: 800,
      marginBottom: 4,
      fontSize: 12,
      color: theme.textMuted,
    },
    bubbleNameMe: {
      color: "rgba(255,255,255,0.9)",
    },

    // Input row
    chatInput: {
      display: "flex",
      flexDirection: window.innerWidth <= 640 ? "column" : "row",
      alignItems: window.innerWidth <= 640 ? "stretch" : "center",
      gap: 8,
      marginTop: 6,
    },
    input: {
      border: `1px solid ${theme.border}`,
      borderRadius: 999,
      padding: "10px 14px",
      margin: "4px 0",
      flex: 1,
      outline: "none",
      background: "#FFFFFF",
      fontSize: 14.5,
      width: window.innerWidth <= 640 ? "100%" : "auto",
    },
    sendBtn: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      border: "none",
      borderRadius: 999,
      padding: "10px 16px",
      fontWeight: 900,
      fontSize: 14,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
      transition: "transform 0.12s ease, box-shadow 0.2s",
      width: window.innerWidth <= 640 ? "100%" : "auto",
    },

    // Footer CTA buttons
    backBtn: {
      marginTop: 10,
      background: `linear-gradient(135deg, ${theme.accent}, #0AA6EB)`,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(28,176,246,0.20)",
      width: "100%",
    },
    homeBtn: {
      marginTop: 10,
      background: "#FFFFFF",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      width: "100%",
    },
    leaveBtn: {
      marginTop: 10,
      background: theme.danger,
      color: "white",
      border: "none",
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(234,43,43,0.20)",
      width: "100%",
    },
    editBtn: {
      marginTop: 10,
      background: `linear-gradient(135deg, ${theme.gold}, #F5C842)`,
      color: theme.text,
      border: "none",
      borderRadius: 12,
      padding: "10px 16px",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 6px 16px rgba(255,222,89,0.28)",
      width: "100%",
    },
    // Full screen edit page
    editScreen: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.bg,
      zIndex: 1000,
      overflowY: "auto",
    },
    editContainer: {
      maxWidth: 680,
      margin: "0 auto",
      padding: "24px",
      minHeight: "100vh",
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .hangout-card:hover .join-button-hover {
          opacity: 1 !important;
        }
      `}</style>
      {/* Lemi Header - Fixed at top */}
      <div style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 101,
        background: "white",
        padding: "12px 20px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <img 
          src={`https://fast-api-backend-qlyb.onrender.com/static/assets/logo.png`}
          alt="Lemi Logo" 
          style={{ 
            width: 36, 
            height: 36, 
            objectFit: 'contain', 
            borderRadius: "50%",
            position: "absolute",
            left: 20,
          }}
        />
        <span style={{ fontSize: 24, fontWeight: 800, color: theme.text }}>Lemi</span>
        <button
          onClick={onHome}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            position: "absolute",
            right: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          {(() => {
            const username = typeof currentUser === 'string' ? currentUser : (currentUser?.username || currentUser?.name);
            const userProfile = serverProfiles[username] || getLocalUserProfile(username);
            if (userProfile?.avatar?.provider === 'dicebear') {
              return (
                <img 
                  src={`https://api.dicebear.com/6.x/${userProfile.avatar.style}/svg?seed=${encodeURIComponent(userProfile.avatar.seed || username)}`}
                  alt="avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              );
            } else if (userProfile?.avatar?.provider === 'custom') {
              return (
                <img 
                  src={userProfile.avatar.url}
                  alt="custom avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              );
            } else {
              return <span style={{ fontSize: 20 }}>👤</span>;
            }
          })()}
        </button>
      </div>
      
      {/* Back Button */}
      <div style={{
        position: "sticky",
        top: 65,
        left: 0,
        right: 0,
        zIndex: 100,
        background: theme.bg,
        padding: "12px 16px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
            fontSize: 24,
            color: theme.text,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          ←
        </button>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: theme.text,
        }}>
          Back
        </div>
      </div>

      {/* Event Header Banner */}
      <div style={{
        ...styles.eventHeader,
        ...(event?.imageUrl && {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${event.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        })
      }}>
        {event?.category && !event?.imageUrl && (
          <>
            {event.category === "food" && "🍽️"}
            {event.category === "drinks" && "🍹"}
            {event.category === "random" && "🎲"}
            {event.category === "walk" && "🚶"}
            {event.category === "coffee" && "☕"}
          </>
        )}
      </div>

      <div style={styles.contentWrapper}>
        {/* Event Header - Match public event page structure */}
        <div style={{ marginBottom: 24 }}>
          {/* Title Row with Action Buttons */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <h1 style={styles.eventTitle}>{event?.name || "Event"}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0, marginLeft: 12 }}>
              <button
                onClick={async () => {
                  try {
                    const shareUrl = `${window.location.origin}/public-event.html?event=${encodeURIComponent(event?.id)}`;
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Share link copied to clipboard!');
                  } catch (e) {
                    alert('Could not copy share link.');
                  }
                }}
                style={{ padding: '8px 12px', borderRadius: 10, background: '#58CC02', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}
              >
                Share
              </button>
            
              {/* Settings Button - For admins and hosts only */}
              {((event?.host && event.host.name === currentUser) || (typeof currentUser === 'string' && currentUser.toLowerCase() === 'admin') || (typeof currentUser === 'object' && (currentUser?.username?.toLowerCase?.() === 'admin' || currentUser?.name === 'Admin')) || (event?.createdBy && String(event.createdBy).toLowerCase() === 'admin') || (event?.created_by && String(event.created_by).toLowerCase() === 'admin')) && (
                <div style={{ position: "relative" }}>
                  <button
                    style={{
                      background: "white",
                      border: `2px solid ${theme.border}`,
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 18,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                    }}
                  >
                    ⚙️
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showOptionsMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 999,
                        }}
                        onClick={() => setShowOptionsMenu(false)}
                      />
                      
                      {/* Menu */}
                      <div style={{
                        position: "absolute",
                        top: 52,
                        right: 0,
                        background: "white",
                        borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        minWidth: 200,
                        overflow: "hidden",
                        border: `1px solid ${theme.border}`,
                      }}>
                        {/* Check if user is host or admin */}
                        {(() => {
                          const isAdmin = (typeof currentUser === 'string' && currentUser.toLowerCase() === 'admin') || (typeof currentUser === 'object' && (currentUser?.username?.toLowerCase?.() === 'admin' || currentUser?.name === 'Admin'));
                          const isHost = (event?.host && event.host.name === currentUser) || (event?.createdBy && String(event.createdBy).toLowerCase() === 'admin') || (event?.created_by && String(event.created_by).toLowerCase() === 'admin');
                          const canEdit = isAdmin || isHost;
                          
                          return (
                            <>
                              {canEdit && (
                                <>
                                  <button
                                    style={{
                                      width: "100%",
                                      padding: "14px 20px",
                                      border: "none",
                                      background: "white",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: 15,
                                      fontWeight: 600,
                                      color: theme.text,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      borderBottom: `1px solid ${theme.border}`,
                                    }}
                                    onClick={() => {
                                      setEditedEvent({
                                        name: event?.name || "",
                                        location: event?.location || "cite",
                                        date: event?.date || "",
                                        time: event?.time || "",
                                        description: event?.description || "",
                                        category: event?.category || "food",
                                        languages: event?.languages || [],
                                        capacity: event?.capacity || 6,
                                        imageUrl: event?.imageUrl || "",
                                      });
                                      setImageFile(null);
                                      setShowEditModal(true);
                                      setShowOptionsMenu(false);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = theme.bg}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                  >
                                    <span>✏️</span> Edit Event
                                  </button>
                                  
                                  <button
                                    style={{
                                      width: "100%",
                                      padding: "14px 20px",
                                      border: "none",
                                      background: "white",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: 15,
                                      fontWeight: 600,
                                      color: theme.text,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      borderBottom: `1px solid ${theme.border}`,
                                    }}
                                    onClick={() => {
                                      setShowManageHostsModal(true);
                                      setShowOptionsMenu(false);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = theme.bg}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                  >
                                    <span>👥</span> Manage Co-Hosts
                                  </button>
                                  
                                  <button
                                    style={{
                                      width: "100%",
                                      padding: "14px 20px",
                                      border: "none",
                                      background: "white",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      fontSize: 15,
                                      fontWeight: 600,
                                      color: theme.text,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      borderBottom: `1px solid ${theme.border}`,
                                    }}
                                    onClick={async () => {
                                      setShowOptionsMenu(false);
                                      if (window.confirm("Archive this hangout? It will be moved to the Archive tab and hidden from the main feed.")) {
                                        try {
                                          const username = currentUser?.name || currentUser?.username || 
                                                         (typeof currentUser === 'string' ? currentUser : null);
                                          if (!username) {
                                            alert("Could not determine current user. Please try logging in again.");
                                            return;
                                          }
                                          await api.archiveEvent(event.id, username);
                                          alert("Hangout archived successfully!");
                                          if (onBack) onBack();
                                          else window.location.reload();
                                        } catch (error) {
                                          console.error("Failed to archive:", error);
                                          alert("Failed to archive hangout: " + error.message);
                                        }
                                      }
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = theme.bg}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                  >
                                    <span>📦</span> Archive Event
                                  </button>
                                </>
                              )}
                              
                              {/* Duplicate button - available to admins and hosts only */}
                              {canEdit && (
                                <button
                                  style={{
                                    width: "100%",
                                    padding: "14px 20px",
                                    border: "none",
                                    background: "white",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: theme.text,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    borderBottom: `1px solid ${theme.border}`,
                                  }}
                                  onClick={() => {
                                    setShowOptionsMenu(false);
                                    if (onCreateHangout) {
                                      // Pre-fill the create hangout form with this event's data (for duplication)
                                      onCreateHangout({
                                        name: event?.name || "",
                                        location: event?.location || "cite",
                                        venue: event?.venue || "",
                                        address: event?.address || "",
                                        coordinates: event?.coordinates || null,
                                        date: "", // Leave date empty for user to set
                                        time: event?.time || "",
                                        endTime: event?.endTime || "",
                                        description: event?.description || "",
                                        category: event?.category || "language",
                                        subcategory: event?.subcategory || "",
                                        languages: event?.languages || [],
                                        capacity: event?.capacity || 6,
                                        imageUrl: event?.imageUrl || "",
                                        targetInterests: event?.targetInterests || [],
                                        targetCiteConnection: event?.targetCiteConnection || [],
                                        targetReasons: event?.targetReasons || [],
                                        isDuplicate: true, // Flag to indicate this is a full duplicate
                                      });
                                    }
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = theme.bg}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                >
                                  <span>📋</span> Duplicate Event
                                </button>
                              )}
                              
                              {canEdit && (
                                <button
                                  style={{
                                    width: "100%",
                                    padding: "14px 20px",
                                    border: "none",
                                    background: "white",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#FF4B4B",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                  onClick={async () => {
                                    console.log("Delete button clicked");
                                    const confirmed = window.confirm("Are you sure you want to delete this event? This action cannot be undone.");
                                    console.log("User confirmed:", confirmed);
                                    if (confirmed) {
                                      setShowOptionsMenu(false);
                                      console.log("Calling onDeleteEvent with:", event);
                                      console.log("onDeleteEvent exists:", !!onDeleteEvent);
                                      if (onDeleteEvent) {
                                        try {
                                          await onDeleteEvent(event);
                                          console.log("onDeleteEvent completed");
                                        } catch (error) {
                                          console.error("Error in onDeleteEvent:", error);
                                        }
                                      } else {
                                        console.error("onDeleteEvent is not defined!");
                                      }
                                    }
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = "#FFF5F5"}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                >
                                  <span>🗑️</span> Delete Event
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Event Metadata - Date and Location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 16, color: '#6B7280' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🗓</span>
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {formatHumanDate(event?.date, event?.time)}
                {event?.endTime && ` – ${event.endTime}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#374151' }}>
                  {event?.location === "cite" ? "Cité Internationale" : event?.location === "paris" ? "Paris" : event?.location || "Location TBD"}
                  {event?.venue && ` · ${event.venue}`}
                </div>
                {event?.address && (
                  <div style={{ fontSize: 14, color: '#8B8B8B', marginTop: 4 }}>
                    {event.address}
                  </div>
                )}
              </div>
            </div>
            
            {/* Small Map Preview - Outside flex container for proper alignment */}
            {event?.coordinates && event.coordinates.lat && event.coordinates.lng && (
              <div 
                ref={(el) => {
                  if (el && !el.dataset.mapInitialized && window.L) {
                    el.dataset.mapInitialized = 'true';
                    const map = window.L.map(el, {
                      center: [event.coordinates.lat, event.coordinates.lng],
                      zoom: 15,
                      zoomControl: true,
                      scrollWheelZoom: false,
                      dragging: true,
                    });
                    
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                      attribution: '© OpenStreetMap',
                      maxZoom: 19
                    }).addTo(map);
                    
                    window.L.marker([event.coordinates.lat, event.coordinates.lng])
                      .addTo(map)
                      .bindPopup(event.venue || event.address || 'Event Location');
                  }
                }}
                style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '12px',
                  marginTop: '12px',
                  border: '2px solid #E5E5E5',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            )}
          </div>
          
          {/* Category & Subcategory */}
          {event?.category && (() => {
            // Get category badge details - matching SocialHome.js
            const categoryMap = {
              'language': { emoji: '💬', label: 'Language & Exchange', color: '#FF6B6B' },
              'cultural': { emoji: '🎭', label: 'Cultural Exploration', color: '#F7B731' },
              'social': { emoji: '🎉', label: 'Social & Nightlife', color: '#A463F2' },
              'food': { emoji: '🍽️', label: 'Food & Gastronomy', color: '#4ECDC4' },
              'sports': { emoji: '⚽', label: 'Sports & Outdoors', color: '#45B7D1' },
              'professional': { emoji: '💼', label: 'Workshops & Professional', color: '#5F27CD' },
              'other': { emoji: '✨', label: 'Other', color: '#74B9FF' },
            };
            
            const categoryInfo = categoryMap[event.category?.toLowerCase()] || categoryMap['other'];
            const badgeColor = categoryInfo.color;
            const emoji = categoryInfo.emoji;
            const label = categoryInfo.label;
            
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: badgeColor,
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </span>
                  {event.subcategory && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 14px',
                      borderRadius: 999,
                      background: `${badgeColor}30`,
                      color: badgeColor,
                      fontSize: 14,
                      fontWeight: 600,
                      border: `1.5px solid ${badgeColor}`,
                    }}>
                      {event.subcategory.charAt(0).toUpperCase() + event.subcategory.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Languages Section - Prominent Display */}
        {event?.languages && event.languages.length > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
            padding: "20px 24px",
            borderRadius: theme.radius,
            marginBottom: 32,
            boxShadow: "0 4px 16px rgba(88,204,2,0.25)",
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: "white",
              marginBottom: 12,
            }}>
              🗣️ Languages
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {event.languages.map((lang, i) => {
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
                const flag = flagMap[lang] || "🗣️";
                return (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      padding: "10px 16px",
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 700,
                      color: theme.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{flag}</span>
                    <span>{lang}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Template Event - Show original event this hangout is based on */}
        {templateEvent && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>✨ Based on Main Event</div>
            <div style={{
              ...styles.card,
              padding: 16,
              borderLeft: `4px solid ${theme.accent}`,
              backgroundColor: theme.accentLight,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onClick={() => {
              if (onEventClick) {
                onEventClick(templateEvent);
              }
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 12 }}>
                {templateEvent.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: theme.textMuted }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📍</span>
                  <span>{templateEvent.location || 'Cité'} · {templateEvent.venue || 'Venue TBD'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⏰</span>
                  <span>
                    {formatHumanDate(templateEvent.date, templateEvent.time)}
                    {templateEvent.endTime && ` – ${templateEvent.endTime}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🎯</span>
                  <span>{templateEvent.category || 'social'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👥</span>
                  <span>{Math.max(templateEvent.eventParticipants?.length || 0, 1)} attendees</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hangout Description */}
        {event?.description && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              {templateEvent ? "📝 About this hangout" : "📝 About this event"}
            </div>
            <div style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {event.description}
            </div>
          </div>
        )}

        {/* Related Hangouts (shown on featured events) */}
        {event?.isFeatured && (
          <div style={styles.section}>
            <div style={{
              fontSize: 18,
              fontWeight: 900,
              color: theme.text,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              👋 Meet Others Going
            </div>
            <div style={{
              fontSize: 14,
              color: theme.textMuted,
              marginBottom: 16,
              lineHeight: 1.5,
            }}>
              {relatedHangouts.length > 0
                ? "Organize a language exchange or hangout related to this event! Create a pre-drinks, coffee meetup, or post-event gathering with your preferred time and languages."
                : "No hangouts yet — be the first to start one for this event 🎉"
              }
            </div>

            {relatedHangouts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {relatedHangouts.map((hangout) => {
                  const isJoined = hangout.eventParticipants?.some(p => 
                    (typeof p === 'string' ? p : p.name) === currentUser?.name || 
                    (typeof p === 'string' ? p : p.username) === currentUser?.username
                  );
                  const attendees = hangout.eventParticipants || [];
                  const attendeeCount = Math.max(attendees.length, hangout.host ? 1 : 0);
                  const capacity = hangout.capacity;
                  
                  // Get hangout category details - matching SocialHome.js
                  const categoryMap = {
                    'language': { emoji: '💬', label: 'Language & Exchange', color: '#FF6B6B' },
                    'cultural': { emoji: '🎭', label: 'Cultural Exploration', color: '#F7B731' },
                    'social': { emoji: '🎉', label: 'Social & Nightlife', color: '#A463F2' },
                    'food': { emoji: '🍽️', label: 'Food & Gastronomy', color: '#4ECDC4' },
                    'sports': { emoji: '⚽', label: 'Sports & Outdoors', color: '#45B7D1' },
                    'professional': { emoji: '💼', label: 'Workshops & Professional', color: '#5F27CD' },
                    'other': { emoji: '✨', label: 'Other', color: '#74B9FF' },
                  };
                  
                  const categoryInfo = categoryMap[hangout.category?.toLowerCase()] || categoryMap['other'];
                  const hangoutEmoji = categoryInfo.emoji;
                  const badgeColor = categoryInfo.color;
                  const categoryLabel = categoryInfo.label;

                  return (
                    <div
                      key={hangout.id}
                      style={{
                        background: isJoined 
                          ? 'linear-gradient(135deg, rgba(88,204,2,0.08) 0%, rgba(55,179,0,0.08) 100%)'
                          : theme.card,
                        border: isJoined 
                          ? `2px solid ${theme.primary}`
                          : `1px solid ${theme.border}`,
                        borderRadius: 16,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        position: 'relative',
                      }}
                      onClick={() => {
                        if (onEventClick) onEventClick(hangout);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = isJoined 
                          ? "0 6px 20px rgba(88,204,2,0.25)"
                          : "0 6px 20px rgba(0,0,0,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                      }}
                    >
                      {/* Joined Badge */}
                      {isJoined && (
                        <div style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: theme.primary,
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          ✓ Joined
                        </div>
                      )}

                      {/* Hangout Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                        {/* Icon */}
                        <div style={{
                          fontSize: 32,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}>
                          {hangoutEmoji}
                        </div>

                        {/* Title & Badge */}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 700,
                            fontSize: 17,
                            color: theme.text,
                            marginBottom: 6,
                            lineHeight: 1.3,
                            paddingRight: isJoined ? 70 : 0,
                          }}>
                            {hangout.name}
                          </div>
                          
                          {/* Category Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 12,
                              background: badgeColor,
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              {categoryLabel}
                            </div>
                            {hangout.subcategory && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: 12,
                                background: `${badgeColor}30`,
                                color: badgeColor,
                                border: `1.5px solid ${badgeColor}`,
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                {hangout.subcategory.charAt(0).toUpperCase() + hangout.subcategory.slice(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: 8,
                        marginBottom: 14,
                        fontSize: 14,
                        color: theme.textMuted,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>📍</span>
                          <span style={{ fontWeight: 500 }}>{hangout.venue || hangout.location || 'Location TBD'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>🕗</span>
                          <span style={{ fontWeight: 500 }}>
                            {formatHumanDate(hangout.date, hangout.time)}
                            {hangout.endTime && ` – ${hangout.endTime}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>👥</span>
                          <span style={{ fontWeight: 600 }}>
                            {capacity 
                              ? `${attendeeCount}/${capacity} attending`
                              : `${attendeeCount} ${attendeeCount === 1 ? 'person' : 'people'} going`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Attendees Avatars */}
                      {attendees.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          paddingTop: 12,
                          borderTop: `1px solid ${theme.border}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginLeft: -4 }}>
                            {attendees.slice(0, 4).map((attendee, idx) => {
                              const user = typeof attendee === 'string' 
                                ? { name: attendee, emoji: '�' }
                                : attendee;
                              const enrichedUser = enrichUserWithProfile(user);
                              const flag = (enrichedUser.homeCountries || [enrichedUser.homeCountry || enrichedUser.country])
                                .filter(Boolean)[0];

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    background: theme.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16,
                                    marginLeft: idx > 0 ? -8 : 0,
                                    position: 'relative',
                                    zIndex: attendees.length - idx,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {enrichedUser.avatar && enrichedUser.avatar.provider === 'dicebear' ? (
                                    <img 
                                      src={`https://api.dicebear.com/6.x/${enrichedUser.avatar.style}/svg?seed=${encodeURIComponent(enrichedUser.avatar.seed || enrichedUser.name)}`}
                                      alt={enrichedUser.name}
                                      style={{ width: '100%', height: '100%' }}
                                    />
                                  ) : enrichedUser.avatar && enrichedUser.avatar.provider === 'custom' ? (
                                    <img 
                                      src={enrichedUser.avatar.url}
                                      alt={enrichedUser.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <span>{enrichedUser.emoji || '👤'}</span>
                                  )}
                                  {flag && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: -2,
                                      right: -2,
                                      fontSize: 10,
                                      background: 'white',
                                      borderRadius: '50%',
                                      width: 14,
                                      height: 14,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                      {getCountryFlag(flag)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {attendees.length > 4 && (
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                border: '2px solid white',
                                background: theme.textMuted,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                marginLeft: -8,
                              }}>
                                +{attendees.length - 4}
                              </div>
                            )}
                          </div>
                          {attendees.length <= 3 && (
                            <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 500 }}>
                              {attendees.slice(0, 3).map((a, i) => {
                                const user = typeof a === 'string' ? { name: a } : a;
                                const enrichedUser = enrichUserWithProfile(user);
                                const flag = (enrichedUser.homeCountries || [enrichedUser.homeCountry || enrichedUser.country])
                                  .filter(Boolean)[0];
                                return (
                                  <span key={i}>
                                    {i > 0 && ', '}
                                    {enrichedUser.firstName || enrichedUser.name}
                                    {flag && ` ${getCountryFlag(flag)}`}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Join Button Overlay (appears on hover) */}
                      <div style={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      className="join-button-hover">
                        <button
                          style={{
                            background: isJoined ? theme.textMuted : theme.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            padding: '8px 16px',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            pointerEvents: 'all',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEventClick) onEventClick(hangout);
                          }}
                        >
                          {isJoined ? '👁️ View' : '🎉 Join'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => {
                if (onCreateHangout) {
                  onCreateHangout(event);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: theme.primary,
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.background = theme.primary}
            >
              ✨ Create Hangout
            </button>
          </div>
        )}

        {/* Host Section */}
        {event?.host && (() => {
          const enrichedHost = enrichUserWithProfile(event.host);
          return (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👤 Hosted by</div>
            <div 
              style={styles.hostCard}
              onClick={() => {
                console.log("🖱️ Host clicked:", event.host);
                console.log("📞 onUserClick exists:", !!onUserClick);
                console.log("📊 Full event object:", event);
                if (onUserClick) {
                  onUserClick(event.host);
                } else {
                  console.error("❌ onUserClick is not defined!");
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={styles.hostAvatar}>
                {enrichedHost.avatar && enrichedHost.avatar.provider === 'dicebear' ? (
                  <img src={`https://api.dicebear.com/6.x/${enrichedHost.avatar.style}/svg?seed=${encodeURIComponent(enrichedHost.avatar.seed || enrichedHost.name || enrichedHost.username)}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                ) : enrichedHost.avatar && enrichedHost.avatar.provider === 'custom' ? (
                  <img src={enrichedHost.avatar.url} alt="custom avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  enrichedHost.emoji
                )}
              </div>
              <div style={styles.hostInfo}>
                <div style={styles.hostName}>
                  {((enrichedHost.username || enrichedHost.name || '').toLowerCase() === 'admin') ? 'Admin' : enrichedHost.name} {(enrichedHost.homeCountries || [enrichedHost.homeCountry || (enrichedHost.countriesFrom && enrichedHost.countriesFrom[0]) || enrichedHost.country]).filter(Boolean).map(c => getCountryFlag(c)).join(' ')}
                </div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                  {(enrichedHost.university || enrichedHost.building || enrichedHost.house || enrichedHost.residence) && (
                    <div>{enrichedHost.university || enrichedHost.building || enrichedHost.house || enrichedHost.residence}</div>
                  )}
                  {enrichedHost.languageLevels && (
                    <div style={{ marginTop: 2 }}>
                      {Object.entries(enrichedHost.languageLevels).map(([lang, level], idx) => {
                        const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
                        const levelName = level.charAt(0).toUpperCase() + level.slice(1);
                        return (
                          <span key={lang}>
                            {idx > 0 && ", "}
                            {levelName} {langName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Co-Hosts Section */}
        {event?.coHosts && event.coHosts.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👥 Co-Hosts ({event.coHosts.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {event.coHosts.map((coHost, i) => {
                const enrichedCoHost = enrichUserWithProfile(coHost);
                return (
                <div
                  key={i}
                  style={styles.hostCard}
                  onClick={() => onUserClick && onUserClick(coHost)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={styles.hostAvatar}>
                    {enrichedCoHost.avatar && enrichedCoHost.avatar.provider === 'dicebear' ? (
                      <img src={`https://api.dicebear.com/6.x/${enrichedCoHost.avatar.style}/svg?seed=${encodeURIComponent(enrichedCoHost.avatar.seed || enrichedCoHost.name || enrichedCoHost.username)}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                    ) : enrichedCoHost.avatar && enrichedCoHost.avatar.provider === 'custom' ? (
                      <img src={enrichedCoHost.avatar.url} alt="custom avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      enrichedCoHost.emoji
                    )}
                  </div>
                  <div style={styles.hostInfo}>
                    <div style={styles.hostName}>
                      {((enrichedCoHost.username || enrichedCoHost.name || '').toLowerCase() === 'admin') ? 'Admin' : enrichedCoHost.name} {(enrichedCoHost.homeCountries || [enrichedCoHost.homeCountry || (enrichedCoHost.countriesFrom && enrichedCoHost.countriesFrom[0]) || enrichedCoHost.country]).filter(Boolean).map(c => getCountryFlag(c)).join(' ')}
                    </div>
                    <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                      {(enrichedCoHost.university || enrichedCoHost.building || enrichedCoHost.house || enrichedCoHost.residence) && (
                        <div>{enrichedCoHost.university || enrichedCoHost.building || enrichedCoHost.house || enrichedCoHost.residence}</div>
                      )}
                      {enrichedCoHost.languageLevels && (
                        <div style={{ marginTop: 2 }}>
                          {Object.entries(enrichedCoHost.languageLevels).map(([lang, level], idx) => {
                            const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
                            const levelName = level.charAt(0).toUpperCase() + level.slice(1);
                            return (
                              <span key={lang}>
                                {idx > 0 && ", "}
                                {levelName} {langName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Attendees Section */}
        {(event?.crew_full || event?.crew || []).filter(item => !event?.host || item.name !== event.host.name).length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              🧃 Attendees ({(event?.crew_full || event?.crew || []).filter(item => !event?.host || item.name !== event.host.name).length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(event?.crew_full || event?.crew || [])
                .filter(item => !event?.host || item.name !== event.host.name)
                .map((item, i) => {
                  const enrichedItem = enrichUserWithProfile(item);
                  return (
                  <div
                    key={i}
                    style={styles.hostCard}
                    onClick={() => onUserClick && onUserClick(enrichedItem)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={styles.hostAvatar}>
                      {enrichedItem.avatar && enrichedItem.avatar.provider === 'dicebear' ? (
                        <img src={`https://api.dicebear.com/6.x/${enrichedItem.avatar.style}/svg?seed=${encodeURIComponent(enrichedItem.avatar.seed || enrichedItem.name || enrichedItem.username)}`} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                      ) : enrichedItem.avatar && enrichedItem.avatar.provider === 'custom' ? (
                        <img src={enrichedItem.avatar.url} alt="custom avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        enrichedItem.emoji || "🙂"
                      )}
                    </div>
                    <div style={styles.hostInfo}>
                      <div style={styles.hostName}>
                        {((enrichedItem.username || enrichedItem.name || '').toLowerCase() === 'admin') ? 'Admin' : enrichedItem.name} {(enrichedItem.homeCountries || [enrichedItem.homeCountry || (enrichedItem.countriesFrom && enrichedItem.countriesFrom[0]) || enrichedItem.country]).filter(Boolean).map(c => getCountryFlag(c)).join(' ')}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                        {(enrichedItem.university || enrichedItem.building || enrichedItem.house || enrichedItem.residence) && (
                          <div>{enrichedItem.university || enrichedItem.building || enrichedItem.house || enrichedItem.residence}</div>
                        )}
                        {enrichedItem.languageLevels && (
                          <div style={{ marginTop: 2 }}>
                            {Object.entries(enrichedItem.languageLevels).map(([lang, level], idx) => {
                              const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
                              const levelName = level.charAt(0).toUpperCase() + level.slice(1);
                              return (
                                <span key={lang}>
                                  {idx > 0 && ", "}
                                  {levelName} {langName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                })}
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>💬 Group Chat</div>
          <div style={styles.chatBox} ref={chatBoxRef}>
            {messages.map((m, i) => {
              const mine = m.from === currentUser;
              const sender = enrichUserWithProfile(m.from);
              let avatarUrl = null;
              if (sender && sender.avatar) {
                if (sender.avatar.provider === 'dicebear') {
                  avatarUrl = `https://api.dicebear.com/6.x/${sender.avatar.style}/svg?seed=${encodeURIComponent(sender.avatar.seed || sender.name || sender.username)}`;
                } else if (sender.avatar.provider === 'custom') {
                  avatarUrl = sender.avatar.url;
                }
              }
              const displayName = mine ? 'You' : (((sender?.username || sender?.name || m.from || '').toLowerCase() === 'admin') ? 'Admin' : ((sender && sender.name) || m.from));
              // Check if current user is the host
              const isHost = event?.host === currentUser || event?.host?.name === currentUser || event?.host?.username === currentUser;
              
              // Format timestamp
              const formatTimestamp = (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHours < 24) return `${diffHours}h ago`;
                if (diffDays < 7) return `${diffDays}d ago`;
                
                // Show actual date if older than a week
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              };
              
              return (
                <div
                  key={i}
                  style={{ ...styles.row, ...(mine ? styles.rowRight : {}) }}
                >
                  {/* Avatar on the left for others, on the right for me */}
                  {!mine && (
                    <div 
                      style={{
                        ...styles.avatarWrapper,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                      onClick={() => {
                        if (onUserClick && sender) {
                          onUserClick(sender);
                        }
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title={`View ${displayName}'s profile`}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" style={styles.avatarImg} />
                      ) : (
                        <div style={{ fontSize: 18 }}>{(sender && sender.emoji) || '🙂'}</div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.bubble,
                      ...(mine ? styles.bubbleMe : {}),
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        ...styles.bubbleName,
                        ...(mine ? styles.bubbleNameMe : {}),
                      }}
                    >
                      {displayName}
                    </span>
                    <div>{m.text}</div>
                    
                    {/* Timestamp */}
                    {m.timestamp && (
                      <div style={{
                        fontSize: 11,
                        color: mine ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
                        marginTop: 4,
                        fontWeight: 500,
                      }}>
                        {formatTimestamp(m.timestamp)}
                      </div>
                    )}
                    
                    {/* Delete button for host */}
                    {isHost && m.id && (
                      <button
                        onClick={() => deleteMsg(m.id)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'rgba(234, 43, 43, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {mine && (
                    <div style={{ ...styles.avatarWrapper, marginLeft: 8 }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" style={styles.avatarImg} />
                      ) : (
                        <div style={{ fontSize: 18 }}>{(sender && sender.emoji) || '🙂'}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={styles.chatInput}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              style={styles.input}
              onKeyDown={(e) => (e.key === "Enter" ? sendMsg() : null)}
            />
            <button style={styles.sendBtn} onClick={sendMsg}>Send</button>
          </div>
        </div>

      </div> {/* Close contentWrapper */}

      {/* Action Buttons */}
      <div style={{
        display: "flex", 
        gap: 12, 
        padding: "0 20px 32px 20px",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {/* Leave Event button - now visible for all events */}
        <button
          style={styles.leaveBtn}
          onClick={() => onLeaveEvent && onLeaveEvent(event)}
        >
          Leave Event
        </button>
        {/* Go to Homepage - always visible */}
        <button style={styles.homeBtn} onClick={onHome}>Go to Homepage</button>
      </div>      {/* Edit Event Screen */}
      {showEditModal && (
        <div style={styles.editScreen}>
          <div style={styles.editContainer}>
            {/* Header with back button */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: 32,
              paddingBottom: 16,
              borderBottom: `2px solid ${theme.border}`
            }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 8,
                  marginRight: 12,
                  color: theme.text,
                }}
                onClick={() => setShowEditModal(false)}
              >
                ← 
              </button>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: theme.text }}>
                ✏️ Edit Event
              </h2>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Event Name
              </label>
              <input
                type="text"
                value={editedEvent.name}
                onChange={(e) => setEditedEvent({...editedEvent, name: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Location
              </label>
              <select
                value={editedEvent.location}
                onChange={(e) => setEditedEvent({...editedEvent, location: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              >
                <option value="cite">🏛️ Cité</option>
                <option value="paris">🗼 Paris</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                📍 Exact Venue & Address
              </label>
              <LocationPicker
                theme={theme}
                initialAddress={editedEvent.venue || editedEvent.address || ""}
                initialCoordinates={editedEvent.coordinates || null}
                filterMode={editedEvent.location === "cite" ? "cite" : "all"}
                onLocationSelect={(location) => {
                  setEditedEvent({
                    ...editedEvent,
                    venue: location.name,
                    address: location.address,
                    coordinates: { lat: location.lat, lng: location.lng }
                  });
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Category
              </label>
              <select
                value={editedEvent.category}
                onChange={(e) => setEditedEvent({...editedEvent, category: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              >
                <option value="food">🍽️ Food</option>
                <option value="drinks">🍹 Drinks</option>
                <option value="random">🎲 Random</option>
                <option value="walk">🚶 A Walk</option>
                <option value="coffee">☕ Coffee</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Date
              </label>
              <input
                type="date"
                value={editedEvent.date}
                onChange={(e) => setEditedEvent({...editedEvent, date: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Start Time
              </label>
              <input
                type="time"
                value={editedEvent.time}
                onChange={(e) => setEditedEvent({...editedEvent, time: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                End Time (optional)
              </label>
              <input
                type="time"
                value={editedEvent.endTime || ""}
                onChange={(e) => setEditedEvent({...editedEvent, endTime: e.target.value})}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  boxSizing: "border-box",
                }}
              />
              {editedEvent.time && editedEvent.endTime && !isValidEndTime(editedEvent.time, editedEvent.endTime) && (
                <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 6 }}>
                  End time must be after start time
                </p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Languages 🗣️
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { value: "French", emoji: "🇫🇷" },
                  { value: "English", emoji: "🇬🇧" },
                  { value: "Spanish", emoji: "🇪🇸" },
                  { value: "German", emoji: "🇩🇪" },
                  { value: "Italian", emoji: "🇮🇹" },
                  { value: "Portuguese", emoji: "🇵🇹" },
                ].map(lang => (
                  <button
                    key={lang.value}
                    type="button"
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: `2px solid ${editedEvent.languages.includes(lang.value) ? theme.primary : theme.border}`,
                      background: editedEvent.languages.includes(lang.value) ? theme.primary : theme.card,
                      color: editedEvent.languages.includes(lang.value) ? "white" : theme.text,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      justifyContent: "center",
                    }}
                    onClick={() => {
                      const langs = [...editedEvent.languages];
                      const idx = langs.indexOf(lang.value);
                      if (idx > -1) {
                        langs.splice(idx, 1);
                      } else {
                        langs.push(lang.value);
                      }
                      setEditedEvent({...editedEvent, languages: langs});
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{lang.emoji}</span>
                    <span>{lang.value}</span>
                    {editedEvent.languages.includes(lang.value) && (
                      <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Maximum Participants 👥
              </label>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(5, 1fr)", 
                gap: 8, 
                marginBottom: 12,
              }}>
                {[4, 6, 8, 10, 12, 15, 20, 25, 30, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setEditedEvent({...editedEvent, capacity: size})}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 10,
                      border: `2px solid ${editedEvent.capacity === size ? theme.primary : theme.border}`,
                      background: editedEvent.capacity === size 
                        ? theme.primary
                        : theme.card,
                      color: editedEvent.capacity === size ? "white" : theme.text,
                      fontWeight: 800,
                      fontSize: 16,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: theme.textMuted, 
                  marginBottom: 6 
                }}>
                  Or enter custom (2-100):
                </label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={editedEvent.capacity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 2 && value <= 100) {
                      setEditedEvent({...editedEvent, capacity: value});
                    } else if (e.target.value === '') {
                      setEditedEvent({...editedEvent, capacity: null});
                    }
                  }}
                  placeholder="Enter number"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${theme.border}`,
                    fontSize: 16,
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* Target Interests */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                🎯 Target Interests (Optional)
              </label>
              <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                Select interests to show this event only to users with matching interests. Leave empty to show to everyone.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["Sports", "Music", "Art", "Movies", "Books", "Gaming", "Travel", "Food", "Technology", "Fashion", "Photography", "Fitness"].map((interest) => {
                  const isSelected = (editedEvent.targetInterests || []).includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      style={{
                        padding: "10px 8px",
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                        background: isSelected ? theme.primary : theme.card,
                        color: isSelected ? "white" : theme.text,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => {
                        const currentTargets = editedEvent.targetInterests || [];
                        if (isSelected) {
                          setEditedEvent({
                            ...editedEvent,
                            targetInterests: currentTargets.filter(i => i !== interest)
                          });
                        } else {
                          setEditedEvent({
                            ...editedEvent,
                            targetInterests: [...currentTargets, interest]
                          });
                        }
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Cité Connection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                🏛️ Target Cité Connection (Optional)
              </label>
              <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                Select connection types to target. Leave empty to show to everyone.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {[
                  { value: "yes", label: "🏠 Live on campus", desc: "Current residents" },
                  { value: "alumni", label: "🎓 Alumni", desc: "Former residents" },
                  { value: "no", label: "❌ No connection", desc: "Not connected to Cité" },
                ].map((option) => {
                  const isSelected = (editedEvent.targetCiteConnection || []).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                        background: isSelected ? theme.primary : theme.card,
                        color: isSelected ? "white" : theme.text,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                      onClick={() => {
                        const currentTargets = editedEvent.targetCiteConnection || [];
                        if (isSelected) {
                          setEditedEvent({
                            ...editedEvent,
                            targetCiteConnection: currentTargets.filter(c => c !== option.value)
                          });
                        } else {
                          setEditedEvent({
                            ...editedEvent,
                            targetCiteConnection: [...currentTargets, option.value]
                          });
                        }
                      }}
                    >
                      <div>{option.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{option.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Purpose of Stay */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                ✈️ Target Purpose of Stay (Optional)
              </label>
              <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                Select purpose categories to target. Leave empty to show to everyone.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {[
                  { value: "erasmus", label: "🎓 Erasmus / Exchange" },
                  { value: "degree", label: "📚 Degree student" },
                  { value: "working", label: "💼 Working / Internship" },
                  { value: "visiting", label: "✈️ Visiting / Short stay" },
                  { value: "local", label: "🏘️ Local resident" },
                  { value: "other", label: "🌍 Other" },
                ].map((option) => {
                  const isSelected = (editedEvent.targetReasons || []).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                        background: isSelected ? theme.primary : theme.card,
                        color: isSelected ? "white" : theme.text,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "left",
                      }}
                      onClick={() => {
                        const currentTargets = editedEvent.targetReasons || [];
                        if (isSelected) {
                          setEditedEvent({
                            ...editedEvent,
                            targetReasons: currentTargets.filter(r => r !== option.value)
                          });
                        } else {
                          setEditedEvent({
                            ...editedEvent,
                            targetReasons: [...currentTargets, option.value]
                          });
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Description
              </label>
              <textarea
                value={editedEvent.description}
                onChange={(e) => setEditedEvent({...editedEvent, description: e.target.value})}
                placeholder="Add event details, schedule, what to bring, etc..."
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 16,
                  minHeight: 200,
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8, color: theme.text }}>
                Event Image
              </label>
              
              {/* File Upload Button */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Check file size (max 5MB for server upload)
                      if (file.size > 5 * 1024 * 1024) {
                        alert("Image is too large! Please choose an image smaller than 5MB.");
                        return;
                      }
                      
                      // Show cropper
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageToCrop(reader.result);
                        setShowImageCropper(true);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${theme.border}`,
                    fontSize: 15,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    background: theme.card,
                  }}
                />
                <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, marginBottom: 0 }}>
                  📸 Upload your own image (max 2MB)
                </p>
              </div>

              {/* Or divider */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 12,
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
                value={editedEvent.imageUrl && !editedEvent.imageUrl.startsWith('data:') ? editedEvent.imageUrl : ''}
                onChange={(e) => setEditedEvent({...editedEvent, imageUrl: e.target.value})}
                placeholder="Paste image URL (e.g., https://example.com/image.jpg)"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>
                🔗 Use an image URL from Unsplash, Pexels, or Imgur
              </p>

              {/* Image Preview */}
              {editedEvent.imageUrl && (
                <div style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 12,
                  marginTop: 12,
                  backgroundImage: `url(${editedEvent.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: `2px solid ${theme.border}`,
                  position: "relative",
                }}>
                  {/* Remove button */}
                  <button
                    onClick={() => setEditedEvent({...editedEvent, imageUrl: ''})}
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
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div style={{ 
              display: "flex", 
              gap: 12, 
              marginTop: 32,
              paddingTop: 24,
              borderTop: `2px solid ${theme.border}`,
              position: "sticky",
              bottom: 0,
              background: theme.bg,
              paddingBottom: 24,
            }}>
              <button
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 14,
                  border: `2px solid ${theme.border}`,
                  background: theme.card,
                  color: theme.text,
                  fontWeight: 900,
                  fontSize: 17,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                onClick={() => {
                  setShowEditModal(false);
                  setImageFile(null);
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  padding: 16,
                  fontWeight: 900,
                  fontSize: 17,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(88,204,2,0.35)",
                }}
                onClick={async () => {
                  // Validate end time
                  if (editedEvent.time && editedEvent.endTime && !isValidEndTime(editedEvent.time, editedEvent.endTime)) {
                    alert("End time must be after start time");
                    return;
                  }
                  
                  if (onEditEvent) {
                    try {
                      let finalImageUrl = editedEvent.imageUrl;
                      
                      // If there's a new image file, upload it first
                      if (imageFile) {
                        console.log("Uploading new image...");
                        finalImageUrl = await api.uploadImage(imageFile);
                        console.log("Image uploaded successfully:", finalImageUrl);
                      }
                      
                      const updatedEvent = {
                        ...event,
                        ...editedEvent,
                        imageUrl: finalImageUrl,
                      };
                      console.log("Saving event with endTime:", updatedEvent.endTime);
                      onEditEvent(updatedEvent);
                      setImageFile(null); // Clear the file after successful upload
                    } catch (error) {
                      console.error("Failed to upload image:", error);
                      alert("Failed to upload image: " + error.message);
                      return; // Don't close modal if upload failed
                    }
                  }
                  setShowEditModal(false);
                }}
              >
                Save Changes ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Co-Hosts Modal */}
      {showManageHostsModal && (
        <div style={styles.editScreen}>
          <div style={styles.editContainer}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: 32,
              paddingBottom: 16,
              borderBottom: `2px solid ${theme.border}`
            }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: theme.text,
                  marginRight: 16,
                }}
                onClick={() => setShowManageHostsModal(false)}
              >
                ←
              </button>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: theme.text, margin: 0 }}>
                👥 Manage Co-Hosts
              </h2>
            </div>

            {/* Current Co-Hosts */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 16 }}>
                Current Co-Hosts
              </h3>
              {event?.coHosts && event.coHosts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {event.coHosts.map((coHost, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 16,
                        background: theme.card,
                        borderRadius: 12,
                        border: `2px solid ${theme.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 24 }}>{coHost.emoji || "👤"}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text }}>
                            {((coHost.username || coHost.name || '').toLowerCase() === 'admin') ? 'Admin' : coHost.name} {coHost.country && `${coHost.country}`}
                          </div>
                          {coHost.bio && (
                            <div style={{ fontSize: 14, color: theme.textMuted }}>
                              {coHost.bio}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        style={{
                          background: "#FF4B4B",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                        onClick={() => {
                          const coHostDisplay = ((coHost.username || coHost.name || '').toLowerCase() === 'admin') ? 'Admin' : coHost.name;
                          if (window.confirm(`Remove ${coHostDisplay} as co-host?`)) {
                            const updatedCoHosts = event.coHosts.filter((_, i) => i !== idx);
                            const updatedEvent = {
                              ...event,
                              coHosts: updatedCoHosts,
                            };
                            onEditEvent && onEditEvent(updatedEvent);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  padding: 24, 
                  textAlign: "center", 
                  color: theme.textMuted,
                  background: theme.card,
                  borderRadius: 12,
                  border: `2px dashed ${theme.border}`,
                }}>
                  No co-hosts yet. Add participants as co-hosts below.
                </div>
              )}
            </div>

            {/* Add Co-Hosts from Participants */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 16 }}>
                Add Co-Host from Participants
              </h3>
              {(event?.crew_full || event?.crew || event?.participants || []).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(event?.crew_full || event?.crew || event?.participants || [])
                    .filter(p => 
                      p.name !== currentUser && 
                      p.name !== event?.host?.name &&
                      !event.coHosts?.some(ch => ch.name === p.name)
                    )
                    .map((participant, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 16,
                          background: theme.card,
                          borderRadius: 12,
                          border: `2px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 24 }}>{participant.emoji || "👤"}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: theme.text }}>
                              {participant.name} {participant.country && `${participant.country}`}
                            </div>
                            {participant.bio && (
                              <div style={{ fontSize: 14, color: theme.textMuted }}>
                                {participant.bio}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 16px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                          onClick={() => {
                            const updatedCoHosts = [...(event.coHosts || []), participant];
                            const updatedEvent = {
                              ...event,
                              coHosts: updatedCoHosts,
                            };
                            onEditEvent && onEditEvent(updatedEvent);
                          }}
                        >
                          Add as Co-Host
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ 
                  padding: 24, 
                  textAlign: "center", 
                  color: theme.textMuted,
                  background: theme.card,
                  borderRadius: 12,
                  border: `2px dashed ${theme.border}`,
                }}>
                  No participants available to add as co-hosts.
                </div>
              )}
            </div>

            <button
              style={{
                marginTop: 32,
                width: "100%",
                background: theme.card,
                color: theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: 14,
                padding: 16,
                fontWeight: 900,
                fontSize: 17,
                cursor: "pointer",
              }}
              onClick={() => setShowManageHostsModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showImageCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={async (croppedImageUrl) => {
            // Convert cropped blob URL to file
            try {
              const response = await fetch(croppedImageUrl);
              const blob = await response.blob();
              const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
              
              setImageFile(file);
              // Show preview
              const reader = new FileReader();
              reader.onloadend = () => {
                setEditedEvent({...editedEvent, imageUrl: reader.result});
              };
              reader.readAsDataURL(file);
              
              setShowImageCropper(false);
              setImageToCrop(null);
            } catch (error) {
              console.error("Error processing cropped image:", error);
              alert("Failed to process cropped image. Please try again.");
            }
          }}
          onCancel={() => {
            setShowImageCropper(false);
            setImageToCrop(null);
          }}
          theme={theme}
        />
      )}
    </div>
  );
}

export default SocialChat;