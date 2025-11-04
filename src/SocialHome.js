import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import users from "./users";
import LocationPicker from "./LocationPicker";
import "./SocialHome.animations.css";
import { createEvent } from "./api";

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
  showDebug,
  friendEvents = [],
  onRequestJoinEvent,
  friendRequestsIncoming = [],
  onAcceptFriendRequestFrom,
  onDeclineFriendRequestFrom,
  addPoints,
  getUserPoints,
  templateEventToCreate = null,
  onTemplateEventHandled = null,
}) {
  if (showDebug) {
    console.log("[DEBUG] joinedEvents for", userName, joinedEvents);
  }

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [createEventStep, setCreateEventStep] = useState(1);
  const [eventPreview, setEventPreview] = useState(null); // For previewing events before joining
  // View mode: 'my' shows only user's joined events, 'friends' shows only friends' joined events
  const [viewMode, setViewMode] = useState("my");
  
  // New state for Frimake-style navigation
  const [activeTab, setActiveTab] = useState("featured"); // "featured", "joined", "hosted"
  const [activeBottomTab, setActiveBottomTab] = useState("events"); // "events", "explore", "calendar", "profile"
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExplore, setShowExplore] = useState(false);
  const [exploreSearchQuery, setExploreSearchQuery] = useState("");
  const [exploreTimeFilter, setExploreTimeFilter] = useState("upcoming"); // "upcoming", "today", "tomorrow", "weekend"
  const [exploreLocationFilter, setExploreLocationFilter] = useState("all"); // "all", "Cité", "Paris"
  const [exploreCategoryFilter, setExploreCategoryFilter] = useState("all"); // "all", "food", "drinks", etc.
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showWhereModal, setShowWhereModal] = useState(false);
  const [showWhenModal, setShowWhenModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

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
    capacity: 6, // Maximum number of participants
    imageUrl: "", // Background image for the event
    templateEventId: null, // ID of template event if created from featured event
  });
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  // Handle template event for "Create Hangout" feature
  useEffect(() => {
    if (templateEventToCreate) {
      setNewEvent({
        name: "", // User customizes the hangout name
        location: templateEventToCreate.location || "cite",
        venue: templateEventToCreate.venue || "",
        address: templateEventToCreate.address || "",
        coordinates: templateEventToCreate.coordinates || null,
        date: templateEventToCreate.date || "", // Copy date from template
        time: templateEventToCreate.time || "", // Copy time from template
        description: "", // User writes their own hangout description
        category: templateEventToCreate.category || "food",
        languages: [], // User customizes languages
        capacity: 6, // User customizes capacity
        imageUrl: templateEventToCreate.imageUrl || "",
        templateEventId: templateEventToCreate.id,
      });
      setShowCreateEventModal(true);
      setCreateEventStep(1);
      // Notify parent that we've handled the template
      if (onTemplateEventHandled) {
        onTemplateEventHandled();
      }
    }
  }, [templateEventToCreate, onTemplateEventHandled]);

  const fadeIn = { animation: "fadeIn 0.7s cubic-bezier(0.23, 1, 0.32, 1)" };
  const pulse = { animation: "pulse 1.2s infinite" };

  const socialPoints = getUserPoints ? getUserPoints(userName) : 0;
  const nextLevel = 200;

  // Calendar helper functions
  // Helper function to get date string in local timezone (YYYY-MM-DD)
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = getLocalDateString(date); // YYYY-MM-DD format in local timezone
    return joinedEvents.filter(event => {
      if (!event.date) return false;
      // Normalize event date to YYYY-MM-DD format for comparison
      const eventDateStr = event.date.includes('T') 
        ? event.date.split('T')[0] 
        : event.date;
      return eventDateStr === dateStr;
    });
  };

  const generateCalendar = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const calendar = [];
    let week = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }
    
    // Add remaining days to complete the last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }
    
    return calendar;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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
  const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";

  return (
    <div style={styles.container}>
      {/* Top Fixed Header - Frimake Style */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: theme.card,
        borderBottom: `1px solid ${theme.bg}`,
        zIndex: 1000,
        paddingBottom: 0,
      }}>
        {/* Main Header Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img 
              src={`${API_URL}/static/assets/logo.png`} 
              alt="Logo" 
              style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: "50%" }}
            />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>
            Lemi
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button 
              onClick={() => {
                setActiveBottomTab("profile");
                onEditProfile && onEditProfile();
              }}
              style={{ 
                background: "none", 
                border: "none", 
                fontSize: 22, 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: theme.primary,
              }}
            >
              <FaUserCircle size={28} />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Frimake Style or Explore Tabs */}
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "0 16px 8px",
          borderBottom: `2px solid ${theme.bg}`,
        }}>
          {showExplore ? (
            // Explore tabs: Upcoming, Today, Tomorrow, Weekend
            <>
              <button
                onClick={() => setExploreTimeFilter("upcoming")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: exploreTimeFilter === "upcoming" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: exploreTimeFilter === "upcoming" ? 900 : 600,
                  fontSize: 15,
                  color: exploreTimeFilter === "upcoming" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Upcoming
              </button>
              <button
                onClick={() => setExploreTimeFilter("today")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: exploreTimeFilter === "today" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: exploreTimeFilter === "today" ? 900 : 600,
                  fontSize: 15,
                  color: exploreTimeFilter === "today" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Today
              </button>
              <button
                onClick={() => setExploreTimeFilter("tomorrow")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: exploreTimeFilter === "tomorrow" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: exploreTimeFilter === "tomorrow" ? 900 : 600,
                  fontSize: 15,
                  color: exploreTimeFilter === "tomorrow" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Tomorrow
              </button>
              <button
                onClick={() => setExploreTimeFilter("weekend")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: exploreTimeFilter === "weekend" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: exploreTimeFilter === "weekend" ? 900 : 600,
                  fontSize: 15,
                  color: exploreTimeFilter === "weekend" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Weekend
              </button>
            </>
          ) : (
            // Regular tabs: Featured, Joined, Hosted
            <>
              <button
                onClick={() => setActiveTab("featured")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "featured" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: activeTab === "featured" ? 900 : 600,
                  fontSize: 15,
                  color: activeTab === "featured" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Featured
              </button>
              <button
                onClick={() => setActiveTab("joined")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "joined" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: activeTab === "joined" ? 900 : 600,
                  fontSize: 15,
                  color: activeTab === "joined" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Joined
              </button>
              <button
                onClick={() => setActiveTab("hosted")}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "hosted" ? `3px solid ${theme.gold}` : "3px solid transparent",
                  fontWeight: activeTab === "hosted" ? 900 : 600,
                  fontSize: 15,
                  color: activeTab === "hosted" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Hosted
              </button>
            </>
          )}
        </div>

        {/* Filter Buttons Row - Only show in Explore mode */}
        {showExplore && (
          <div style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px",
            overflowX: "auto",
            background: theme.bg,
          }}>
            <button 
              onClick={() => setShowSearchModal(true)}
              style={{
              padding: "8px 16px",
              background: exploreSearchQuery ? theme.gold : "white",
              border: `1px solid ${theme.bg}`,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: theme.text,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              🔍 Search
            </button>
            <button 
              onClick={() => setShowWhereModal(true)}
              style={{
              padding: "8px 16px",
              background: exploreLocationFilter !== "all" ? theme.gold : "white",
              border: `1px solid ${theme.bg}`,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: theme.text,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              📍 {exploreLocationFilter !== "all" ? exploreLocationFilter : "Where?"}
            </button>
            <button 
              onClick={() => setShowWhenModal(true)}
              style={{
              padding: "8px 16px",
              background: theme.gold,
              border: "none",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: theme.text,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              📅 {exploreTimeFilter === "upcoming" ? "Upcoming" : exploreTimeFilter === "today" ? "Today" : exploreTimeFilter === "tomorrow" ? "Tomorrow" : "Weekend"}
            </button>
            <button 
              onClick={() => setShowFiltersModal(true)}
              style={{
              padding: "8px 16px",
              background: exploreCategoryFilter !== "all" ? theme.gold : "white",
              border: `1px solid ${theme.bg}`,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: theme.text,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              ⚙️ {exploreCategoryFilter !== "all" ? exploreCategoryFilter : "Filters"}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area - with top padding for fixed header */}
      <div style={{ paddingTop: 180, paddingBottom: 80 }}>
      <div style={styles.header}>
        <img 
          src={`${API_URL}/static/assets/logo.png`} 
          alt="Lemi Logo" 
          style={{ width: 40, height: 40, objectFit: 'contain', display: 'none' }}
        />
        <button style={{...styles.iconButton, display: 'none'}} onClick={() => onEditProfile && onEditProfile()}>
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

        <span style={{...styles.points, display: 'none'}}>⭐ {socialPoints} pts</span>
      </div>

      <div style={{...styles.greeting, display: 'none'}}>Hi {userName} 👋</div>

      <div style={{...styles.progressBox, display: 'none'}}>
        <div style={{ ...styles.progressBar, width: `${(socialPoints / nextLevel) * 100}%` }} />
        <span style={styles.progressText}>Level 2 Explorer ({socialPoints}/{nextLevel})</span>
      </div>

      {/* EXPLORE SCREEN CONTENT */}
      {showExplore && (
        <>
          {/* Community Events - User-created events */}
          {(() => {
            // Get today's date for filtering
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Filter for user-created events
            const communityEvents = publicEvents.filter((event) => {
              // Must be a user event (has any capacity) or admin-created event (capacity is null)
              const isUserEvent = event.capacity !== undefined || event.capacity === null || (event.host || event.createdBy);
              if (!isUserEvent) return false;
              
              // Skip if this is the current user's event
              const eventCreator = event.host?.name || event.createdBy;
              if (eventCreator && (eventCreator === userName || eventCreator.toLowerCase() === userName.toLowerCase())) return false;
              
              // Skip if already joined
              if (joinedEvents.some(je => String(je.id) === String(event.id))) return false;
              
              // Search filter
              if (exploreSearchQuery && !event.name.toLowerCase().includes(exploreSearchQuery.toLowerCase())) {
                return false;
              }
              
              // Location filter (Where?)
              if (exploreLocationFilter !== "all" && event.location !== exploreLocationFilter) {
                return false;
              }
              
              // Category filter (Filters)
              if (exploreCategoryFilter !== "all" && event.category !== exploreCategoryFilter) {
                return false;
              }
              
              // Time filter (When? - from tabs)
              if (exploreTimeFilter !== "upcoming" && event.date) {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                
                if (exploreTimeFilter === "today") {
                  if (eventDate.getTime() !== today.getTime()) {
                    return false;
                  }
                } else if (exploreTimeFilter === "tomorrow") {
                  if (eventDate.getTime() !== tomorrow.getTime()) {
                    return false;
                  }
                } else if (exploreTimeFilter === "weekend") {
                  // Weekend is Saturday (6) and Sunday (0)
                  const dayOfWeek = eventDate.getDay();
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    return false;
                  }
                }
              }
              
              return true;
            });
            
            // Sort by date (soonest first) for upcoming view
            let sortedEvents = [...communityEvents];
            if (exploreTimeFilter === "upcoming") {
              sortedEvents = sortedEvents.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB; // Ascending order (soonest first)
              });
            }

            if (sortedEvents.length === 0) {
              return (
                <div style={styles.highlightCard}>
                  <div style={styles.highlightTitle}>🎤 Community Events</div>
                  <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                    Events hosted by community members
                  </div>
                  <div style={{ ...styles.empty, margin: "20px 0 20px 0" }}>
                    No community events found for this time period.
                  </div>
                </div>
              );
            }

            return (
              <div style={styles.highlightCard}>
                <div style={styles.highlightTitle}>🎤 Community Events</div>
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                  Events hosted by community members
                </div>
                {sortedEvents.map((event, idx) => (
                  <div key={idx} style={{ 
                    background: theme.bg, 
                    padding: 14, 
                    borderRadius: 12, 
                    marginBottom: 10,
                    border: `1px solid ${theme.track}`,
                    cursor: "pointer",
                  }}
                  onClick={() => setEventPreview(event)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: theme.text, flex: 1 }}>
                        {event.name}
                        {event.languages && event.languages.length > 0 && (
                          <span style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>
                            {" - "}
                            {event.languages.map((lang, i) => {
                              const flag = getLanguageFlag(lang);
                              return <span key={i}>{flag} {lang}{i < event.languages.length - 1 ? " ↔ " : ""}</span>;
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Host Info */}
                    {(() => {
                      if (event.host) {
                        return (
                          <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                            👤 Hosted by: <span style={{ fontWeight: 700, color: theme.accent }}>
                              {event.host.emoji} {event.host.name} {event.host.country}
                            </span>
                          </div>
                        );
                      } else if (event.createdBy) {
                        // Fallback for older events without host object
                        const hostUser = users.find(u => u.name === event.createdBy || u.username === event.createdBy);
                        if (hostUser) {
                          return (
                            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                              👤 Hosted by: <span style={{ fontWeight: 700, color: theme.accent }}>
                                {hostUser.emoji} {hostUser.name} {hostUser.country}
                              </span>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                    
                    {event.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 140,
                        borderRadius: 12,
                        marginBottom: 10,
                        backgroundImage: `url(${event.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }} />
                    )}
                    
                    {event.location && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                        📍 {event.location === "cite" ? "Cité" : event.location === "paris" ? "Paris" : event.location}
                        {event.venue && ` · ${event.venue}`}
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                      ⏰ {event.date}
                    </div>
                    
                    {event.category && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                        🎯 {event.category}
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 10 }}>
                      👥 {(() => {
                        const attendeeCount = (event.crew?.length || 0) + (event.participants?.length || 0);
                        return event.capacity 
                          ? `${attendeeCount}/${event.capacity} spots filled` 
                          : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                      })()}
                    </div>
                    
                    <button
                      style={{
                        ...styles.joinButton,
                        padding: "10px 16px",
                        fontSize: 14,
                        width: "100%",
                        opacity: (() => {
                          const attendeeCount = (event.crew?.length || 0) + (event.participants?.length || 0);
                          return (event.capacity && attendeeCount >= event.capacity) ? 0.5 : 1;
                        })(),
                        cursor: (() => {
                          const attendeeCount = (event.crew?.length || 0) + (event.participants?.length || 0);
                          return (event.capacity && attendeeCount >= event.capacity) ? "not-allowed" : "pointer";
                        })(),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const attendeeCount = (event.crew?.length || 0) + (event.participants?.length || 0);
                        if (event.capacity && attendeeCount >= event.capacity) {
                          alert("⚠️ This event is full! Maximum capacity of " + event.capacity + " people has been reached.");
                          return;
                        }
                        onJoinPublicEvent && onJoinPublicEvent(event);
                      }}
                    >
                      {(event.capacity && event.crew && event.crew.length >= event.capacity) ? "⚠️ Event Full" : "🎉 Join Event"}
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {/* Tab Content */}
      {activeTab === "featured" && !showExplore && (
        <>
      {/* Featured Events - Template Events Created by Admin */}
      {(() => {
        // Filter for featured events (isFeatured === true OR created by admin) and exclude joined events
        const featuredEvents = publicEvents.filter(event => {
          // Must be a featured event OR created by admin
          const isFeaturedOrAdmin = event.isFeatured || (event.createdBy && event.createdBy.toLowerCase() === 'admin');
          if (!isFeaturedOrAdmin) return false;
          
          // Must not be already joined
          return !joinedEvents.some(je => String(je.id) === String(event.id));
        });
        
        if (!featuredEvents || featuredEvents.length === 0) {
          return (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>🎉 Featured Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Main events happening - organize language exchanges or hangouts around them!
              </div>
              <div style={{ ...styles.empty, margin: "20px 0 20px 0" }}>
                No featured events available yet.
              </div>
            </div>
          );
        }
        
        return (
        <div style={styles.highlightCard}>
          <div style={styles.highlightTitle}>🎉 Featured Events</div>
          <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
            Main events happening - organize language exchanges or hangouts around them!
          </div>
          {featuredEvents.slice(0, 5).map((event, idx) => (
            <div key={idx} style={{ 
              background: theme.bg, 
              padding: 14, 
              borderRadius: 12, 
              marginBottom: 10,
              border: `1px solid ${theme.track}`,
              cursor: "pointer",
            }}
            onClick={() => onJoinedEventClick && onJoinedEventClick(event)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: theme.text, flex: 1 }}>
                  {event.name}
                  {event.languages && event.languages.length > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>
                      {" - "}
                      {event.languages.map((lang, i) => {
                        const flag = getLanguageFlag(lang);
                        return <span key={i}>{flag} {lang}{i < event.languages.length - 1 ? " ↔ " : ""}</span>;
                      })}
                    </span>
                  )}
                </div>
              </div>
              
              {event.imageUrl && (
                <div style={{
                  width: "100%",
                  height: 140,
                  borderRadius: 12,
                  marginBottom: 10,
                  backgroundImage: `url(${event.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }} />
              )}
              
              {event.location && (
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                  📍 {event.location === "cite" ? "Cité" : event.location === "paris" ? "Paris" : event.location}
                  {event.venue && ` · ${event.venue}`}
                </div>
              )}
              
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                ⏰ {event.date || event.time}
              </div>
              
              {event.category && (
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 10 }}>
                  🎯 {event.category}
                </div>
              )}
            </div>
          ))}
          {featuredEvents.length > 5 && (
            <div style={{ fontSize: 13, color: theme.textMuted, textAlign: "center", marginTop: 8 }}>
              +{featuredEvents.length - 5} more featured event{featuredEvents.length - 5 !== 1 ? "s" : ""} available
            </div>
          )}
        </div>
        );
      })()}

        </>
      )}

      {/* TAB: My Joined Events */}
      {activeTab === "joined" && !showExplore && (
        <>
          {/* My Joined Events Content */}
          {joinedEvents.filter(item => !(item.host && item.host.name === userName)).length > 0 ? (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>📅 My Joined Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Events you have joined
              </div>
              {joinedEvents
                .filter(item => !(item.host && item.host.name === userName))
                .map((item, idx) => (
                  <div
                    key={`joined-${idx}`}
                    style={{ 
                      background: theme.bg, 
                      padding: 14, 
                      borderRadius: 12, 
                      marginBottom: 10,
                      border: `1px solid ${theme.track}`,
                      cursor: "pointer",
                    }}
                    onClick={() => onJoinedEventClick(item)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: theme.text, flex: 1 }}>
                        {String(item.name || item.type || item.category || "Event")}
                        {item.languages && item.languages.length > 0 && (
                          <span style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>
                            {" - "}
                            {item.languages.map((lang, i) => {
                              const flag = getLanguageFlag(lang);
                              return <span key={i}>{flag} {lang}{i < item.languages.length - 1 ? " ↔ " : ""}</span>;
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Host Info */}
                    {(() => {
                      if (item.host) {
                        return (
                          <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                            👤 Hosted by: <span style={{ fontWeight: 700, color: theme.accent }}>
                              {item.host.emoji} {item.host.name} {item.host.country}
                            </span>
                          </div>
                        );
                      } else if (item.createdBy) {
                        // Fallback for older events without host object
                        const hostUser = users.find(u => u.name === item.createdBy || u.username === item.createdBy);
                        if (hostUser) {
                          return (
                            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                              👤 Hosted by: <span style={{ fontWeight: 700, color: theme.accent }}>
                                {hostUser.emoji} {hostUser.name} {hostUser.country}
                              </span>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                    
                    {item.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 140,
                        borderRadius: 12,
                        marginBottom: 10,
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }} />
                    )}
                    
                    {item.location && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                        📍 {item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location}
                        {item.venue && ` · ${item.venue}`}
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                      ⏰ {item.date}
                    </div>
                    
                    {item.category && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                        🎯 {item.category}
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 10 }}>
                      👥 {(() => {
                        const attendeeCount = (item.crew?.length || 0) + (item.participants?.length || 0);
                        return item.capacity 
                          ? `${attendeeCount}/${item.capacity} spots filled` 
                          : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                      })()}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>📅 My Joined Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Events you have joined
              </div>
              <div style={{ ...styles.empty, margin: "20px 0 20px 0" }}>
                No joined events yet. Explore Featured Events to join!
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB: My Hosted Events */}
      {activeTab === "hosted" && !showExplore && (
        <>
          {joinedEvents.filter(item => item.host && item.host.name === userName).length > 0 ? (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>🎤 My Hosted Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Events you are hosting
              </div>
              {joinedEvents
                .filter(item => item.host && item.host.name === userName)
                .map((item, idx) => (
                  <div
                    key={`hosted-${idx}`}
                    style={{ 
                      background: theme.bg, 
                      padding: 14, 
                      borderRadius: 12, 
                      marginBottom: 10,
                      border: `1px solid ${theme.track}`,
                      cursor: "pointer",
                    }}
                    onClick={() => onJoinedEventClick(item)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: theme.text, flex: 1 }}>
                        {String(item.name || item.type || item.category || "Event")}
                        {item.languages && item.languages.length > 0 && (
                          <span style={{ fontSize: 14, fontWeight: 600, color: theme.textMuted }}>
                            {" - "}
                            {item.languages.map((lang, i) => {
                              const flag = getLanguageFlag(lang);
                              return <span key={i}>{flag} {lang}{i < item.languages.length - 1 ? " ↔ " : ""}</span>;
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Host Info */}
                    {(() => {
                      if (item.host) {
                        return (
                          <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8 }}>
                            👤 Hosted by: <span style={{ fontWeight: 700, color: theme.accent }}>
                              {item.host.emoji} {item.host.name} {item.host.country}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {item.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 140,
                        borderRadius: 12,
                        marginBottom: 10,
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }} />
                    )}
                    
                    {item.location && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                        📍 {item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location}
                        {item.venue && ` · ${item.venue}`}
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                      ⏰ {item.date}
                    </div>
                    
                    {item.category && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
                        🎯 {item.category}
                      </div>
                    )}
                    
                    <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 10 }}>
                      👥 {(() => {
                        const attendeeCount = (item.crew?.length || 0) + (item.participants?.length || 0);
                        return item.capacity 
                          ? `${attendeeCount}/${item.capacity} spots filled` 
                          : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                      })()}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>🎤 My Hosted Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Events you are hosting
              </div>
              <div style={{ ...styles.empty, margin: "20px 0 20px 0" }}>
                You haven't hosted any events yet. Create one using the + button!
              </div>
            </div>
          )}
        </>
      )}

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

      {viewMode === "my" && false && (
        <>
          {/* Hosted Events Section - HIDDEN, now shown via tabs */}
          {joinedEvents.filter(item => item.host && item.host.name === userName).length > 0 && (
            <>
              <div style={styles.title}>🎤 My Hosted Events</div>
              <div>
                {joinedEvents
                  .filter(item => item.host && item.host.name === userName)
                  .map((item, idx) => (
                    <div
                      key={`hosted-${idx}`}
                      style={{...styles.eventCard, borderLeft: `4px solid ${theme.gold}`}}
                      className="eventCard"
                      onClick={() => onJoinedEventClick(item)}
                    >
                      <div style={styles.eventName}>
                        {String(item.name || item.type || item.category || "Event")}
                        {formatLanguagesForTitle(item.languages)}
                      </div>
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
                      <div style={styles.details}>
                        👥 {(() => {
                          const attendeeCount = (item.crew?.length || 0) + (item.participants?.length || 0);
                          return item.capacity 
                            ? `${attendeeCount}/${item.capacity} spots filled` 
                            : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                        })()}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* Joined Events Section */}
          <div style={styles.title}>🎟️ My Joined Events</div>
          {joinedEvents.filter(item => !item.host || item.host.name !== userName).length === 0 ? (
            <div style={styles.empty}>You haven’t joined any events yet.</div>
          ) : (
            <div>
              {joinedEvents
                .filter(item => !item.host || item.host.name !== userName)
                .map((item, idx) => (
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

      {/* Create Event Modal - Multi-step Wizard */}
      {showCreateEventModal && (
        <div style={styles.modalOverlay} onClick={() => {
          setShowCreateEventModal(false);
          setCreateEventStep(1);
          setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", description: "", category: "food", languages: [], capacity: 6, imageUrl: "", templateEventId: null });
          setShowAllLanguages(false);
        }}>
          <div style={{...styles.modal, maxHeight: isMobile ? "90vh" : "85vh", overflowY: "visible", padding: isMobile ? 20 : 32}} onClick={(e) => e.stopPropagation()}>
            
            {/* Progress Indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(step => (
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
                      background: (newEvent.venue && newEvent.address) 
                        ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` 
                        : theme.border,
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: (newEvent.venue && newEvent.address) ? "pointer" : "not-allowed",
                      boxShadow: (newEvent.venue && newEvent.address) ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                      opacity: (newEvent.venue && newEvent.address) ? 1 : 0.5,
                    }}
                    onClick={() => (newEvent.venue && newEvent.address) && setCreateEventStep(3)}
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

            {/* Step 7: Capacity */}
            {createEventStep === 7 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  How many people? 👥
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Set the maximum number of participants
                </p>
                
                {/* Capacity Selector */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(3, 1fr)", 
                  gap: 12, 
                  marginBottom: 24,
                  maxWidth: 400,
                  margin: "0 auto 32px auto",
                }}>
                  {[4, 6, 8, 10, 12, 15, 20, 25, 30].map((size) => (
                    <button
                      key={size}
                      onClick={() => setNewEvent({...newEvent, capacity: size})}
                      style={{
                        padding: "16px 12px",
                        borderRadius: 14,
                        border: `3px solid ${newEvent.capacity === size ? theme.primary : theme.border}`,
                        background: newEvent.capacity === size 
                          ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` 
                          : theme.card,
                        color: newEvent.capacity === size ? "white" : theme.text,
                        fontWeight: 900,
                        fontSize: 20,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: newEvent.capacity === size ? "0 4px 12px rgba(88,204,2,0.3)" : "none",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ 
                    display: "block", 
                    fontSize: 14, 
                    fontWeight: 700, 
                    color: theme.textMuted, 
                    marginBottom: 8 
                  }}>
                    Or enter a custom number:
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={newEvent.capacity || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 2 && value <= 100) {
                        setNewEvent({...newEvent, capacity: value});
                      }
                    }}
                    placeholder="Enter number (2-100)"
                    style={{
                      width: "100%",
                      maxWidth: 200,
                      padding: isMobile ? 12 : 14,
                      borderRadius: 14,
                      border: `2px solid ${theme.border}`,
                      fontSize: 16,
                      textAlign: "center",
                      fontWeight: 700,
                    }}
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
                    onClick={() => setCreateEventStep(6)}
                  >
                    ← Back
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: newEvent.capacity ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                      color: newEvent.capacity ? "white" : theme.textMuted,
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: newEvent.capacity ? "pointer" : "not-allowed",
                      boxShadow: newEvent.capacity ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                    }}
                    onClick={() => newEvent.capacity && setCreateEventStep(8)}
                    disabled={!newEvent.capacity}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 8: Description (Optional) */}
            {createEventStep === 8 && (
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
                    onClick={() => setCreateEventStep(9)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 9: Image Upload (Optional) */}
            {createEventStep === 9 && (
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
                    onClick={() => setCreateEventStep(8)}
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
                    onClick={async () => {
                      // Create event via API
                      try {
                        const eventData = {
                          name: newEvent.name,
                          location: newEvent.location,
                          venue: newEvent.venue,
                          address: newEvent.address,
                          coordinates: newEvent.coordinates,
                          date: newEvent.date,
                          time: newEvent.time,
                          description: newEvent.description || "",
                          category: newEvent.category,
                          languages: newEvent.languages,
                          image_url: newEvent.imageUrl || "",
                          is_public: true,
                          event_type: "in-person",
                          capacity: newEvent.capacity,
                          created_by: userName,
                          is_featured: false,
                          template_event_id: newEvent.templateEventId || null,
                        };
                        
                        // Call the API to create the event
                        await createEvent(eventData);
                        
                        // Award 3 points for hosting an event
                        if (addPoints) {
                          const newPoints = addPoints(userName, 3);
                          alert(`🎉 Event created successfully!\n\n⭐ +3 points earned! You now have ${newPoints} points!\n\nYour event will appear in:\n• Your 'My Hosted Events' section\n• Other users' 'Community Events' section`);
                        } else {
                          alert("🎉 Event created successfully!\n\nYour event will appear in:\n• Your 'My Hosted Events' section\n• Other users' 'Community Events' section");
                        }
                        
                        // Reset form and close
                        setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", description: "", category: "food", languages: [], capacity: 6, imageUrl: "", templateEventId: null });
                        setCreateEventStep(1);
                        setShowCreateEventModal(false);
                        setShowAllLanguages(false);
                      } catch (err) {
                        console.error("Failed to create event:", err);
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
                setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", description: "", category: "food", languages: [], capacity: 6, imageUrl: "", templateEventId: null });
                setShowAllLanguages(false);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Event Preview Modal - For viewing events before joining */}
      {eventPreview && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setEventPreview(null)}
        >
          <div 
            style={{
              background: theme.card,
              borderRadius: 18,
              padding: isMobile ? 24 : 32,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Event Title */}
            <h2 style={{ fontSize: 28, fontWeight: 900, color: theme.text, marginBottom: 16 }}>
              {eventPreview.name}
            </h2>

            {/* Event Image */}
            {eventPreview.imageUrl && (
              <div style={{
                width: "100%",
                height: 200,
                borderRadius: 12,
                marginBottom: 20,
                backgroundImage: `url(${eventPreview.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }} />
            )}

            {/* Languages */}
            {eventPreview.languages && eventPreview.languages.length > 0 && (
              <div style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                padding: "16px 20px",
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.9)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  🗣️ Languages
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {eventPreview.languages.map((lang, i) => (
                    <div key={i} style={{
                      background: "white",
                      padding: "8px 16px",
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <span style={{ fontSize: 20 }}>{getLanguageFlag(lang)}</span>
                      <span style={{ fontWeight: 700, color: theme.text }}>{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host Info */}
            {(() => {
              if (eventPreview.host) {
                return (
                  <div style={{ 
                    background: theme.bg, 
                    padding: 16, 
                    borderRadius: 12, 
                    marginBottom: 16 
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: theme.textMuted, marginBottom: 8 }}>
                      👤 HOSTED BY
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>
                      {eventPreview.host.emoji} {eventPreview.host.name} {eventPreview.host.country}
                    </div>
                    {eventPreview.host.bio && (
                      <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 4 }}>
                        "{eventPreview.host.bio}"
                      </div>
                    )}
                  </div>
                );
              } else if (eventPreview.createdBy) {
                const hostUser = users.find(u => u.name === eventPreview.createdBy || u.username === eventPreview.createdBy);
                if (hostUser) {
                  return (
                    <div style={{ 
                      background: theme.bg, 
                      padding: 16, 
                      borderRadius: 12, 
                      marginBottom: 16 
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: theme.textMuted, marginBottom: 8 }}>
                        👤 HOSTED BY
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>
                        {hostUser.emoji} {hostUser.name} {hostUser.country}
                      </div>
                      {hostUser.bio && (
                        <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 4 }}>
                          "{hostUser.bio}"
                        </div>
                      )}
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Event Details */}
            <div style={{ marginBottom: 16 }}>
              {eventPreview.location && (
                <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span>📍</span>
                  <div>
                    <div style={{ fontWeight: 600, color: theme.text }}>
                      {eventPreview.location === "cite" ? "Cité Internationale" : eventPreview.location === "paris" ? "Paris" : eventPreview.location}
                    </div>
                    {eventPreview.venue && <div style={{ fontSize: 14 }}>{eventPreview.venue}</div>}
                    {eventPreview.address && <div style={{ fontSize: 13 }}>{eventPreview.address}</div>}
                  </div>
                </div>
              )}
              
              <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}>
                📅 {eventPreview.date ? `${eventPreview.date} at ${eventPreview.time}` : eventPreview.time}
              </div>
              
              {eventPreview.category && (
                <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}>
                  🎯 {getCategoryEmoji(eventPreview.category)} {eventPreview.category}
                </div>
              )}
            </div>

            {/* Description */}
            {eventPreview.description && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.textMuted, marginBottom: 8 }}>
                  📝 ABOUT THIS EVENT
                </div>
                <div style={{ 
                  fontSize: 15, 
                  color: theme.text, 
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  background: theme.bg,
                  padding: 16,
                  borderRadius: 12,
                }}>
                  {eventPreview.description}
                </div>
              </div>
            )}

            {/* Participants */}
            {(() => {
              const allParticipants = [
                ...(eventPreview.crew || []),
                ...(eventPreview.participants || [])
              ];
              
              if (allParticipants.length === 0) return null;
              
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: theme.textMuted, marginBottom: 8 }}>
                    👥 PARTICIPANTS ({allParticipants.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allParticipants.slice(0, 10).map((member, i) => {
                      const userInfo = typeof member === "object" && member !== null
                        ? member
                        : users.find((u) => u.name === member || u.username === member) || { name: member };
                      return (
                        <div key={i} style={{
                          background: theme.bg,
                          padding: "6px 12px",
                          borderRadius: 999,
                          fontSize: 14,
                          fontWeight: 600,
                          color: theme.text,
                        }}>
                          {userInfo.emoji} {userInfo.name}
                        </div>
                      );
                    })}
                    {allParticipants.length > 10 && (
                      <div style={{
                        background: theme.bg,
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.textMuted,
                      }}>
                        +{allParticipants.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              {/* Check if this is a featured/admin event */}
              {(eventPreview.isFeatured || (eventPreview.createdBy && eventPreview.createdBy.toLowerCase() === 'admin')) ? (
                // Featured event - show "Create Your Own" button
                <button
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 14,
                    padding: 16,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(102,126,234,0.28)",
                  }}
                  onClick={() => {
                    // Pre-fill the create event form with template data
                    setNewEvent({
                      name: eventPreview.name,
                      location: eventPreview.location || "cite",
                      venue: eventPreview.venue || "",
                      address: eventPreview.address || "",
                      coordinates: eventPreview.coordinates || null,
                      date: "",
                      time: "",
                      description: "",
                      category: eventPreview.category || "food",
                      languages: [],
                      imageUrl: eventPreview.imageUrl || "",
                      templateEventId: eventPreview.id,
                    });
                    setEventPreview(null);
                    setShowCreateEventModal(true);
                    setCreateEventStep(1);
                  }}
                >
                  ✨ Create Your Own Event
                </button>
              ) : (
                // Regular event - show "Join Event" button
                <button
                  style={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                    color: "white",
                    border: "none",
                    borderRadius: 14,
                    padding: 16,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(88,204,2,0.28)",
                  }}
                  onClick={() => {
                    onJoinPublicEvent && onJoinPublicEvent(eventPreview);
                    setEventPreview(null);
                  }}
                >
                  🎉 Join This Event
                </button>
              )}
              <button
                style={{
                  padding: "16px 24px",
                  background: theme.bg,
                  color: theme.text,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 14,
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: "pointer",
                }}
                onClick={() => setEventPreview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }} onClick={() => {
          setShowCalendar(false);
          setSelectedDate(null);
        }}>
          <div style={{
            background: theme.card,
            borderRadius: 16,
            padding: 20,
            maxWidth: 500,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Calendar Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: theme.text,
                }}
              >
                ◀
              </button>
              <div style={{
                fontSize: 20,
                fontWeight: 900,
                color: theme.gold,
              }}>
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: theme.text,
                }}
              >
                ▶
              </button>
            </div>

            {/* Day Labels */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={{
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  color: theme.textMuted,
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
              marginBottom: 20,
            }}>
              {generateCalendar(currentYear, currentMonth).flat().map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} />;
                }
                
                const date = new Date(currentYear, currentMonth, day);
                const dateStr = getLocalDateString(date); // Use local timezone
                const eventsOnDay = joinedEvents.filter(event => {
                  if (!event.date) return false;
                  // Normalize event date to YYYY-MM-DD format for comparison
                  const eventDateStr = event.date.includes('T') 
                    ? event.date.split('T')[0] 
                    : event.date;
                  return eventDateStr === dateStr;
                });
                const hasEvents = eventsOnDay.length > 0;
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: "12px 8px",
                      background: isSelected ? theme.primary : isToday ? theme.gold : hasEvents ? theme.accent : "transparent",
                      color: isSelected || isToday || hasEvents ? "white" : theme.text,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: hasEvents || isToday || isSelected ? 900 : 600,
                      fontSize: 14,
                      position: "relative",
                    }}
                  >
                    {day}
                    {hasEvents && !isSelected && (
                      <div style={{
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: isToday ? "white" : theme.primary,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
              <div style={{
                background: theme.bg,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: theme.text,
                  marginBottom: 12,
                }}>
                  📅 {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                {(() => {
                  const events = getEventsForDate(selectedDate);
                  if (events.length === 0) {
                    return (
                      <div style={{
                        fontSize: 14,
                        color: theme.textMuted,
                        fontStyle: "italic",
                      }}>
                        No events on this day
                      </div>
                    );
                  }
                  return events.map((event, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowCalendar(false);
                        onJoinedEventClick && onJoinedEventClick(event);
                      }}
                      style={{
                        background: "white",
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 8,
                        cursor: "pointer",
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <div style={{
                        fontWeight: 800,
                        fontSize: 15,
                        color: theme.text,
                        marginBottom: 4,
                      }}>
                        {event.name}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textMuted }}>
                        ⏰ {event.time}
                      </div>
                      {event.venue && (
                        <div style={{ fontSize: 13, color: theme.textMuted }}>
                          📍 {event.venue}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setShowCalendar(false);
                setSelectedDate(null);
              }}
              style={{
                width: "100%",
                padding: 14,
                background: theme.bg,
                color: theme.text,
                border: `2px solid ${theme.border}`,
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Bottom Navigation Bar - Frimake Style */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: theme.card,
        borderTop: `1px solid ${theme.bg}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0 12px",
        zIndex: 1000,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
      }}>
        <button
          onClick={() => {
            setActiveBottomTab("events");
            setViewMode("my");
            setActiveTab("featured");
            setShowExplore(false);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: activeBottomTab === "events" ? theme.primary : theme.textMuted,
          }}
        >
          <div style={{ fontSize: 24 }}>🏠</div>
          <div style={{ fontSize: 11, fontWeight: activeBottomTab === "events" ? 700 : 600 }}>
            Home
          </div>
        </button>

        <button
          onClick={() => {
            setActiveBottomTab("explore");
            setShowExplore(true);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: activeBottomTab === "explore" ? theme.primary : theme.textMuted,
          }}
        >
          <div style={{ fontSize: 24 }}>🔄</div>
          <div style={{ fontSize: 11, fontWeight: activeBottomTab === "explore" ? 700 : 600 }}>
            Explore
          </div>
        </button>

        <button
          onClick={() => setShowCreateEventModal(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
            border: "none",
            cursor: "pointer",
            fontSize: 28,
            color: "white",
            boxShadow: "0 6px 20px rgba(88,204,2,0.35)",
            transform: "translateY(-8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>

        <button
          onClick={() => {
            setActiveBottomTab("calendar");
            setShowCalendar(true);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: activeBottomTab === "calendar" ? theme.primary : theme.textMuted,
          }}
        >
          <div style={{ fontSize: 24 }}>📅</div>
          <div style={{ fontSize: 11, fontWeight: activeBottomTab === "calendar" ? 700 : 600 }}>
            Calendar
          </div>
        </button>

        <button
          onClick={() => {
            setActiveBottomTab("friends");
            setViewMode("friends");
            setActiveTab("featured");
            setShowExplore(false);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: activeBottomTab === "friends" ? theme.primary : theme.textMuted,
          }}
        >
          <div style={{ fontSize: 24 }}>👥</div>
          <div style={{ fontSize: 11, fontWeight: activeBottomTab === "friends" ? 700 : 600 }}>
            Friends
          </div>
        </button>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSearchModal(false)}>
          <div style={{...styles.modal, maxWidth: 400}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: theme.text }}>
              🔍 Search Events
            </h3>
            <input
              type="text"
              placeholder="Search by event name..."
              value={exploreSearchQuery}
              onChange={(e) => setExploreSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                fontSize: 14,
                marginBottom: 16,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                style={{...styles.primaryBtn, flex: 1}}
                onClick={() => setShowSearchModal(false)}
              >
                Apply
              </button>
              <button 
                style={{...styles.cancelButton, flex: 1}}
                onClick={() => {
                  setExploreSearchQuery("");
                  setShowSearchModal(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Where Modal */}
      {showWhereModal && (
        <div style={styles.modalOverlay} onClick={() => setShowWhereModal(false)}>
          <div style={{...styles.modal, maxWidth: 400}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: theme.text }}>
              📍 Filter by Location
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => {
                  setExploreLocationFilter("all");
                  setShowWhereModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreLocationFilter === "all" ? theme.primary : theme.border}`,
                  background: exploreLocationFilter === "all" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreLocationFilter === "all" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🌍 All Locations
              </button>
              <button
                onClick={() => {
                  setExploreLocationFilter("Cité");
                  setShowWhereModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreLocationFilter === "Cité" ? theme.primary : theme.border}`,
                  background: exploreLocationFilter === "Cité" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreLocationFilter === "Cité" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🏠 Cité
              </button>
              <button
                onClick={() => {
                  setExploreLocationFilter("Paris");
                  setShowWhereModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreLocationFilter === "Paris" ? theme.primary : theme.border}`,
                  background: exploreLocationFilter === "Paris" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreLocationFilter === "Paris" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🗼 Paris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* When Modal */}
      {showWhenModal && (
        <div style={styles.modalOverlay} onClick={() => setShowWhenModal(false)}>
          <div style={{...styles.modal, maxWidth: 400}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: theme.text }}>
              📅 Filter by Date
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => {
                  setExploreTimeFilter("upcoming");
                  setShowWhenModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreTimeFilter === "upcoming" ? theme.gold : theme.border}`,
                  background: exploreTimeFilter === "upcoming" ? theme.gold : theme.card,
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                📅 Upcoming
              </button>
              <button
                onClick={() => {
                  setExploreTimeFilter("today");
                  setShowWhenModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreTimeFilter === "today" ? theme.gold : theme.border}`,
                  background: exploreTimeFilter === "today" ? theme.gold : theme.card,
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                📅 Today
              </button>
              <button
                onClick={() => {
                  setExploreTimeFilter("tomorrow");
                  setShowWhenModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreTimeFilter === "tomorrow" ? theme.gold : theme.border}`,
                  background: exploreTimeFilter === "tomorrow" ? theme.gold : theme.card,
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                📅 Tomorrow
              </button>
              <button
                onClick={() => {
                  setExploreTimeFilter("weekend");
                  setShowWhenModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreTimeFilter === "weekend" ? theme.gold : theme.border}`,
                  background: exploreTimeFilter === "weekend" ? theme.gold : theme.card,
                  color: theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                📅 Weekend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal (Category) */}
      {showFiltersModal && (
        <div style={styles.modalOverlay} onClick={() => setShowFiltersModal(false)}>
          <div style={{...styles.modal, maxWidth: 400}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, color: theme.text }}>
              ⚙️ Filter by Category
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => {
                  setExploreCategoryFilter("all");
                  setShowFiltersModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreCategoryFilter === "all" ? theme.primary : theme.border}`,
                  background: exploreCategoryFilter === "all" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreCategoryFilter === "all" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🌟 All Categories
              </button>
              <button
                onClick={() => {
                  setExploreCategoryFilter("food");
                  setShowFiltersModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreCategoryFilter === "food" ? theme.primary : theme.border}`,
                  background: exploreCategoryFilter === "food" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreCategoryFilter === "food" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🍽️ Food
              </button>
              <button
                onClick={() => {
                  setExploreCategoryFilter("drinks");
                  setShowFiltersModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreCategoryFilter === "drinks" ? theme.primary : theme.border}`,
                  background: exploreCategoryFilter === "drinks" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreCategoryFilter === "drinks" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🍹 Drinks
              </button>
              <button
                onClick={() => {
                  setExploreCategoryFilter("sports");
                  setShowFiltersModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreCategoryFilter === "sports" ? theme.primary : theme.border}`,
                  background: exploreCategoryFilter === "sports" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreCategoryFilter === "sports" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ⚽ Sports
              </button>
              <button
                onClick={() => {
                  setExploreCategoryFilter("culture");
                  setShowFiltersModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreCategoryFilter === "culture" ? theme.primary : theme.border}`,
                  background: exploreCategoryFilter === "culture" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreCategoryFilter === "culture" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🎭 Culture
              </button>
              <button
                onClick={() => {
                  setExploreCategoryFilter("party");
                  setShowFiltersModal(false);
                }}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: `2px solid ${exploreCategoryFilter === "party" ? theme.primary : theme.border}`,
                  background: exploreCategoryFilter === "party" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                  color: exploreCategoryFilter === "party" ? "white" : theme.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🎉 Party
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialHome;