import React, { useState, useEffect } from "react";
import users from "./users";
import LocationPicker from "./LocationPicker";
import * as api from "./api";

// Default places for event creation
const defaultPlaces = {
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

export default function AdminAssign({ searches, pendingRequests, onAssignEvent, userEvents, onRemoveJoinedEvent, onAddPendingRequests }) {
  // Debug: show pendingRequests
  console.log("[DEBUG] pendingRequests:", pendingRequests);
  
  // Manage places with state - load from localStorage
  const [places, setPlaces] = useState(() => {
    const saved = localStorage.getItem("adminPlaces");
    return saved ? JSON.parse(saved) : defaultPlaces;
  });
  
  // Save places to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("adminPlaces", JSON.stringify(places));
  }, [places]);
  
  // Manage events list with state - load from API
  const [events, setEvents] = useState([]);

  // Proposed events (auto-generated, not published yet)
  const [proposals, setProposals] = useState(() => {
    const saved = localStorage.getItem("proposedEvents");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem("proposedEvents", JSON.stringify(proposals));
  }, [proposals]);
  const [editProposalIdx, setEditProposalIdx] = useState(null);
  const [editProposal, setEditProposal] = useState(null);
  
  // Load events from API on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const allEvents = await api.getAllEvents();
        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };
    loadEvents();
  }, []);
  
  const [selectedIdx, setSelectedIdx] = useState(null);
  // Only keep one selectedEvent state for event modal
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedEventForModal, setSelectedEventForModal] = useState(null); // For viewing event details
  const [selectedProposalForModal, setSelectedProposalForModal] = useState(null); // For viewing auto‑proposal details
  const [removedBots, setRemovedBots] = useState(() => {
    try {
      const raw = localStorage.getItem('removedBots');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  const [selectedEventId, setSelectedEventId] = useState(""); // For assignment dropdown
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestDetailIdx, setRequestDetailIdx] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false); // Toggle for showing all events vs suggested
  // Invitations state
  const [invites, setInvites] = useState(() => {
    try {
      const raw = localStorage.getItem('lemi_invites');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('lemi_invites', JSON.stringify(invites)); } catch {}
  }, [invites]);
  
  // Create Event state
  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    location: "Cité",
    venue: "",
    address: "",
    coordinates: null,
    date: "",
    time: "",
    category: "food",
    languages: [], // Array of languages for exchange
    description: "",
    imageUrl: "", // Image URL for the event
    isPublic: true, // Default to public events
  });

  // Create Place state
  const [createPlaceForm, setCreatePlaceForm] = useState({
    name: "",
    location: "Cité",
    description: "",
  });

  // Function to add a new place
  const handleAddPlace = () => {
    if (!createPlaceForm.name.trim()) {
      alert("Please enter a place name");
      return;
    }
    
    const newPlace = {
      id: `${createPlaceForm.location.toLowerCase()}-${Date.now()}`,
      name: createPlaceForm.name,
      description: createPlaceForm.description || "Custom location",
    };
    
    setPlaces(prev => ({
      ...prev,
      [createPlaceForm.location]: [...prev[createPlaceForm.location], newPlace]
    }));
    
    // Reset form
    setCreatePlaceForm({
      name: "",
      location: "Cité",
      description: "",
    });
    
    alert("Place added successfully!");
  };

  // Function to delete a place
  const handleDeletePlace = (location, placeId) => {
    if (window.confirm("Are you sure you want to delete this place?")) {
      setPlaces(prev => ({
        ...prev,
        [location]: prev[location].filter(place => place.id !== placeId)
      }));
    }
  };

  // --- Auto-group pending requests into proposed events ---
  const THRESHOLD = 4;
  const WINDOW_HOURS = 48;
  const withinWindow = (ts) => !ts ? false : (Date.now() - ts) <= WINDOW_HOURS * 3600 * 1000;
  const norm = (v) => (v || "").toString().trim().toLowerCase();
  const bucketTimeOfDay = (tod) => {
    const t = norm(tod);
    if (t === "evening" || t === "night") return "evening"; // relax a bit
    if (["morning","afternoon","evening","night"].includes(t)) return t;
    return "";
  };
  const groupKey = (req) => {
    const ev = req?.event || {};
    const location = norm(ev.location || ev.place);
    const category = norm(ev.category);
    const tod = bucketTimeOfDay(ev.timeOfDay);
    let language = norm(ev.language);
    if (!language) language = "any";
    return [location, category, tod, language].join("|");
  };
  const chooseLanguage = (members) => {
    const counts = {};
    members.forEach(r => {
      const lang = norm(r.event?.language) || "any";
      counts[lang] = (counts[lang] || 0) + 1;
    });
    // prefer specific language over any
    let best = null, bestCount = -1;
    Object.entries(counts).forEach(([lang, c]) => {
      if (lang === "any") return;
      if (c > bestCount) { best = lang; bestCount = c; }
    });
    if (best) return best;
    return counts["any"] ? "any" : null;
  };
  const pickPlaceFor = (loc) => {
    const list = places[loc] || places[capitalize(loc)] || [];
    return list[0]?.name || "";
  };
  const capitalize = (s) => (s && s[0] ? s[0].toUpperCase() + s.slice(1) : s);
  const timeFor = (timePreference, timeOfDay) => {
    // Very simple mapping: choose next day(s) based on preference
    const now = new Date();
    const tPref = norm(timePreference);
    const tod = bucketTimeOfDay(timeOfDay) || "afternoon";
    const setTod = (d) => {
      const hh = tod === "morning" ? 10 : tod === "afternoon" ? 16 : tod === "evening" ? 20 : 21;
      d.setHours(hh, 0, 0, 0);
    };
    const dt = new Date(now);
    if (tPref === "saturday" || tPref === "sunday") {
      const target = tPref === "saturday" ? 6 : 0; // 0=Sun,6=Sat
      while (dt.getDay() !== target) dt.setDate(dt.getDate() + 1);
      setTod(dt);
    } else if (tPref === "this-weekend") {
      // go to next Saturday
      while (dt.getDay() !== 6) dt.setDate(dt.getDate() + 1);
      setTod(dt);
    } else if (tPref === "next-week") {
      dt.setDate(dt.getDate() + 7);
      setTod(dt);
    } else {
      // this-week / flexible
      dt.setDate(dt.getDate() + 2);
      setTod(dt);
    }
    const date = dt.toISOString().slice(0,10);
    const time = dt.toTimeString().slice(0,5);
    return { date, time };
  };
  const buildProposalFromGroup = (members, key) => {
    const sample = members[0];
    const ev = sample.event || {};
    const location = ev.location || ev.place || "Cité";
    const category = ev.category || "drinks";
    const tod = ev.timeOfDay || "evening";
    const langChosen = chooseLanguage(members);
    const { date, time } = timeFor(ev.timePreference, ev.timeOfDay);
    const name = `${category === 'drinks' ? 'Drinks' : capitalize(category)}${langChosen && langChosen !== 'any' ? ' · ' + capitalize(langChosen) : ''}`;
    const place = pickPlaceFor(location) || ev.place || "";
    return {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      name,
      location,
      place,
      date,
      time,
      category,
      languages: langChosen && langChosen !== 'any' ? [capitalize(langChosen)] : [],
      isPublic: false,
      proposed: true,
      participants: members.map(r => (typeof r.user === 'object' ? (r.user.username || r.user.name) : r.user)),
      matchDetails: { key, size: members.length, timeOfDay: tod },
    };
  };

  useEffect(() => {
    // Build groups from fresh pending requests
    const nowGroups = {};
    const fresh = (pendingRequests || []).filter(r => (r.stage || 2) < 3 && withinWindow(r.createdAt || (Array.isArray(r.history) && r.history[0]?.ts)));
    fresh.forEach(r => {
      const k = groupKey(r);
      if (!nowGroups[k]) nowGroups[k] = [];
      nowGroups[k].push(r);
    });
    const existingKeys = new Set((proposals || []).map(p => p.matchDetails?.key));
    const newOnes = [];
    Object.entries(nowGroups).forEach(([k, members]) => {
      if (members.length >= THRESHOLD && !existingKeys.has(k)) {
        newOnes.push(buildProposalFromGroup(members, k));
      }
    });
    if (newOnes.length > 0) {
      setProposals(prev => [...prev, ...newOnes]);
    }
  // We intentionally exclude proposals and function deps to avoid regenerating on each render.
  // This effect runs when pendingRequests changes, which is the intended trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRequests]);


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
  
  // Handle event removal (bots-only events are removable)
  const handleRemoveEvent = (eventId) => {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    
    if (window.confirm(`Are you sure you want to remove "${ev.name}"? This will remove it for all users.`)) {
      // Remove from local state
      setEvents(events.filter(ev => ev.id !== eventId));
      
      // Remove from adminEvents localStorage
      const saved = localStorage.getItem("adminEvents");
      if (saved) {
        const adminEvents = JSON.parse(saved);
        const filtered = adminEvents.filter(e => e.id !== eventId);
        localStorage.setItem("adminEvents", JSON.stringify(filtered));
      }
      
      // Remove from all users' joined events in localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("joinedEvents_")) {
          const joinedEvents = JSON.parse(localStorage.getItem(key) || "[]");
          const filtered = joinedEvents.filter(e => e.id !== eventId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      });
      
      logAdminActivity(`Removed event: ${ev.name} (ID: ${eventId})`);
      
      // Close modal if it's open for this event
      if (selectedEventForModal && selectedEventForModal.id === eventId) {
        setSelectedEventForModal(null);
      }
      
      alert(`✅ Event "${ev.name}" has been removed successfully!`);
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

  const isMobile = window.innerWidth <= 600;

  const styles = {
    container: {
      position: "relative",
      minHeight: "100vh",
      background: theme.bg,
      padding: isMobile ? 12 : 24,
      maxWidth: 680,
      margin: "0 auto",
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },
    title: {
      fontSize: isMobile ? 18 : 24,
      fontWeight: 900,
      marginBottom: isMobile ? 12 : 18,
      textAlign: "center",
      color: theme.primary,
      letterSpacing: "-0.2px",
    },
    tabs: {
      display: isMobile ? "flex" : "grid",
      gridTemplateColumns: isMobile ? "none" : "repeat(9, 1fr)",
      gap: isMobile ? 6 : 8,
      marginBottom: isMobile ? 12 : 18,
      overflowX: isMobile ? "auto" : "visible",
      flexWrap: isMobile ? "nowrap" : "wrap",
      WebkitOverflowScrolling: "touch",
    },
    tabBtn: (active) => ({
      padding: isMobile ? 10 : 12,
      fontWeight: 900,
      fontSize: isMobile ? 12 : 14,
      background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
      color: active ? "white" : theme.text,
      border: `1px solid ${active ? theme.primary : theme.border}`,
      borderRadius: 14,
      cursor: "pointer",
      boxShadow: active ? "0 6px 16px rgba(88,204,2,0.28)" : "0 1px 3px rgba(0,0,0,0.06)",
      whiteSpace: "nowrap",
      flexShrink: 0,
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
      padding: isMobile ? 12 : 16,
      borderRadius: isMobile ? 14 : theme.radius,
      marginBottom: isMobile ? 10 : 12,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
    },
    itemRow: {
      background: theme.card,
      borderRadius: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: isMobile ? 12 : 16,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: isMobile ? 13 : 15,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      flexWrap: isMobile ? "wrap" : "nowrap",
      gap: isMobile ? 8 : 0,
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
    pill: {
      background: theme.card,
      border: `2px solid ${theme.border}`,
      borderRadius: 12,
      padding: "8px 14px",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 14,
      color: theme.text,
      transition: "all 0.2s ease",
    },
    pillSelected: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      border: `2px solid ${theme.primary}`,
      color: "white",
      boxShadow: "0 4px 12px rgba(88,204,2,0.25)",
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

  // Real users vs bots helpers and removal safeguards
  const REAL_USERS = new Set(["mitsu", "zine", "admin"]);
  const isRealUserKey = (key) => {
    if (!key) return false;
    const k = String(key).toLowerCase();
    if (REAL_USERS.has(k)) return true;
    const u = users.find(uu => (uu.username || uu.name || '').toLowerCase() === k);
    return !!u?.isReal;
  };
  const removedBotSet = new Set(removedBots.map(x => String(x).toLowerCase()));

  // Include dynamically registered users (from localStorage profiles)
  const dynamicUsers = (() => {
    try {
      const keys = Object.keys(localStorage || {});
      const profKeys = keys.filter(k => k.startsWith('userProfile_'));
      const list = [];
      profKeys.forEach(k => {
        try {
          const username = k.replace('userProfile_', '');
          const raw = localStorage.getItem(k);
          const prof = raw ? JSON.parse(raw) : null;
          if (!username) return;
          // Avoid adding built-in admin and default real users twice
          const lower = String(username).toLowerCase();
          if (["admin","mitsu","zine"].includes(lower)) return;
          list.push({
            id: `dyn-${username}`,
            name: (prof && prof.name) || username,
            username,
            emoji: (prof && prof.emoji) || "🙂",
            country: (prof && prof.country) || undefined,
            desc: (prof && prof.desc) || "No description.",
            city: (prof && prof.city) || undefined,
            languages: (prof && Array.isArray(prof.languages) ? prof.languages : []),
            isReal: true,
          });
        } catch {}
      });
      return list;
    } catch { return []; }
  })();

  // Merge static users with dynamic profiles, dedupe by username/name
  const allUsersCombined = (() => {
    const map = new Map();
    users.forEach(u => {
      const key = (u.username || u.name || '').toLowerCase();
      if (!key) return;
      map.set(key, u);
    });
    dynamicUsers.forEach(u => {
      const key = (u.username || u.name || '').toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, u);
    });
    return Array.from(map.values());
  })();

  const visibleUsers = allUsersCombined.filter(u => !removedBotSet.has((u.username || u.name || '').toLowerCase()));

  const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
        <img 
          src={`${API_URL}/static/assets/logo.png`} 
          alt="Lemi Logo" 
          style={{ width: 50, height: 50, objectFit: 'contain' }}
        />
        <div style={styles.title}>Lemi Admin Dashboard</div>
      </div>
      <div style={styles.tabs}>
        <button style={styles.tabBtn(activeTab === "requests")} onClick={() => setActiveTab("requests")}>Pending Requests</button>
        <button style={styles.tabBtn(activeTab === "proposals")} onClick={() => setActiveTab("proposals")}>Auto‑Proposals</button>
        <button style={styles.tabBtn(activeTab === "users")} onClick={() => setActiveTab("users")}>All Users</button>
        <button style={styles.tabBtn(activeTab === "events")} onClick={() => setActiveTab("events")}>All Events</button>
        <button style={styles.tabBtn(activeTab === "create")} onClick={() => setActiveTab("create")}>Create Event</button>
        <button style={styles.tabBtn(activeTab === "places")} onClick={() => setActiveTab("places")}>Manage Places</button>
        <button style={styles.tabBtn(activeTab === "joined")} onClick={() => setActiveTab("joined")}>Joined Events</button>
        <button style={styles.tabBtn(activeTab === "faker")} onClick={() => setActiveTab("faker")}>Test Tools</button>
        <button style={styles.tabBtn(activeTab === "invites")} onClick={() => setActiveTab("invites")}>Invitations</button>
      </div>
      {activeTab === "faker" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🧪 Test Data Generator</div>
          <div style={{ ...styles.card, display: 'grid', gap: 10 }}>
            <button
              style={styles.primaryBtn}
              onClick={() => {
                const now = Date.now();
                const mk = (name) => ({
                  user: name,
                  event: { location: 'Cité', category: 'drinks', timeOfDay: 'evening', timePreference: 'this-weekend', language: 'French' },
                  createdAt: now,
                  stage: 2,
                  history: [{ stage: 1, ts: now }, { stage: 2, ts: now }],
                });
                const batch = ['Alice', 'Bob', 'Charlie', 'Diana'].map(mk);
                onAddPendingRequests && onAddPendingRequests(batch);
                alert('Generated 4 matching requests (Cité · drinks · evening · French · this-weekend). Check Auto‑Proposals.');
              }}
            >Generate 4 matching requests</button>

            <button
              style={styles.accentBtn}
              onClick={() => {
                const now = Date.now();
                const reqs = [
                  { user: 'Eve', event: { location: 'Cité', category: 'drinks', timeOfDay: 'evening', timePreference: 'this-week', language: 'any' } },
                  { user: 'Frank', event: { location: 'Cité', category: 'drinks', timeOfDay: 'evening', timePreference: 'this-week', language: 'French' } },
                  { user: 'Grace', event: { location: 'Paris', category: 'walk', timeOfDay: 'afternoon', timePreference: 'saturday', language: 'English' } },
                  { user: 'Heidi', event: { location: 'Paris', category: 'walk', timeOfDay: 'afternoon', timePreference: 'saturday', language: 'English' } },
                  { user: 'Ivan', event: { location: 'Paris', category: 'walk', timeOfDay: 'afternoon', timePreference: 'saturday', language: 'English' } },
                ].map(r => ({ ...r, createdAt: now, stage: 2, history: [{ stage: 1, ts: now }, { stage: 2, ts: now }] }));
                onAddPendingRequests && onAddPendingRequests(reqs);
                alert('Generated a mixed set including a 3‑person group for Paris · walk · afternoon · English. Add one more to reach 4.');
              }}
            >Generate mixed set</button>

            <button
              style={styles.dangerBtn}
              onClick={() => {
                if (!window.confirm('Clear ALL pending requests?')) return;
                onAddPendingRequests && onAddPendingRequests([],'clear');
              }}
            >Clear all pending</button>
          </div>
          <div style={{ ...styles.card, color: '#6B7280', fontSize: 13 }}>
            Tips:
            <ul>
              <li>Use “Generate 4 matching requests” to immediately trigger a proposal.</li>
              <li>Use “Generate mixed set”, then add one more matching request manually to reach threshold.</li>
              <li>Proposals appear in the Auto‑Proposals tab; click “Publish & Assign” to create the event and assign.</li>
            </ul>
          </div>
        </div>
      )}
      {activeTab === "invites" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🔑 Invitations</div>
          <div style={{ ...styles.card, display: 'grid', gap: 10 }}>
            <InviteCreator onCreate={(codeObj) => setInvites(prev => [codeObj, ...prev])} />
          </div>
          <div style={{ ...styles.card }}>
            <InviteList invites={invites} onUpdate={setInvites} />
          </div>
        </div>
      )}
      {activeTab === "proposals" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>✨ Auto‑Generated Proposals</div>
          {Array.isArray(proposals) && proposals.length > 0 ? (
            <ul style={{ padding: 0 }}>
              {proposals.map((p, i) => (
                <li key={p.id} style={{ ...styles.itemRow, alignItems: 'flex-start' }}>
                  <div
                    style={{ maxWidth: '70%', cursor: 'pointer' }}
                    onClick={() => setSelectedProposalForModal(p)}
                    title="Click to view details"
                  >
                    <div style={{ fontWeight: 900, color: theme.text }}>{p.name}</div>
                    <div style={{ fontSize: 13.5, color: theme.textMuted }}>
                      📍 {p.location}{p.place ? ` · ${p.place}` : ''} · ⏰ {p.date} at {p.time}
                    </div>
                    <div style={{ fontSize: 13.5, color: theme.textMuted }}>
                      🎯 {p.category}{p.languages && p.languages.length ? ` · 🗣️ ${p.languages.join(', ')}` : ''}
                    </div>
                    <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 6 }}>
                      👥 Participants: {Array.isArray(p.participants) ? p.participants.join(', ') : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      style={styles.accentBtn}
                      onClick={() => {
                        setEditProposalIdx(i);
                        // Create an editable copy (avoid mutating original while editing)
                        setEditProposal({
                          name: p.name || '',
                          location: p.location || 'Cité',
                          place: p.place || '',
                          date: p.date || '',
                          time: p.time || '',
                          category: p.category || 'drinks',
                          languages: Array.isArray(p.languages) ? p.languages.slice() : [],
                          description: p.description || '',
                          participants: Array.isArray(p.participants) ? p.participants.slice() : [],
                        });
                      }}
                    >Edit</button>
                    <button
                      style={styles.primaryBtn}
                      onClick={() => {
                        // Publish event then assign to participants
                        const newEvent = {
                          ...p,
                          proposed: false,
                          id: `auto-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
                        };
                        setEvents(prev => [...prev, newEvent]);
                        // Assign to each participant's pending request
                        (p.participants || []).forEach(userKey => {
                          const reqIdx = (pendingRequests || []).findIndex(r => (typeof r.user === 'object' ? (r.user.username || r.user.name) : r.user) === userKey && (r.stage || 2) < 3);
                          if (reqIdx >= 0 && onAssignEvent) {
                            onAssignEvent(reqIdx, newEvent.id, newEvent);
                          }
                        });
                        // remove proposal
                        setProposals(prev => prev.filter(pp => pp.id !== p.id));
                        alert('Published and assigned successfully.');
                      }}
                    >Publish & Assign</button>
                    <button
                      style={styles.dangerBtn}
                      onClick={() => setProposals(prev => prev.filter(pp => pp.id !== p.id))}
                    >Discard</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ ...styles.card, color: theme.textMuted }}>No proposals yet. They’ll appear automatically when 4 similar requests are received within 48 hours.</div>
          )}
        </div>
      )}

      {/* Proposal Details Modal */}
      {selectedProposalForModal && (
        <div style={styles.modalOverlay} onClick={() => setSelectedProposalForModal(null)}>
          <div style={{ ...styles.modal, maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, color: theme.primary }}>✨ Proposed Event</div>
            <div style={{ fontSize: 16, marginBottom: 4 }}><b>Name:</b> {String(selectedProposalForModal.name || '')}</div>
            <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}>
              <b>When:</b> {String(selectedProposalForModal.date || '')} at {String(selectedProposalForModal.time || '')}
            </div>
            <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}>
              <b>Where:</b> {String(selectedProposalForModal.location || '')}{selectedProposalForModal.place ? ` · ${String(selectedProposalForModal.place)}` : ''}
            </div>
            <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 4 }}>
              <b>Category:</b> {String(selectedProposalForModal.category || '')}
              {Array.isArray(selectedProposalForModal.languages) && selectedProposalForModal.languages.length > 0 && (
                <> · <b>Languages:</b> {selectedProposalForModal.languages.join(', ')}</>
              )}
            </div>
            {selectedProposalForModal.description && (
              <div style={{ fontSize: 15, color: theme.textMuted, marginBottom: 8 }}>
                <b>Description:</b> {String(selectedProposalForModal.description)}
              </div>
            )}
            {selectedProposalForModal.matchDetails && (
              <div style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 12 }}>
                <b>Auto-group:</b> {String(selectedProposalForModal.matchDetails.timeOfDay || '')} · size {String(selectedProposalForModal.matchDetails.size || '')}
              </div>
            )}

            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 10, marginBottom: 8, color: theme.accent }}>👥 Participants</div>
            {Array.isArray(selectedProposalForModal.participants) && selectedProposalForModal.participants.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedProposalForModal.participants.map((u, idx) => {
                  const label = typeof u === 'object' ? (u.name || u.username || JSON.stringify(u)) : String(u);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const found = users.find(uu => uu.name === label || uu.username === label);
                        if (found) setSelectedUser(found);
                        else setSelectedUser({ name: label, languages: [], desc: 'No profile info available' });
                      }}
                      style={{
                        border: `1px solid ${theme.border}`,
                        background: '#F9FAFB',
                        color: theme.text,
                        borderRadius: 999,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                      title={`View ${label}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: theme.textMuted }}>(no participants)</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button style={styles.accentBtn} onClick={() => setSelectedProposalForModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Proposal Modal */}
      {editProposal && editProposalIdx !== null && (
        <div style={styles.modalOverlay} onClick={() => { setEditProposal(null); setEditProposalIdx(null); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: theme.accent, marginBottom: 10 }}>Edit Proposal</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Event Name</label>
                <input
                  type="text"
                  value={editProposal.name}
                  onChange={(e) => setEditProposal(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Location</label>
                  <select
                    value={editProposal.location}
                    onChange={(e) => {
                      const newLoc = e.target.value;
                      const firstPlace = (places[newLoc] && places[newLoc][0]?.name) || '';
                      setEditProposal(prev => ({ ...prev, location: newLoc, place: firstPlace }));
                    }}
                    style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                  >
                    {Object.keys(places).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Place</label>
                  <select
                    value={editProposal.place}
                    onChange={(e) => setEditProposal(prev => ({ ...prev, place: e.target.value }))}
                    style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                  >
                    {(places[editProposal.location] || []).map(pl => (
                      <option key={pl.id} value={pl.name}>{pl.name}</option>
                    ))}
                    {!((places[editProposal.location] || []).length) && (
                      <option value="">(no places)</option>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Date</label>
                  <input
                    type="date"
                    value={editProposal.date}
                    onChange={(e) => setEditProposal(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Time</label>
                  <input
                    type="time"
                    value={editProposal.time}
                    onChange={(e) => setEditProposal(prev => ({ ...prev, time: e.target.value }))}
                    style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Category</label>
                  <select
                    value={editProposal.category}
                    onChange={(e) => setEditProposal(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                  >
                    <option value="food">food</option>
                    <option value="drinks">drinks</option>
                    <option value="party">party</option>
                    <option value="random">random</option>
                    <option value="walk">walk</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Languages (comma‑separated)</label>
                  <input
                    type="text"
                    value={(editProposal.languages || []).join(', ')}
                    onChange={(e) => setEditProposal(prev => ({ ...prev, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="e.g., French, English"
                    style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Description (optional)</label>
                <textarea
                  rows={3}
                  value={editProposal.description}
                  onChange={(e) => setEditProposal(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Participants</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8 }}>
                  {(editProposal.participants || []).length === 0 && (
                    <span style={{ fontSize: 13, color: theme.textMuted }}>(none)</span>
                  )}
                  {(editProposal.participants || []).map(u => (
                    <span key={u} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 10px', borderRadius: 999,
                      background: '#F3F4F6', border: `1px solid ${theme.border}`,
                      fontSize: 13, color: theme.text
                    }}>
                      {u}
                      <button
                        onClick={() => setEditProposal(prev => ({ ...prev, participants: (prev.participants || []).filter(x => x !== u) }))}
                        style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontWeight: 900 }}
                        title="Remove"
                      >×</button>
                    </span>
                  ))}
                </div>
                {(() => {
                  const candidateUsers = Array.from(new Set(
                    (pendingRequests || [])
                      .filter(r => (r.stage || 2) < 3)
                      .map(r => (typeof r.user === 'object' ? (r.user.username || r.user.name) : r.user))
                  )).filter(u => !(editProposal.participants || []).includes(u));
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select
                        value={editProposal.addCandidate || ''}
                        onChange={(e) => setEditProposal(prev => ({ ...prev, addCandidate: e.target.value }))}
                        style={{ flex: 1, padding: 10, border: `1px solid ${theme.border}`, borderRadius: 10 }}
                      >
                        <option value="">Add participant…</option>
                        {candidateUsers.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <button
                        style={styles.accentBtn}
                        onClick={() => {
                          const sel = editProposal.addCandidate;
                          if (!sel) return;
                          if ((editProposal.participants || []).includes(sel)) return;
                          setEditProposal(prev => ({
                            ...prev,
                            participants: [ ...(prev.participants || []), sel ],
                            addCandidate: '',
                          }));
                        }}
                      >Add</button>
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  style={styles.accentBtn}
                  onClick={() => {
                    // Basic validation
                    if (!editProposal.name.trim()) { alert('Please provide an event name'); return; }
                    if (!editProposal.date || !editProposal.time) { alert('Please choose date and time'); return; }
                    setProposals(prev => prev.map((p, idx) => {
                      if (idx !== editProposalIdx) return p;
                      return {
                        ...p,
                        name: editProposal.name,
                        location: editProposal.location,
                        place: editProposal.place,
                        date: editProposal.date,
                        time: editProposal.time,
                        category: editProposal.category,
                        languages: Array.isArray(editProposal.languages) ? editProposal.languages : [],
                        description: editProposal.description,
                        participants: Array.isArray(editProposal.participants) ? editProposal.participants : [],
                      };
                    }));
                    setEditProposal(null);
                    setEditProposalIdx(null);
                  }}
                >Save</button>
                <button
                  style={styles.dangerBtn}
                  onClick={() => { setEditProposal(null); setEditProposalIdx(null); }}
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
                  onClick={() => setCreateEventForm({ ...createEventForm, location: "Cité" })}
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
                  onClick={() => setCreateEventForm({ ...createEventForm, location: "Paris" })}
                >
                  🗼 Paris
                </button>
              </div>
            </div>

            {/* Exact Address/Venue - Required */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                📍 Exact Address <span style={{ color: "#FF4B4B" }}>*</span>
              </label>
              <LocationPicker
                onLocationSelect={(location) => {
                  setCreateEventForm({
                    ...createEventForm,
                    venue: location.name,
                    address: location.address,
                    coordinates: { lat: location.lat, lng: location.lng }
                  });
                }}
                initialAddress={createEventForm.address}
                theme={theme}
              />
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

            {/* Public/Private Toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                Event Visibility
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setCreateEventForm({ ...createEventForm, isPublic: true })}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: `2px solid ${createEventForm.isPublic ? theme.primary : theme.border}`,
                    background: createEventForm.isPublic ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                    color: createEventForm.isPublic ? "white" : theme.text,
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  🌍 Public Event
                </button>
                <button
                  type="button"
                  onClick={() => setCreateEventForm({ ...createEventForm, isPublic: false })}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: `2px solid ${!createEventForm.isPublic ? theme.accent : theme.border}`,
                    background: !createEventForm.isPublic ? `linear-gradient(135deg, ${theme.accent}, #0AA6EB)` : theme.card,
                    color: !createEventForm.isPublic ? "white" : theme.text,
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  🔒 Private Event
                </button>
              </div>
              <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 6, fontStyle: "italic" }}>
                {createEventForm.isPublic 
                  ? "👥 Public events are visible to all users on their homepage and anyone can join."
                  : "🔐 Private events are only for users assigned by admin and won't appear in public listings."
                }
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                Language Exchange {createEventForm.isPublic && <span style={{ color: theme.textMuted, fontWeight: 600, fontSize: 13 }}>(optional)</span>}
                {!createEventForm.isPublic && <span style={{ color: theme.textMuted, fontWeight: 600, fontSize: 13 }}>(select 2-3 languages)</span>}
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>
                🖼️ Event Image <span style={{ color: theme.textMuted, fontWeight: 600, fontSize: 13 }}>(optional)</span>
              </label>
              
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="url"
                  value={createEventForm.imageUrl}
                  onChange={(e) => setCreateEventForm({ ...createEventForm, imageUrl: e.target.value })}
                  placeholder="Paste image URL or upload below"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <label
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: theme.accent,
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  📤 Upload
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Show loading state
                      const formData = new FormData();
                      formData.append("file", file);
                      
                      try {
                        const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/upload-image`, {
                          method: "POST",
                          body: formData,
                        });
                        
                        if (!response.ok) {
                          throw new Error("Upload failed");
                        }
                        
                        const data = await response.json();
                        const fullUrl = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}${data.url}`;
                        setCreateEventForm({ ...createEventForm, imageUrl: fullUrl });
                      } catch (error) {
                        console.error("Error uploading image:", error);
                        alert("Failed to upload image. Please try again.");
                      }
                      
                      // Reset input
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              
              {createEventForm.imageUrl && (
                <div style={{ marginTop: 8, fontSize: 13, color: theme.textMuted }}>
                  Preview:
                  <div style={{ 
                    marginTop: 6, 
                    width: "100%", 
                    height: 150, 
                    borderRadius: 12, 
                    overflow: "hidden",
                    border: `1px solid ${theme.border}`,
                  }}>
                    <img 
                      src={createEventForm.imageUrl} 
                      alt="Event preview" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:13px;">⚠️ Invalid image URL</div>';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              style={{
                ...styles.primaryBtn,
                width: "100%",
                padding: "12px",
                fontSize: 15,
              }}
              onClick={async () => {
                if (!createEventForm.name || !createEventForm.date || !createEventForm.time) {
                  alert("Please fill in all required fields: Event Name, Date, and Time");
                  return;
                }
                if (!createEventForm.address || !createEventForm.coordinates) {
                  alert("Please provide an exact address using the location picker");
                  return;
                }
                // Language selection is required for private events, optional for public events
                if (!createEventForm.isPublic && createEventForm.languages.length < 2) {
                  alert("Please select at least 2 languages for the language exchange (required for private events)");
                  return;
                }
                logAdminActivity(`Created new event: ${createEventForm.name} at ${createEventForm.address}`);
                
                // Create new event object
                const newEvent = {
                  name: createEventForm.name,
                  location: createEventForm.location,
                  venue: createEventForm.venue,
                  address: createEventForm.address,
                  coordinates: createEventForm.coordinates,
                  date: createEventForm.date,
                  time: createEventForm.time,
                  category: createEventForm.category,
                  languages: createEventForm.languages,
                  description: createEventForm.description,
                  image_url: createEventForm.imageUrl,
                  is_public: createEventForm.isPublic,
                  event_type: "custom", // Mark as admin-created
                  capacity: null, // No capacity limit for admin events
                  created_by: "admin"
                };
                
                // Create event via API
                try {
                  await api.createEvent(newEvent);
                  // Refresh events list
                  const allEvents = await api.getAllEvents();
                  setEvents(allEvents);
                } catch (error) {
                  console.error("Failed to create event:", error);
                  alert("Failed to create event. Please try again.");
                  return;
                }
                
                const languagesText = createEventForm.languages.length > 0 
                  ? `Languages: ${createEventForm.languages.join(" ↔ ")}` 
                  : "Languages: None specified";
                
                alert(`Event "${createEventForm.name}" created successfully!\n\nVisibility: ${createEventForm.isPublic ? "🌍 Public" : "🔒 Private"}\nLocation: ${createEventForm.location}\nVenue: ${createEventForm.venue}\nAddress: ${createEventForm.address}\nDate: ${createEventForm.date}\nTime: ${createEventForm.time}\n${languagesText}`);
                
                // Reset form
                setCreateEventForm({
                  name: "",
                  location: "Cité",
                  venue: "",
                  address: "",
                  coordinates: null,
                  date: "",
                  time: "",
                  category: "food",
                  languages: [],
                  description: "",
                  imageUrl: "",
                  isPublic: true, // Reset to default public
                });
                
                // Switch to "All Events" tab to show the newly created event
                setActiveTab("events");
              }}
            >
              ✨ Create Event
            </button>
          </div>
        </div>
      )}

      {activeTab === "places" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📍 Manage Places</div>
          
          {/* Add New Place Form */}
          <div style={{ ...styles.card, marginBottom: 24, background: "linear-gradient(135deg, #F0F9FF, #E0F2FE)" }}>
            <h3 style={{ margin: "0 0 16px 0", color: theme.text, fontSize: 18, fontWeight: 800 }}>➕ Add New Place</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Location Type</label>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: `2px solid ${createPlaceForm.location === "Cité" ? theme.primary : theme.border}`,
                    background: createPlaceForm.location === "Cité" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                    color: createPlaceForm.location === "Cité" ? "white" : theme.text,
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                  onClick={() => setCreatePlaceForm({ ...createPlaceForm, location: "Cité" })}
                >
                  🏛️ Cité
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: `2px solid ${createPlaceForm.location === "Paris" ? theme.primary : theme.border}`,
                    background: createPlaceForm.location === "Paris" ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.card,
                    color: createPlaceForm.location === "Paris" ? "white" : theme.text,
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                  onClick={() => setCreatePlaceForm({ ...createPlaceForm, location: "Paris" })}
                >
                  🗼 Paris
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Place Name</label>
              <input
                type="text"
                value={createPlaceForm.name}
                onChange={(e) => setCreatePlaceForm({ ...createPlaceForm, name: e.target.value })}
                placeholder="e.g., 🎵 Music Room, 🍕 Pizza Place"
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
              <label style={{ display: "block", fontWeight: 800, color: theme.text, marginBottom: 6 }}>Description</label>
              <input
                type="text"
                value={createPlaceForm.description}
                onChange={(e) => setCreatePlaceForm({ ...createPlaceForm, description: e.target.value })}
                placeholder="Brief description of the place"
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

            <button
              onClick={handleAddPlace}
              style={{
                width: "100%",
                padding: "14px 22px",
                fontSize: 16,
                fontWeight: 900,
                color: "white",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                border: "none",
                borderRadius: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: theme.shadowSoft,
              }}
            >
              ➕ Add Place
            </button>
          </div>

          {/* List of Places by Location */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px 0", color: theme.text, fontSize: 18, fontWeight: 800 }}>🏛️ Cité Places</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {places.Cité.map((place) => (
                <div key={place.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: theme.text, marginBottom: 4 }}>{place.name}</div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>{place.description}</div>
                  </div>
                  <button
                    onClick={() => handleDeletePlace("Cité", place.id)}
                    style={{
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "white",
                      background: "#EF4444",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ margin: "0 0 12px 0", color: theme.text, fontSize: 18, fontWeight: 800 }}>🗼 Paris Places</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {places.Paris.map((place) => (
                <div key={place.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: theme.text, marginBottom: 4 }}>{place.name}</div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>{place.description}</div>
                  </div>
                  <button
                    onClick={() => handleDeletePlace("Paris", place.id)}
                    style={{
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "white",
                      background: "#EF4444",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
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
                      <div style={{ fontWeight: 800, color: theme.text }}>
                        {typeof req.user === "object" ? (req.user.name || JSON.stringify(req.user)) : String(req.user)}
                        {req.targetFriend && (
                          <span style={{
                            marginLeft: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 8,
                            background: "#F3F4F6",
                            border: `1px solid ${theme.border}`,
                            color: theme.textMuted,
                          }}>
                            via {String(req.targetFriend)}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const ev = req.event || {};
                        const title = ev.name || ev.category || ev.place || ev.location || "Request";
                        const parts = [];
                        if (ev.place && ev.place !== title) parts.push(ev.place);
                        if (ev.location && ev.location !== title && ev.location !== ev.place) parts.push(ev.location);
                        if (ev.timePreference) parts.push(ev.timePreference.replace(/-/g, ' '));
                        if (ev.timeOfDay) parts.push(ev.timeOfDay);
                        if (ev.category) parts.push(`cat: ${ev.category}`);
                        if (ev.language) parts.push(`lang: ${ev.language}`);
                        if (ev.date) parts.push(ev.time ? `${ev.date} at ${ev.time}` : ev.date);
                        const ts = req.createdAt || (Array.isArray(req.history) && req.history.length > 0 ? req.history[0].ts : null);
                        const when = ts ? new Date(ts).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;
                        return (
                          <>
                            <div style={{ fontSize: 13.5, color: theme.text }}>
                              <b style={{ color: theme.text }}>{title}</b>
                            </div>
                            {parts.length > 0 && (
                              <div style={{ fontSize: 13, color: theme.textMuted }}>
                                {parts.join(' · ')}
                              </div>
                            )}
                            {when && (
                              <div style={{ fontSize: 12.5, color: theme.textMuted }}>Requested on {when}</div>
                            )}
                          </>
                        );
                      })()}
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
                  <div style={{ marginBottom: 8 }}><b>User:</b> {userLabel} {req.targetFriend ? `(via ${String(req.targetFriend)})` : ""}</div>
                  {(() => {
                    const ts = req.createdAt || (Array.isArray(req.history) && req.history.length > 0 ? req.history[0].ts : null);
                    if (!ts) return null;
                    const when = new Date(ts).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                    return <div style={{ marginBottom: 8, color: theme.textMuted }}><b>Requested on:</b> {when}</div>;
                  })()}
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
            {visibleUsers.map(user => {
              const key = (user.username || user.name || '').toLowerCase();
              const isReal = !!user.isReal || isRealUserKey(key);
              const isBot = !isReal;
              return (
                <li key={user.id} style={{ ...styles.card, cursor: "pointer" }}>
                  <div onClick={() => setSelectedUser(user)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 18.5, fontWeight: 800, color: theme.text }}>
                        {user.emoji} {user.name} {user.country}
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: isReal ? '#E8F5E9' : '#F3F4F6',
                        border: `1px solid ${isReal ? '#81c784' : theme.border}`,
                        color: isReal ? '#2e7d32' : theme.textMuted,
                      }}>{isReal ? 'REAL' : 'BOT'}</span>
                    </div>
                    <div style={{ fontSize: 14, color: theme.textMuted }}>{user.desc}</div>
                    {user.city && <div style={{ fontSize: 13, color: theme.textMuted }}><b>City:</b> {user.city}</div>}
                    <div style={{ fontSize: 13, color: theme.textMuted }}><b>Languages:</b> {user.languages.join(', ')}</div>
                  </div>
                  {isBot && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        style={styles.dangerBtn}
                        onClick={() => {
                          const arr = Array.from(new Set([...removedBots, (user.username || user.name)]));
                          setRemovedBots(arr);
                          try { localStorage.setItem('removedBots', JSON.stringify(arr)); } catch {}
                        }}
                        title="Remove bot from list"
                      >Remove</button>
                    </div>
                  )}
                </li>
              );
            })}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 18.5, fontWeight: 800, color: theme.text }}>{ev.name}</div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 6,
                      backgroundColor: ev.isPublic === false ? "#e3f2fd" : "#e8f5e9",
                      color: ev.isPublic === false ? "#1976d2" : "#2e7d32",
                      border: `1px solid ${ev.isPublic === false ? "#90caf9" : "#81c784"}`,
                    }}>
                      {ev.isPublic === false ? "🔒 Private" : "🌍 Public"}
                    </span>
                  </div>
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
        <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div style={{ ...styles.modal, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const key = (selectedUser.username || selectedUser.name || '').toString();
              let prof = null;
              try {
                const raw = key ? localStorage.getItem(`userProfile_${key}`) : null;
                prof = raw ? JSON.parse(raw) : null;
              } catch {}
              const merged = {
                // identity
                username: selectedUser.username || key,
                name: selectedUser.name || (prof && prof.name) || key,
                emoji: selectedUser.emoji || (prof && prof.emoji) || '🙂',
                country: selectedUser.country || (prof && prof.country) || '',
                // basics
                firstName: (prof && prof.firstName) || '',
                age: (prof && prof.age) || '',
                city: (prof && prof.city) || selectedUser.city || '',
                house: (prof && prof.house) || '',
                countriesFrom: (prof && prof.countriesFrom) || [],
                university: (prof && prof.university) || '',
                degree: (prof && prof.degree) || '',
                // about
                desc: (prof && prof.desc) || selectedUser.desc || 'No description.',
                bio: (prof && prof.bio) || '',
                // languages
                languages: (prof && Array.isArray(prof.languages) ? prof.languages : (Array.isArray(selectedUser.languages) ? selectedUser.languages : [])),
                languageLevels: (prof && prof.languageLevels) || {},
                // interests
                interests: (prof && Array.isArray(prof.interests) ? prof.interests : []),
                // flags
                isReal: !!selectedUser.isReal || isRealUserKey(key.toLowerCase()),
              };
              const joined = (userEvents && userEvents[key]) || [];
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 26 }}>{merged.emoji}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>{merged.name} {merged.country || ''}</div>
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: merged.isReal ? '#E8F5E9' : '#F3F4F6',
                      border: `1px solid ${merged.isReal ? '#81c784' : theme.border}`,
                      color: merged.isReal ? '#2e7d32' : theme.textMuted,
                    }}>{merged.isReal ? 'REAL' : 'BOT'}</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: theme.textMuted, marginBottom: 14 }}>
                    <b>Username:</b> {merged.username}
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>First Name</div>
                        <div style={{ fontSize: 15, color: theme.text }}>{merged.firstName || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Age</div>
                        <div style={{ fontSize: 15, color: theme.text }}>{merged.age || '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>University</div>
                        <div style={{ fontSize: 15, color: theme.text }}>{merged.university || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Degree</div>
                        <div style={{ fontSize: 15, color: theme.text }}>{merged.degree || '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>City</div>
                        <div style={{ fontSize: 15, color: theme.text }}>{merged.city || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>House in Cité</div>
                        <div style={{ fontSize: 15, color: theme.text }}>{merged.house || '—'}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Countries From</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {Array.isArray(merged.countriesFrom) && merged.countriesFrom.length > 0 ? (
                          merged.countriesFrom.map((c, i) => (
                            <span key={i} style={{ fontSize: 12.5, padding: '4px 10px', borderRadius: 999, border: `1px solid ${theme.border}`, background: '#F9FAFB' }}>{c}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: 15, color: theme.text }}>—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Short Description</div>
                      <div style={{ fontSize: 15, color: theme.text }}>{merged.desc || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Bio</div>
                      <div style={{ fontSize: 15, color: theme.text, whiteSpace: 'pre-wrap' }}>{merged.bio || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Languages</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {(Array.isArray(merged.languages) && merged.languages.length > 0) ? (
                          merged.languages.map((l, i) => (
                            <span key={i} style={{ fontSize: 12.5, padding: '4px 10px', borderRadius: 999, border: `1px solid ${theme.border}`, background: '#F9FAFB' }}>{l}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: 15, color: theme.text }}>—</span>
                        )}
                      </div>
                    </div>
                    {merged.languages && merged.languages.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Language Proficiency Levels</div>
                        <div style={{ marginTop: 6 }}>
                          {merged.languages.map((l, i) => (
                            <div key={i} style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>
                              <b>{l}:</b> {(merged.languageLevels && merged.languageLevels[l]) || 'Not specified'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Interests</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {(Array.isArray(merged.interests) && merged.interests.length > 0) ? (
                          merged.interests.map((it, i) => (
                            <span key={i} style={{ fontSize: 12.5, padding: '4px 10px', borderRadius: 999, border: `1px solid ${theme.border}`, background: '#F9FAFB' }}>{it}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: 15, color: theme.text }}>—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: theme.textMuted }}>Joined Events</div>
                      {Array.isArray(joined) && joined.length > 0 ? (
                        <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                          {joined.map((ev, i) => (
                            <li key={i} style={{ fontSize: 14.5, color: theme.text }}>
                              <b>{String(ev.name || ev.id)}</b>
                              {ev.date ? ` · ${ev.date}` : ''}{ev.time ? ` at ${ev.time}` : ''}
                              {ev.location ? ` · ${ev.location}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ fontSize: 15, color: theme.text }}>—</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button style={styles.accentBtn} onClick={() => setSelectedUser(null)}>Close</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {selectedIdx !== null && activeTab === "requests" && (
        <div style={styles.card}>
          <div style={{ fontWeight: 900, marginBottom: 10, color: theme.accent }}>
            Assign Event to {typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}
          </div>
          {logAdminActivity(`Opened assignment modal for user ${typeof pendingRequests[selectedIdx].user === "object" ? (pendingRequests[selectedIdx].user.name || JSON.stringify(pendingRequests[selectedIdx].user)) : String(pendingRequests[selectedIdx].user)}`)}
          
          {/* Toggle between Suggested and All Events */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              style={{
                ...styles.pill,
                ...((!showAllEvents) ? styles.pillSelected : {}),
                fontSize: 13,
                padding: "6px 12px",
              }}
              onClick={() => setShowAllEvents(false)}
            >
              🎯 Suggested Events
            </button>
            <button
              style={{
                ...styles.pill,
                ...(showAllEvents ? styles.pillSelected : {}),
                fontSize: 13,
                padding: "6px 12px",
              }}
              onClick={() => setShowAllEvents(true)}
            >
              📋 All Events
            </button>
          </div>
          
          {(() => {
            const req = pendingRequests[selectedIdx];
            const filtered = (events || []).filter(ev => matchesRequest(ev, req));
            const eventsToShow = showAllEvents ? events : filtered;
            
            return (
              <>
                <select value={selectedEventId || ""} onChange={e => {
            setSelectedEventId(e.target.value);
            logAdminActivity(`Selected event ${e.target.value} for user ${pendingRequests[selectedIdx].user}`);
                }} style={{ padding: 10, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 8, width: "100%" }}>
                  <option value="">-- Choose {showAllEvents ? "an" : "a Matching"} Event --</option>
                  {eventsToShow.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.time})</option>
                  ))}
                </select>
                {!showAllEvents && filtered.length === 0 && (
                  <div style={{ color: theme.textMuted, fontSize: 13.5, marginBottom: 8 }}>
                    No events match this request. Try "All Events" or create a new event.
                  </div>
                )}
                {showAllEvents && events.length === 0 && (
                  <div style={{ color: theme.textMuted, fontSize: 13.5, marginBottom: 8 }}>
                    No events created yet. Go to "Create Event" tab to add one.
                  </div>
                )}
                {!showAllEvents && filtered.length > 0 && (
                  <div style={{ color: theme.primary, fontSize: 12.5, marginBottom: 8, fontWeight: 600 }}>
                    ✨ Showing {filtered.length} suggested event{filtered.length !== 1 ? "s" : ""} based on user preferences
                  </div>
                )}
              </>
            );
          })()}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.primaryBtn} onClick={() => {
              if (!selectedEventId) {
                alert("Please select an event first");
                return;
              }
              const selectedEvent = events.find(ev => String(ev.id) === String(selectedEventId));
              if (!selectedEvent) {
                alert("Event not found");
                return;
              }
              logAdminActivity(`Confirmed assignment of event ${selectedEventId} to user ${pendingRequests[selectedIdx].user}`);
              if (onAssignEvent) onAssignEvent(selectedIdx, selectedEventId, selectedEvent);
              setSelectedIdx(null);
              setSelectedEventId("");
              setShowAllEvents(false); // Reset toggle
            }}>Confirm Assignment</button>
            <button style={styles.dangerBtn} onClick={() => {
              logAdminActivity(`Cancelled assignment for user ${pendingRequests[selectedIdx].user}`);
              setSelectedIdx(null);
              setShowAllEvents(false); // Reset toggle
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Invitations subcomponents ---
function genCode() {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LEMI-${seg()}-${seg()}`;
}

function InviteCreator({ onCreate }) {
  const [assignedTo, setAssignedTo] = React.useState("");
  const [lastCode, setLastCode] = React.useState("");
  const create = () => {
    const code = genCode();
    const obj = { code, assignedTo: assignedTo?.trim() || undefined, createdAt: Date.now() };
    try {
      const raw = localStorage.getItem('lemi_invites');
      const list = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(list) ? [obj, ...list] : [obj];
      localStorage.setItem('lemi_invites', JSON.stringify(updated));
    } catch {}
    setLastCode(code);
    setAssignedTo("");
    onCreate && onCreate(obj);
  };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <input
          type="text"
          placeholder="Assign to username (optional)"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          style={{ padding: 10, border: '1px solid #EEF2F7', borderRadius: 10 }}
        />
        <button style={{ background: '#58CC02', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 900 }} onClick={create}>
          Generate Invite Code
        </button>
      </div>
      {lastCode && (
        <div style={{ marginTop: 8, fontSize: 13 }}>
          New code: <b>{lastCode}</b>
          <button
            style={{ marginLeft: 8, border: '1px solid #EEF2F7', background: '#F3F4F6', borderRadius: 8, padding: '2px 8px', cursor: 'pointer' }}
            onClick={async () => {
              try { await navigator.clipboard.writeText(lastCode); alert('Copied!'); } catch {}
            }}
          >Copy</button>
        </div>
      )}
    </div>
  );
}

function InviteList({ invites, onUpdate }) {
  const revoke = (code) => {
    const next = invites.filter(i => i.code !== code || i.usedBy);
    if (next.length === invites.length) {
      alert('Cannot revoke a used invite.');
      return;
    }
    try { localStorage.setItem('lemi_invites', JSON.stringify(next)); } catch {}
    onUpdate(next);
  };
  const copy = async (code) => { try { await navigator.clipboard.writeText(code); alert('Copied!'); } catch {} };
  if (!Array.isArray(invites) || invites.length === 0) {
    return <div style={{ color: '#6B7280', fontSize: 13 }}>No invites yet.</div>;
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {invites.map(i => (
        <div key={i.code} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
          <div><b>{i.code}</b></div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Assigned: {i.assignedTo || '—'}</div>
          <div style={{ fontSize: 13, color: i.usedBy ? '#2e7d32' : '#6B7280' }}>{i.usedBy ? `Used by ${i.usedBy}` : 'Unused'}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button style={{ border: '1px solid #EEF2F7', background: '#F3F4F6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }} onClick={() => copy(i.code)}>Copy</button>
            {!i.usedBy && (
              <button style={{ background: '#EA2B2B', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 800 }} onClick={() => revoke(i.code)}>Revoke</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
