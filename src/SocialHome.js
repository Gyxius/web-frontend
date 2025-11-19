import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import users from "./users";
import LocationPicker from "./LocationPicker";
import "./SocialHome.animations.css";
import { createEvent, getEventById, updateEvent, unarchiveEvent, archiveEvent } from "./api";
import NotificationsInbox from "./NotificationsInbox";
import ImageCropper from "./ImageCropper";
import { FULL_LANGUAGES } from "./constants/languages";

// Helper to format long addresses to concise format
function formatAddressForDisplay(fullAddress) {
  if (!fullAddress) return '';
  
  // If address is already short (3 or fewer commas), return as is
  const commaCount = (fullAddress.match(/,/g) || []).length;
  if (commaCount <= 3) return fullAddress;
  
  try {
    // Split the address by commas
    const parts = fullAddress.split(',').map(p => p.trim());
    
    // Try to extract: venue, house number, street, postal code, city
    // Example: "Le Fleurus, 10, Boulevard Jourdan, Quartier..., Paris 14e..., Paris, Île-de-France, France métropolitaine, 75014, France"
    // Target: "Le Fleurus, 10 Boulevard Jourdan, 75014 Paris"
    
    let venue = parts[0];
    let street = '';
    let postalCode = '';
    let city = '';
    
    // Look for postal code (5 digits)
    const postalCodeIndex = parts.findIndex(p => /^\d{5}$/.test(p.trim()));
    if (postalCodeIndex !== -1) {
      postalCode = parts[postalCodeIndex];
    }
    
    // Look for Paris/city name (before Île-de-France)
    const cityIndex = parts.findIndex(p => p.toLowerCase().includes('paris') && !p.toLowerCase().includes('arrondissement'));
    if (cityIndex !== -1) {
      city = parts[cityIndex];
    }
    
    // Build street from parts[1] and parts[2] if they look like number and street
    if (parts.length > 2) {
      const maybeNumber = parts[1].trim();
      const maybeStreet = parts[2].trim();
      if (/^\d+/.test(maybeNumber)) {
        street = `${maybeNumber} ${maybeStreet}`;
      } else {
        street = maybeStreet;
      }
    }
    
    // Build concise address
    let result = venue;
    if (street) {
      result += `, ${street}`;
    }
    if (postalCode && city) {
      result += `, ${postalCode} ${city}`;
    } else if (city) {
      result += `, ${city}`;
    }
    
    return result || fullAddress;
  } catch (e) {
    // If anything fails, return original address
    return fullAddress;
  }
}

// Helper to check if end time is valid (can be next day)
function isValidEndTime(startTime, endTime) {
  if (!startTime || !endTime) return true;
  
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  // If end time is less than start time, assume it's next day (valid)
  // Only invalid if end time equals or is just slightly after start on same day
  if (endMinutes <= startMinutes && endMinutes > startMinutes - 60) {
    return false;
  }
  
  return true;
}

function SocialHome({
  userName = "Guest",
  currentUser,
  onSignOut,
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
  followingEvents = [],
  onRequestJoinEvent,
  followRequestsIncoming = [],
  onAcceptFollowRequestFrom,
  notificationCount = 0,
  notificationsData = null,
  onRefreshNotifications,
  onDeclineFollowRequestFrom,
  addPoints,
  getUserPoints,
  templateEventToCreate = null,
  onTemplateEventHandled = null,
  // Admin handoff: allow opening SocialHome to preview/edit a specific event
  adminMode = false,
  initialEventId = null,
  onBackFromAdmin = null,
}) {
  if (showDebug) {
    console.log("[DEBUG] joinedEvents for", userName, joinedEvents);
  }

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showNotificationsInbox, setShowNotificationsInbox] = useState(false);
  const [createEventStep, setCreateEventStep] = useState(1);
  const [eventPreview, setEventPreview] = useState(null); // For previewing events before joining
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [adminEditForm, setAdminEditForm] = useState(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  // View mode: 'my' shows only user's joined events, 'following' shows only following users' joined events
  const [viewMode, setViewMode] = useState("my");
  
  // Onboarding tooltip state
  const [showOnboardingTooltip, setShowOnboardingTooltip] = useState(() => {
    // Check if user has seen the tooltip before
    const hasSeenTooltip = localStorage.getItem('hasSeenOnboardingTooltip');
    return !hasSeenTooltip;
  });
  
  // New state for Frimake-style navigation
  const [activeTab, setActiveTab] = useState("featured"); // "featured", "joined", "hosted", "archived"
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

  // Paris Trees feature state
  const [showParisTreesModal, setShowParisTreesModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null); // "bars", "clubs", "cite"
  const [parisTreesView, setParisTreesView] = useState("selection"); // "selection" or "tree"
  
  // Track progress for each tree - stores indexes of completed venues
  const [treeProgress, setTreeProgress] = useState(() => {
    const saved = localStorage.getItem('parisTreesProgress');
    return saved ? JSON.parse(saved) : { bars: [], clubs: [], cite: [] };
  });
  
  // Venue detail modal
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueModalView, setVenueModalView] = useState("options"); // "options" or "details"

  // Image cropper state
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  // Create event form state
  const [newEvent, setNewEvent] = useState({
    name: "",
    location: "cite", // "cite" or "paris"
    venue: "", // Specific venue name (e.g., "Fleurus Bar")
    address: "", // Full address
    coordinates: null, // { lat, lng }
    date: "",
    time: "",
  endTime: "",
    description: "",
    category: "food",
    languages: [], // Array of languages that will be spoken
    capacity: 6, // Maximum number of participants
    imageUrl: "", // Background image for the event
    templateEventId: null, // ID of template event if created from featured event
    targetInterests: [], // Array of interests to target
    targetCiteConnection: [], // Array of Cité connection statuses to target
    targetReasons: [], // Array of "What Brings You Here" reasons to target
  });
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");

  // Handle template event for "Create Hangout" feature
  useEffect(() => {
    console.log("Template event effect triggered:", templateEventToCreate);
    if (templateEventToCreate) {
      console.log("Setting up hangout creation with template:", templateEventToCreate);
      setNewEvent({
        name: "", // User customizes the hangout name
        location: templateEventToCreate.location || "cite",
        venue: templateEventToCreate.venue || "",
        address: templateEventToCreate.address || "",
        coordinates: templateEventToCreate.coordinates || null,
        date: templateEventToCreate.date || "", // Copy date from template
        time: templateEventToCreate.time || "", // Copy time from template
  endTime: templateEventToCreate.endTime || "",
        description: "", // User writes their own hangout description
        category: templateEventToCreate.category || "food",
        languages: [], // User customizes languages
        capacity: 6, // User customizes capacity
        imageUrl: templateEventToCreate.imageUrl || "",
        templateEventId: templateEventToCreate.id,
        targetInterests: [], // Initialize targeting arrays
        targetCiteConnection: [],
        targetReasons: [],
      });
      setShowCreateEventModal(true);
      setCreateEventStep(1);
      console.log("Modal should now be visible");
      // Notify parent that we've handled the template
      if (onTemplateEventHandled) {
        onTemplateEventHandled();
      }
    }
  }, [templateEventToCreate, onTemplateEventHandled]);

  // If admin opened a specific event, fetch it and open the same preview screen users see
  useEffect(() => {
    const openInitial = async () => {
      if (adminMode && initialEventId && !eventPreview) {
        try {
          const ev = await getEventById(initialEventId);
          setEventPreview(ev);
        } catch (e) {
          console.error("Failed to load event by id", initialEventId, e);
        }
      }
    };
    openInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMode, initialEventId]);

  // Alternative venues for each tree - used when user clicks "Find Alternative"
  const venueAlternatives = {
    bars: [
      { name: 'Le Select', emoji: '☕', description: 'Historic Left Bank café-bar' },
      { name: 'Chez Georges', emoji: '🍷', description: 'Traditional French bistro' },
      { name: 'Le Piano Vache', emoji: '🎹', description: 'Student rock bar with live music' },
      { name: 'Polly Magoo', emoji: '🎭', description: 'Arty cocktail bar' },
      { name: 'Le Requin Chagrin', emoji: '🦈', description: 'Popular student hangout' },
    ],
    clubs: [
      { name: 'Wanderlust', emoji: '🌊', description: 'Seine-side club and bar' },
      { name: 'Yoyo', emoji: '🪩', description: 'Palais de Tokyo nightclub' },
      { name: 'Le Batofar', emoji: '⛴️', description: 'Legendary boat club' },
      { name: 'Petit Bain', emoji: '🛥️', description: 'Floating club and restaurant' },
      { name: 'La Bellevilloise', emoji: '🏭', description: 'Cultural venue with parties' },
    ],
    cite: [
      { name: 'Maison du Japon', emoji: '🇯🇵', description: 'Japanese house with events' },
      { name: 'Maison de l\'Argentine', emoji: '🇦🇷', description: 'Argentine cultural center' },
      { name: 'Maison du Mexique', emoji: '🇲🇽', description: 'Mexican house gatherings' },
      { name: 'Maison de la Tunisie', emoji: '🇹🇳', description: 'Tunisian residence' },
      { name: 'Maison de l\'Inde', emoji: '🇮🇳', description: 'Indian house with cultural events' },
    ]
  };

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

  // Helper function for Enter key navigation
  const handleEnterKeyPress = (e, condition, nextStep) => {
    if (e.key === 'Enter' && condition) {
      setCreateEventStep(nextStep);
    }
  };

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

  const getCategoryBadge = (category) => {
    const categoryMap = {
      "food": { emoji: "🍽️", label: "Food", color: "#FF6B6B" },
      "drinks": { emoji: "🍹", label: "Drinks", color: "#4ECDC4" },
      "party": { emoji: "🎉", label: "Party", color: "#A463F2" },
      "sports": { emoji: "⚽", label: "Sports", color: "#45B7D1" },
      "culture": { emoji: "🎭", label: "Culture", color: "#F7B731" },
      "study": { emoji: "📚", label: "Study", color: "#5F27CD" },
      "music": { emoji: "🎵", label: "Music", color: "#FD79A8" },
      "games": { emoji: "🎮", label: "Games", color: "#6C5CE7" },
      "outdoor": { emoji: "🌳", label: "Outdoor", color: "#00B894" },
      "other": { emoji: "✨", label: "Other", color: "#74B9FF" },
    };
    return categoryMap[category?.toLowerCase()] || categoryMap["other"];
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "";
    try {
      const dateString = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
      const date = new Date(dateString);
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        return String(dateStr);
      }
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      
      // Format: "Wednesday 5 November"
      return `${dayName} ${dayNum} ${monthName}`;
    } catch {
      return String(dateStr);
    }
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
    border: "#E5E7EB",      // light gray for borders
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
  const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";
  
  // Comprehensive language to emoji mapping
  const getLanguageEmoji = (language) => {
    const languageEmojis = {
      // European Languages
      "Albanian": "🇦🇱", "Basque": "🇪🇸", "Belarusian": "🇧🇾", "Bosnian": "🇧🇦",
      "Bulgarian": "🇧🇬", "Catalan": "🇪🇸", "Croatian": "🇭🇷", "Czech": "🇨🇿",
      "Danish": "🇩🇰", "Dutch": "🇳🇱", "English": "🇬🇧", "Estonian": "🇪🇪",
      "Finnish": "🇫🇮", "French": "🇫🇷", "Galician": "🇪🇸", "German": "🇩🇪",
      "Greek": "🇬🇷", "Hungarian": "🇭🇺", "Icelandic": "🇮🇸", "Irish": "🇮🇪",
      "Italian": "🇮🇹", "Latvian": "🇱🇻", "Lithuanian": "🇱🇹", "Luxembourgish": "🇱🇺",
      "Macedonian": "🇲🇰", "Maltese": "🇲🇹", "Moldovan": "🇲🇩", "Montenegrin": "🇲🇪",
      "Norwegian": "🇳🇴", "Polish": "🇵🇱", "Portuguese": "🇵🇹", "Romanian": "🇷🇴",
      "Russian": "🇷🇺", "Scottish Gaelic": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Serbian": "🇷🇸", "Slovak": "🇸🇰",
      "Slovenian": "🇸🇮", "Spanish": "🇪🇸", "Swedish": "🇸🇪", "Ukrainian": "🇺🇦",
      "Welsh": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      
      // Asian Languages
      "Arabic": "🇸🇦", "Armenian": "🇦🇲", "Azerbaijani": "🇦🇿", "Bengali": "🇧🇩",
      "Burmese": "🇲🇲", "Chinese": "🇨🇳", "Mandarin Chinese": "🇨🇳", "Cantonese": "🇭🇰",
      "Georgian": "🇬🇪", "Hebrew": "🇮🇱", "Hindi": "🇮🇳", "Indonesian": "🇮🇩",
      "Japanese": "🇯🇵", "Kazakh": "🇰🇿", "Khmer": "🇰🇭", "Korean": "🇰🇷",
      "Kurdish": "🇮🇶", "Kyrgyz": "🇰🇬", "Lao": "🇱🇦", "Malay": "🇲🇾",
      "Mongolian": "🇲🇳", "Nepali": "🇳🇵", "Pashto": "🇦🇫", "Persian (Farsi)": "🇮🇷",
      "Punjabi": "🇮🇳", "Sinhala": "🇱🇰", "Tagalog": "🇵🇭", "Tajik": "🇹🇯",
      "Tamil": "🇮🇳", "Telugu": "🇮🇳", "Thai": "🇹🇭", "Tibetan": "🇨🇳",
      "Turkish": "🇹🇷", "Turkmen": "🇹🇲", "Urdu": "🇵🇰", "Uzbek": "🇺🇿",
      "Vietnamese": "🇻🇳",
      
      // African Languages
      "Afrikaans": "🇿🇦", "Amharic": "🇪🇹", "Hausa": "🇳🇬", "Igbo": "🇳🇬",
      "Kinyarwanda": "🇷🇼", "Malagasy": "🇲🇬", "Somali": "🇸🇴", "Swahili": "🇹🇿",
      "Wolof": "🇸🇳", "Yoruba": "🇳🇬", "Zulu": "🇿🇦",
      
      // Americas Languages
      "Aymara": "🇧🇴", "Guarani": "🇵🇾", "Haitian Creole": "🇭🇹", "Quechua": "🇵🇪",
      
      // Oceania
      "Fijian": "🇫🇯", "Maori": "🇳🇿", "Samoan": "🇼🇸", "Tongan": "🇹🇴",
    };
    
    return languageEmojis[language] || "🌍";
  };
  
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

  // Helper: build DiceBear preview URL from an avatar spec
  const dicebearPreviewUrl = (spec, fallbackSeed) => {
    try {
      if (!spec || spec.provider !== 'dicebear') return null;
      const style = spec.style || 'bottts';
      const seed = spec.seed || fallbackSeed || '';
      return `https://api.dicebear.com/6.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    } catch {
      return null;
    }
  };

  const getCurrentUserAvatarUrl = () => {
    try {
      // Prefer avatar from currentUser object if present
      if (currentUser && currentUser.avatar) {
        if (currentUser.avatar.provider === 'dicebear') {
          return dicebearPreviewUrl(currentUser.avatar, userName);
        } else if (currentUser.avatar.provider === 'custom' && currentUser.avatar.url) {
          return currentUser.avatar.url;
        }
      }
      // Next, try localStorage cached profile
      const raw = localStorage.getItem(`userProfile_${userName}`);
      if (raw) {
        const prof = JSON.parse(raw);
        if (prof && prof.avatar) {
          if (prof.avatar.provider === 'dicebear') {
            return dicebearPreviewUrl(prof.avatar, userName);
          } else if (prof.avatar.provider === 'custom' && prof.avatar.url) {
            return prof.avatar.url;
          }
        }
        // fallback: maybe emoji stored
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  return (
    <div style={styles.container}>
      {adminMode && (
        <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1100 }}>
          <button
            onClick={() => {
              if (onBackFromAdmin) onBackFromAdmin();
            }}
            style={{
              background: "#6B7280",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            ← Back to Admin
          </button>
        </div>
      )}
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
              style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: "50%", cursor: 'pointer' }}
              onClick={() => {
                // Reset to default homepage state
                setActiveBottomTab("events");
                setViewMode("my");
                setActiveTab("featured");
                setShowExplore(false);
                setShowCalendar(false);
                setShowSearchModal(false);
                setShowWhereModal(false);
                setShowWhenModal(false);
                setShowFiltersModal(false);
                setEventPreview(null);
                setShowCreateEventModal(false);
                setShowNotificationsInbox(false);
              }}
            />
            {/* Play Button for Paris Trees Feature */}
            <button
              onClick={() => {
                setShowParisTreesModal(true);
                setParisTreesView("selection");
                setSelectedTree(null);
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              <span style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>▶</span>
            </button>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>
            Lemi <span style={{ fontSize: 17, fontWeight: 600, color: theme.textMuted }}>Paris</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar with notification badge on the right (click avatar to open notifications) */}
            {(() => {
              const avatarUrl = getCurrentUserAvatarUrl();
              return (
                <button
                  onClick={() => setShowNotificationsInbox(true)}
                  aria-label="Open notifications"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: 999, display: 'block' }} />
                  ) : (
                    <FaUserCircle size={28} />
                  )}
                  {(notificationCount + (followRequestsIncoming?.length || 0)) > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#FF4444',
                      color: 'white',
                      borderRadius: '50%',
                      minWidth: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 'bold',
                      padding: (notificationCount + (followRequestsIncoming?.length || 0)) > 9 ? '0 4px' : 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {(notificationCount + (followRequestsIncoming?.length || 0)) > 99 ? '99+' : (notificationCount + (followRequestsIncoming?.length || 0))}
                    </div>
                  )}
                </button>
              );
            })()}
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
            // Regular tabs: Featured, Joined, Hosted, Archived
            <>
              <button
                onClick={() => setActiveTab("featured")}
                style={{
                  flex: 1,
                  padding: "14px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "featured" ? `4px solid ${theme.primary}` : "4px solid transparent",
                  fontWeight: activeTab === "featured" ? 900 : 600,
                  fontSize: 16,
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
                  padding: "14px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "joined" ? `4px solid ${theme.primary}` : "4px solid transparent",
                  fontWeight: activeTab === "joined" ? 900 : 600,
                  fontSize: 16,
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
                  padding: "14px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "hosted" ? `4px solid ${theme.primary}` : "4px solid transparent",
                  fontWeight: activeTab === "hosted" ? 900 : 600,
                  fontSize: 16,
                  color: activeTab === "hosted" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Hosted
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                style={{
                  flex: 1,
                  padding: "14px 8px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === "archived" ? `4px solid ${theme.primary}` : "4px solid transparent",
                  fontWeight: activeTab === "archived" ? 900 : 600,
                  fontSize: 16,
                  color: activeTab === "archived" ? theme.text : theme.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Archive
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
                {sortedEvents.map((event, idx) => {
                  const categoryBadge = getCategoryBadge(event.category);
                  return (
                  <div key={idx} style={{ 
                    background: theme.card, 
                    padding: 16, 
                    borderRadius: 14, 
                    marginBottom: 12,
                    border: `1px solid ${theme.track}`,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  onClick={() => setEventPreview(event)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: theme.text, flex: 1, lineHeight: 1.3 }}>
                        {event.name}
                      </div>
                    </div>
                    
                    {event.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundImage: `url(${event.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }} />
                    )}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Host Info */}
                      {(() => {
                        if (event.host) {
                          const hostDisplayName = (event.host.username || event.host.name || '').toLowerCase() === 'admin'
                            ? 'Admin'
                            : (event.host.name || event.host.username || 'Unknown');
                          return (
                            <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                              <span>👤</span>
                              <span>
                                Hosted by <span style={{ fontWeight: 700, color: theme.accent }}>
                                  {event.host.emoji} {hostDisplayName}
                                </span>
                              </span>
                            </div>
                          );
                        } else if (event.createdBy) {
                          const hostUser = users.find(u => u.name === event.createdBy || u.username === event.createdBy);
                          if (hostUser) {
                            const hostDisplayName = (hostUser.username || hostUser.name || '').toLowerCase() === 'admin'
                              ? 'Admin'
                              : (hostUser.name || hostUser.username || 'Unknown');
                            return (
                              <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                                <span>👤</span>
                                <span>
                                  Hosted by <span style={{ fontWeight: 700, color: theme.accent }}>
                                    {hostUser.emoji} {hostDisplayName}
                                  </span>
                                </span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      
                      {event.location && (
                        <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📍</span>
                          <span style={{ fontWeight: 600 }}>
                            {event.venue || (event.location === "cite" ? "Cité" : event.location === "paris" ? "Paris" : event.location)}
                            {event.venue && event.location && `, ${event.location === "cite" ? "Cité" : event.location === "paris" ? "Paris" : event.location}`}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🗓</span>
                        <span style={{ fontWeight: 600 }}>{formatDateOnly(event.date)}</span>
                      </div>
                      
                      <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>👥</span>
                        <span>
                          {(() => {
                            // Count: host (if exists) + participants, avoiding double-counting
                            const attendeeCount = (event.host ? 1 : 0) + (event.participants?.length || 0);
                            return event.capacity 
                              ? `${attendeeCount}/${event.capacity} spots filled` 
                              : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                          })()}
                        </span>
                      </div>
                      
                      {event.languages && event.languages.length > 0 && (
                        <div style={{ 
                          fontSize: 14, 
                          color: theme.text, 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 6,
                          flexWrap: "wrap",
                        }}>
                          <span>🗣️</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {event.languages.map(lang => (
                              <span 
                                key={lang}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: theme.card,
                                  border: `1.5px solid ${theme.border}`,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: theme.text,
                                }}
                              >
                                <span style={{ fontSize: 14 }}>{getLanguageEmoji(lang)}</span>
                                <span>{lang}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {event.category && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: categoryBadge.color,
                            color: "white",
                            fontSize: 13,
                            fontWeight: 700,
                          }}>
                            <span>{categoryBadge.emoji}</span>
                            <span>{categoryBadge.label}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      style={{
                        ...styles.joinButton,
                        padding: "12px 16px",
                        fontSize: 15,
                        fontWeight: 700,
                        width: "100%",
                        marginTop: 12,
                        opacity: (() => {
                          const attendeeCount = (event.host ? 1 : 0) + (event.participants?.length || 0);
                          return (event.capacity && attendeeCount >= event.capacity) ? 0.5 : 1;
                        })(),
                        cursor: (() => {
                          const attendeeCount = (event.host ? 1 : 0) + (event.participants?.length || 0);
                          return (event.capacity && attendeeCount >= event.capacity) ? "not-allowed" : "pointer";
                        })(),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const attendeeCount = (event.host ? 1 : 0) + (event.participants?.length || 0);
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
                  );
                })}
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
          <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            Big events happening this week — join or create hangouts around them!
          </div>
          {featuredEvents.slice(0, 5).map((event, idx) => {
            const categoryBadge = getCategoryBadge(event.category);
            return (
            <div key={idx} style={{ 
              background: theme.card, 
              padding: 16, 
              borderRadius: 14, 
              marginBottom: 12,
              border: `1px solid ${theme.track}`,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            onClick={() => setEventPreview(event)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: theme.text, flex: 1, lineHeight: 1.3 }}>
                  {event.name}
                </div>
              </div>
              
              {event.imageUrl && (
                <div style={{
                  width: "100%",
                  height: 160,
                  borderRadius: 12,
                  marginBottom: 12,
                  backgroundImage: `url(${event.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }} />
              )}
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {event.location && (
                  <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📍</span>
                    <span style={{ fontWeight: 600 }}>
                      {event.venue || (event.location === "cite" ? "Cité" : event.location === "paris" ? "Paris" : event.location)}
                      {event.venue && event.location && `, ${event.location === "cite" ? "Cité" : event.location === "paris" ? "Paris" : event.location}`}
                    </span>
                  </div>
                )}
                
                <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🗓</span>
                  <span style={{ fontWeight: 600 }}>{formatDateOnly(event.date) || event.time}</span>
                </div>
                
                <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>👥</span>
                  <span>
                    {(() => {
                      // Count: host (if exists) + participants, avoiding double-counting
                      const attendeeCount = (event.host ? 1 : 0) + (event.participants?.length || 0);
                      return event.capacity 
                        ? `${attendeeCount}/${event.capacity} spots filled` 
                        : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                    })()}
                  </span>
                </div>
                
                {event.languages && event.languages.length > 0 && (
                  <div style={{ 
                    fontSize: 14, 
                    color: theme.text, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6,
                    flexWrap: "wrap",
                  }}>
                    <span>🗣️</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {event.languages.map(lang => (
                        <span 
                          key={lang}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: theme.card,
                            border: `1.5px solid ${theme.border}`,
                            fontSize: 12,
                            fontWeight: 600,
                            color: theme.text,
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{getLanguageEmoji(lang)}</span>
                          <span>{lang}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {event.category && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: categoryBadge.color,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                    }}>
                      <span>{categoryBadge.emoji}</span>
                      <span>{categoryBadge.label}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
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
          {joinedEvents.filter(item => !(item.host && item.host.name === userName) && !item.isArchived).length > 0 ? (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>📅 My Joined Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Events you have joined
              </div>
              {joinedEvents
                .filter(item => !(item.host && item.host.name === userName) && !item.isArchived)
                .map((item, idx) => {
                  const categoryBadge = getCategoryBadge(item.category);
                  return (
                  <div
                    key={`joined-${idx}`}
                    style={{ 
                      background: theme.card, 
                      padding: 16, 
                      borderRadius: 14, 
                      marginBottom: 12,
                      border: `1px solid ${theme.track}`,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    onClick={() => onJoinedEventClick(item)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: theme.text, flex: 1, lineHeight: 1.3 }}>
                        {String(item.name || item.type || item.category || "Event")}
                      </div>
                    </div>
                    
                    {item.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }} />
                    )}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Host Info */}
                      {(() => {
                        if (item.host) {
                          return (
                            <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                              <span>👤</span>
                              <span>
                                Hosted by <span style={{ fontWeight: 700, color: theme.accent }}>
                                  {item.host.emoji} {item.host.name}
                                </span>
                              </span>
                            </div>
                          );
                        } else if (item.createdBy) {
                          const hostUser = users.find(u => u.name === item.createdBy || u.username === item.createdBy);
                          if (hostUser) {
                            return (
                              <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                                <span>👤</span>
                                <span>
                                  Hosted by <span style={{ fontWeight: 700, color: theme.accent }}>
                                    {hostUser.emoji} {hostUser.name}
                                  </span>
                                </span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      
                      {item.location && (
                        <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📍</span>
                          <span style={{ fontWeight: 600 }}>
                            {item.venue || (item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location)}
                            {item.venue && item.location && `, ${item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location}`}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🗓</span>
                        <span style={{ fontWeight: 600 }}>{formatDateOnly(item.date)}</span>
                      </div>
                      
                      <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>�</span>
                        <span>
                          {(() => {
                            const attendeeCount = (item.crew?.length || 0) + (item.participants?.length || 0);
                            return item.capacity 
                              ? `${attendeeCount}/${item.capacity} spots filled` 
                              : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                          })()}
                        </span>
                      </div>
                      
                      {item.category && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: categoryBadge.color,
                            color: "white",
                            fontSize: 13,
                            fontWeight: 700,
                          }}>
                            <span>{categoryBadge.emoji}</span>
                            <span>{categoryBadge.label}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
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
          {joinedEvents.filter(item => item.host && item.host.name === userName && !item.isArchived).length > 0 ? (
            <div style={styles.highlightCard}>
              <div style={styles.highlightTitle}>🎤 My Hosted Events</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                Events you are hosting
              </div>
              {joinedEvents
                .filter(item => item.host && item.host.name === userName && !item.isArchived)
                .map((item, idx) => {
                  const categoryBadge = getCategoryBadge(item.category);
                  return (
                  <div
                    key={`hosted-${idx}`}
                    style={{ 
                      background: theme.card, 
                      padding: 16, 
                      borderRadius: 14, 
                      marginBottom: 12,
                      border: `1px solid ${theme.track}`,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    onClick={() => onJoinedEventClick(item)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: theme.text, flex: 1, lineHeight: 1.3 }}>
                        {String(item.name || item.type || item.category || "Event")}
                      </div>
                    </div>
                    
                    {item.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }} />
                    )}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {item.location && (
                        <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📍</span>
                          <span style={{ fontWeight: 600 }}>
                            {item.venue || (item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location)}
                            {item.venue && item.location && `, ${item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location}`}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🗓</span>
                        <span style={{ fontWeight: 600 }}>{formatDateOnly(item.date)}</span>
                      </div>
                      
                      <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>👥</span>
                        <span>
                          {(() => {
                            const attendeeCount = (item.host ? 1 : 0) + (item.participants?.length || 0);
                            return item.capacity 
                              ? `${attendeeCount}/${item.capacity} spots filled` 
                              : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                          })()}
                        </span>
                      </div>
                      
                      {item.languages && item.languages.length > 0 && (
                        <div style={{ 
                          fontSize: 14, 
                          color: theme.text, 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 6,
                          flexWrap: "wrap",
                        }}>
                          <span>🗣️</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {item.languages.map(lang => (
                              <span 
                                key={lang}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: theme.card,
                                  border: `1.5px solid ${theme.border}`,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: theme.text,
                                }}
                              >
                                <span style={{ fontSize: 14 }}>{getLanguageEmoji(lang)}</span>
                                <span>{lang}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {item.category && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: categoryBadge.color,
                            color: "white",
                            fontSize: 13,
                            fontWeight: 700,
                          }}>
                            <span>{categoryBadge.emoji}</span>
                            <span>{categoryBadge.label}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
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

      {/* TAB: Archived Events */}
      {activeTab === "archived" && !showExplore && (
        <>
          {(() => {
            // Only show archived events where user is host or participant
            const archivedJoined = joinedEvents.filter(e => e.isArchived);
            
            return archivedJoined.length > 0 ? (
              <div style={styles.highlightCard}>
                <div style={styles.highlightTitle}>Archived Events</div>
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                  Past events that have ended
                </div>
                {archivedJoined.map((item, idx) => {
                  const categoryBadge = getCategoryBadge(item.category);
                  const isHost = item.host && item.host.name === userName;
                  const isAdmin = userName.toLowerCase() === "admin";
                  
                  return (
                  <div
                    key={`archived-${idx}`}
                    style={{ 
                      background: theme.card, 
                      padding: 16, 
                      borderRadius: 14, 
                      marginBottom: 12,
                      border: `1px solid ${theme.track}`,
                      opacity: 0.8,
                      position: "relative",
                    }}
                  >
                    {/* Archived badge */}
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: theme.textMuted,
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      ARCHIVED
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingRight: 90 }}>
                      <div style={{ fontWeight: 900, fontSize: 18, color: theme.text, flex: 1, lineHeight: 1.3 }}>
                        {String(item.name || item.type || item.category || "Event")}
                      </div>
                    </div>
                    
                    {item.imageUrl && (
                      <div style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "grayscale(30%)",
                      }} />
                    )}
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {item.location && (
                        <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>📍</span>
                          <span style={{ fontWeight: 600 }}>
                            {item.venue || (item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location)}
                            {item.venue && item.location && `, ${item.location === "cite" ? "Cité" : item.location === "paris" ? "Paris" : item.location}`}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ fontSize: 15, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🗓</span>
                        <span style={{ fontWeight: 600 }}>{formatDateOnly(item.date)}</span>
                      </div>
                      
                      <div style={{ fontSize: 14, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>👥</span>
                        <span>
                          {(() => {
                            const attendeeCount = (item.host ? 1 : 0) + (item.participants?.length || 0);
                            return item.capacity 
                              ? `${attendeeCount}/${item.capacity} attended` 
                              : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`;
                          })()}
                        </span>
                      </div>
                      
                      {item.languages && item.languages.length > 0 && (
                        <div style={{ 
                          fontSize: 14, 
                          color: theme.text, 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 6,
                          flexWrap: "wrap",
                        }}>
                          <span>🗣️</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {item.languages.map(lang => (
                              <span 
                                key={lang}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: theme.card,
                                  border: `1.5px solid ${theme.border}`,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: theme.text,
                                }}
                              >
                                <span style={{ fontSize: 14 }}>{getLanguageEmoji(lang)}</span>
                                <span>{lang}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {item.category && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: categoryBadge.color,
                            color: "white",
                            fontSize: 13,
                            fontWeight: 700,
                          }}>
                            <span>{categoryBadge.emoji}</span>
                            <span>{categoryBadge.label}</span>
                          </span>
                        </div>
                      )}
                      
                      {/* Unarchive button for host/admin */}
                      {(isHost || isAdmin) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Unarchive this event? It will appear in the active events list again.")) {
                              try {
                                await unarchiveEvent(item.id, userName);
                                alert("Event unarchived successfully! Refresh the page to see changes.");
                                window.location.reload();
                              } catch (error) {
                                console.error("Failed to unarchive:", error);
                                alert("Failed to unarchive event: " + error.message);
                              }
                            }
                          }}
                          style={{
                            marginTop: 8,
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: `2px solid ${theme.primary}`,
                            background: "transparent",
                            color: theme.primary,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                          }}
                        >
                          📤 Unarchive Event
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.highlightCard}>
                <div style={styles.highlightTitle}>📦 Archived Events</div>
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
                  Past events that have ended
                </div>
                <div style={{ ...styles.empty, margin: "20px 0 20px 0" }}>
                  No archived events yet.
                </div>
              </div>
            );
          })()}
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
                ⏰ {formatDateOnly(event.date)}
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
        {/* Follow Requests Notification */}
        {followRequestsIncoming && followRequestsIncoming.length > 0 && (
          <div style={{ ...styles.highlightCard, marginTop: -4 }}>
            <div style={{ ...styles.highlightTitle, color: theme.accent }}>🔔 Follow Requests</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {followRequestsIncoming.map((req, idx) => {
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
                        onClick={() => onAcceptFollowRequestFrom && onAcceptFollowRequestFrom(fromKey)}
                      >
                        Accept
                      </button>
                      <button
                        style={{
                          ...styles.cancelButton,
                          padding: "10px 12px",
                          marginTop: 0,
                        }}
                        onClick={() => onDeclineFollowRequestFrom && onDeclineFollowRequestFrom(fromKey)}
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

      {/* Following Users' Joined Events (only in friends view) */}
      {viewMode === "following" && (
        <div style={styles.section} id="following-joined-events">
          <div style={styles.sectionTitle}>👥 Following’ Joined Events</div>
          {Array.isArray(followingEvents) && followingEvents.length > 0 ? (
            <ul style={{ padding: 0 }}>
              {followingEvents.map((fe, i) => (
                <li key={i} style={{ listStyle: "none", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, color: theme.text, marginBottom: 8 }}>
                  {fe.following?.emoji ? fe.following.emoji + " " : ""}
                  {fe.following?.name || fe.following?.username} {fe.following?.country || ""}
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
                      <div style={styles.details}>⏰ {formatDateOnly(ev.date) || String(ev.date || ev.time || "")}</div>
                      {ev.category && (
                        <div style={styles.details}>
                          {getCategoryEmoji(ev.category)} {ev.category}
                        </div>
                      )}
                      {/* Budget hidden in simplified flow */}
                      <button
                        style={{ ...styles.joinButton, padding: "10px 12px", alignSelf: "flex-start", marginTop: 10 }}
                        onClick={() => onRequestJoinEvent && onRequestJoinEvent(fe.following, ev)}
                      >
                        Request to Join
                      </button>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.empty}>No following users’ joined events yet.</div>
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
                        ⏰ {formatDateOnly(item.date) || String(item.date || item.time || "")}
                      </div>
                      {item.category && (
                        <div style={styles.details}>
                          {getCategoryEmoji(item.category)} {item.category}
                        </div>
                      )}
                      <div style={styles.details}>
                        👥 {(() => {
                          const attendeeCount = (item.host ? 1 : 0) + (item.participants?.length || 0);
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
                    ⏰ {formatDateOnly(item.date) || String(item.date || item.time || "")}
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
          setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", endTime: "", description: "", category: "food", languages: [], capacity: 6, imageUrl: "", templateEventId: null, targetInterests: [], targetCiteConnection: [], targetReasons: [] });
          setShowAllLanguages(false);
        }}>
          <div style={{...styles.modal, maxHeight: isMobile ? "90vh" : "85vh", overflowY: "visible", padding: isMobile ? 20 : 32}} onClick={(e) => e.stopPropagation()}>
            
            {/* Progress Indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(step => (
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newEvent.name.trim()) {
                      setCreateEventStep(2);
                    }
                  }}
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
                    onEnterPress={() => {
                      if (newEvent.venue && newEvent.address) {
                        setCreateEventStep(3);
                      }
                    }}
                    initialAddress={newEvent.address}
                    theme={theme}
                    filterMode={newEvent.location === "cite" ? "cite" : "all"}
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
            {createEventStep === 4 && (() => {
              // Get today's date in YYYY-MM-DD format
              const todayStr = new Date().toISOString().split('T')[0];
              
              // Check if selected date is in the past
              const isDateInPast = newEvent.date && newEvent.date < todayStr;
              
              return (
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
                  min={todayStr}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  onKeyDown={(e) => handleEnterKeyPress(e, newEvent.date && !isDateInPast, 5)}
                  style={{ 
                    width: "100%", 
                    padding: isMobile ? 14 : 16, 
                    borderRadius: 14, 
                    border: `2px solid ${isDateInPast ? theme.danger : theme.border}`, 
                    fontSize: isMobile ? 16 : 18, 
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                  autoFocus
                />
                {isDateInPast && (
                  <div style={{
                    marginTop: 12,
                    padding: "10px 12px",
                    background: "rgba(234,43,43,0.1)",
                    border: `2px solid ${theme.danger}`,
                    borderRadius: 10,
                    color: theme.danger,
                    fontSize: 14,
                    fontWeight: 600,
                  }}>
                    ⚠️ Cannot create events in the past. Please select today or a future date.
                  </div>
                )}
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
                      background: (newEvent.date && !isDateInPast) ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                      color: (newEvent.date && !isDateInPast) ? "white" : theme.textMuted,
                      border: "none",
                      borderRadius: 14,
                      padding: isMobile ? "14px" : "16px",
                      fontWeight: 900,
                      fontSize: isMobile ? 16 : 18,
                      cursor: (newEvent.date && !isDateInPast) ? "pointer" : "not-allowed",
                      boxShadow: (newEvent.date && !isDateInPast) ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                    }}
                    onClick={() => newEvent.date && !isDateInPast && setCreateEventStep(5)}
                    disabled={!newEvent.date || isDateInPast}
                  >
                    Next →
                  </button>
                </div>
              </div>
              );
            })()}

            {/* Step 5: Time Range */}
            {createEventStep === 5 && (
              <div 
                style={{ textAlign: "center", ...fadeIn }}
                onKeyDown={(e) => {
                  const toMin = (t) => { try { const [h,m] = t.split(":"); return parseInt(h,10)*60+parseInt(m,10);} catch {return null;} };
                  const invalidRange = newEvent.time && newEvent.endTime && toMin(newEvent.endTime) <= toMin(newEvent.time);
                  handleEnterKeyPress(e, newEvent.time && !invalidRange, 6);
                }}
              >
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  What time does it run? ⏰
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 24 }}>
                  Choose a start time and optionally an end time
                </p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: theme.text }}>Start Time *</p>
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
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: theme.text }}>End Time (optional)</p>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
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
                    />
                  </div>
                </div>
                {newEvent.endTime && newEvent.time && !isValidEndTime(newEvent.time, newEvent.endTime) && (
                  <div style={{ color: "#FF4B4B", fontSize: 13, marginBottom: 8 }}>End time must be after start time.</div>
                )}
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
                  {(() => {
                    const toMin = (t) => { try { const [h,m] = t.split(":"); return parseInt(h,10)*60+parseInt(m,10);} catch {return null;} };
                    const invalidRange = newEvent.time && newEvent.endTime && toMin(newEvent.endTime) <= toMin(newEvent.time);
                    return (
                      <button
                        style={{
                          flex: 1,
                          background: newEvent.time && !invalidRange ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : theme.track,
                          color: newEvent.time && !invalidRange ? "white" : theme.textMuted,
                          border: "none",
                          borderRadius: 14,
                          padding: isMobile ? "14px" : "16px",
                          fontWeight: 900,
                          fontSize: isMobile ? 16 : 18,
                          cursor: newEvent.time && !invalidRange ? "pointer" : "not-allowed",
                          boxShadow: newEvent.time && !invalidRange ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                        }}
                        onClick={() => newEvent.time && !invalidRange && setCreateEventStep(6)}
                        disabled={!newEvent.time || invalidRange}
                      >
                        Next →
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Step 6: Languages */}
            {createEventStep === 6 && (() => {
              // Get user's profile language for personalization
              const getUserProfileLanguage = () => {
                try {
                  const profileData = localStorage.getItem(`userProfile_${userName}`);
                  if (profileData) {
                    const profile = JSON.parse(profileData);
                    if (profile.languages && profile.languages.length > 0) {
                      // Return first language that's not French or English
                      const userLang = profile.languages.find(lang => 
                        lang !== "French" && lang !== "English"
                      );
                      return userLang || "Spanish"; // Fallback to Spanish
                    }
                  }
                } catch (e) {
                  console.log("Could not load user language:", e);
                }
                return "Spanish"; // Default fallback
              };

              const personalizedLanguage = getUserProfileLanguage();
              
              // Common options with personalization
              const commonOptions = [
                { value: "French", emoji: "🇫🇷" },
                { value: "English", emoji: "🇬🇧" },
                { value: personalizedLanguage, emoji: getLanguageEmoji(personalizedLanguage) },
              ];

              // Filter languages for search
              const filteredLanguages = languageSearchQuery.trim() === "" 
                ? FULL_LANGUAGES 
                : FULL_LANGUAGES.filter(lang => 
                    lang.toLowerCase().includes(languageSearchQuery.toLowerCase())
                  );

              return (
                <div style={{ textAlign: "center", ...fadeIn }}>
                  <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                    What languages will you speak? 🗣️
                  </h3>
                  <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 24 }}>
                    Select all languages that will be featured. This helps international students and speakers know if they can join the conversation.
                  </p>
                  
                  {!showAllLanguages ? (
                    <>
                      <p style={{ fontSize: isMobile ? 13 : 14, color: theme.textMuted, marginBottom: 16, fontWeight: 600 }}>
                        Common options
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16 }}>
                        {commonOptions.map(lang => (
                          <button
                            key={lang.value}
                            style={{
                              padding: isMobile ? 16 : 18,
                              borderRadius: 14,
                              border: `3px solid ${newEvent.languages.includes(lang.value) ? theme.primary : theme.border}`,
                              background: newEvent.languages.includes(lang.value) ? theme.primary : theme.card,
                              color: newEvent.languages.includes(lang.value) ? "white" : theme.text,
                              fontSize: isMobile ? 15 : 16,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              boxShadow: newEvent.languages.includes(lang.value) 
                                ? "0 4px 12px rgba(88,204,2,0.3)" 
                                : "none",
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
                              <span style={{ 
                                marginLeft: "auto", 
                                fontSize: 20,
                                fontWeight: 900,
                              }}>✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        style={{
                          width: "100%",
                          padding: isMobile ? "14px" : "16px",
                          borderRadius: 12,
                          border: `2px solid ${theme.border}`,
                          background: "transparent",
                          color: theme.accent,
                          fontSize: isMobile ? 14 : 15,
                          fontWeight: 700,
                          cursor: "pointer",
                          marginBottom: 16,
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          setShowAllLanguages(true);
                          setLanguageSearchQuery("");
                        }}
                      >
                        Browse all languages
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Back to common options button */}
                      <button
                        style={{
                          width: "100%",
                          padding: isMobile ? "10px" : "12px",
                          borderRadius: 10,
                          border: `2px solid ${theme.border}`,
                          background: theme.card,
                          color: theme.text,
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          marginBottom: 16,
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                        onClick={() => {
                          setShowAllLanguages(false);
                          setLanguageSearchQuery("");
                        }}
                      >
                        ← Back to common options
                      </button>

                      {/* Search bar */}
                      <div style={{ marginBottom: 16 }}>
                        <input
                          type="text"
                          placeholder="Search for a language..."
                          value={languageSearchQuery}
                          onChange={(e) => setLanguageSearchQuery(e.target.value)}
                          autoFocus
                          style={{
                            width: "100%",
                            padding: isMobile ? "12px 16px" : "14px 18px",
                            borderRadius: 12,
                            border: `2px solid ${theme.border}`,
                            background: theme.card,
                            color: theme.text,
                            fontSize: isMobile ? 14 : 15,
                            outline: "none",
                            transition: "border 0.2s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = theme.accent}
                          onBlur={(e) => e.target.style.borderColor = theme.border}
                        />
                      </div>

                      {/* Language list */}
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr", 
                        gap: 12, 
                        marginBottom: 16, 
                        maxHeight: 300, 
                        overflowY: "auto",
                        padding: "4px",
                      }}>
                        {filteredLanguages.length > 0 ? (
                          filteredLanguages.map(lang => (
                            <button
                              key={lang}
                              style={{
                                padding: isMobile ? 14 : 16,
                                borderRadius: 12,
                                border: `3px solid ${newEvent.languages.includes(lang) ? theme.primary : theme.border}`,
                                background: newEvent.languages.includes(lang) ? theme.primary : theme.card,
                                color: newEvent.languages.includes(lang) ? "white" : theme.text,
                                fontSize: isMobile ? 14 : 15,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                boxShadow: newEvent.languages.includes(lang) 
                                  ? "0 4px 12px rgba(88,204,2,0.3)" 
                                  : "none",
                              }}
                              onClick={() => {
                                const langs = [...newEvent.languages];
                                const idx = langs.indexOf(lang);
                                if (idx > -1) {
                                  langs.splice(idx, 1);
                                } else {
                                  langs.push(lang);
                                }
                                setNewEvent({...newEvent, languages: langs});
                              }}
                            >
                              <div style={{ fontSize: 24 }}>{getLanguageEmoji(lang)}</div>
                              <span style={{ flex: 1, textAlign: "left" }}>{lang}</span>
                              {newEvent.languages.includes(lang) && (
                                <span style={{ fontSize: 18, fontWeight: 900 }}>✓</span>
                              )}
                            </button>
                          ))
                        ) : (
                          <p style={{ 
                            fontSize: 14, 
                            color: theme.textMuted, 
                            padding: 20,
                            textAlign: "center" 
                          }}>
                            No languages found matching "{languageSearchQuery}"
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {newEvent.languages.length > 0 && (
                    <div style={{ 
                      marginBottom: 16, 
                      padding: 14, 
                      background: theme.card, 
                      borderRadius: 12, 
                      border: `2px solid ${theme.primary}`,
                    }}>
                      <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 10, fontWeight: 600 }}>
                        Selected languages:
                      </p>
                      <div style={{ 
                        display: "flex", 
                        flexWrap: "wrap", 
                        gap: 8,
                      }}>
                        {newEvent.languages.map(lang => (
                          <button
                            key={lang}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 12px",
                              borderRadius: 20,
                              background: theme.primary,
                              color: "white",
                              border: "none",
                              fontSize: isMobile ? 13 : 14,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              boxShadow: "0 2px 6px rgba(88,204,2,0.25)",
                            }}
                            onClick={() => {
                              const langs = newEvent.languages.filter(l => l !== lang);
                              setNewEvent({...newEvent, languages: langs});
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme.primaryDark;
                              e.currentTarget.style.transform = "scale(0.98)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.primary;
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <span>{lang}</span>
                            <span style={{ 
                              fontSize: 16, 
                              fontWeight: 700,
                              opacity: 0.9,
                            }}>✕</span>
                          </button>
                        ))}
                      </div>
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
                        setLanguageSearchQuery("");
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      style={{
                        flex: 1,
                        background: newEvent.languages.length > 0 
                          ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` 
                          : theme.track,
                        color: newEvent.languages.length > 0 ? "white" : theme.textMuted,
                        border: "none",
                        borderRadius: 14,
                        padding: isMobile ? "14px" : "16px",
                        fontWeight: 900,
                        fontSize: isMobile ? 16 : 18,
                        cursor: newEvent.languages.length > 0 ? "pointer" : "not-allowed",
                        boxShadow: newEvent.languages.length > 0 ? "0 6px 16px rgba(88,204,2,0.28)" : "none",
                        transition: "all 0.2s",
                      }}
                      onClick={() => {
                        if (newEvent.languages.length > 0) {
                          setCreateEventStep(7);
                          setShowAllLanguages(false);
                          setLanguageSearchQuery("");
                        }
                      }}
                      disabled={newEvent.languages.length === 0}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              );
            })()}

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
                    onKeyDown={(e) => handleEnterKeyPress(e, newEvent.capacity, 8)}
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
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                      e.preventDefault();
                      setCreateEventStep(9);
                    }
                  }}
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
                          setImageToCrop(reader.result);
                          setShowImageCropper(true);
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
                    onClick={() => setCreateEventStep(10)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 10: Target Interests (Optional) */}
            {createEventStep === 10 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Target specific interests? 🎯
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Choose interests to show this event to people who share them (optional - leave empty for everyone)
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
                  {["Sports", "Music", "Art", "Movies", "Books", "Gaming", "Travel", "Food", "Technology", "Fashion", "Photography", "Fitness"].map((interest) => {
                    const isSelected = newEvent.targetInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        style={{
                          padding: isMobile ? "12px 8px" : "14px 12px",
                          borderRadius: 12,
                          border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                          background: isSelected ? theme.primary : theme.card,
                          color: isSelected ? "white" : theme.text,
                          fontSize: isMobile ? 14 : 15,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setNewEvent({...newEvent, targetInterests: newEvent.targetInterests.filter(i => i !== interest)});
                          } else {
                            setNewEvent({...newEvent, targetInterests: [...newEvent.targetInterests, interest]});
                          }
                        }}
                      >
                        {interest}
                      </button>
                    );
                  })}
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
                    onClick={() => setCreateEventStep(9)}
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
                    onClick={() => setCreateEventStep(11)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 11: Target Cité Connection (Optional) */}
            {createEventStep === 11 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Target by Cité connection? 🏛️
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Show this event only to specific Cité groups (optional - leave empty for everyone)
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 32 }}>
                  {[
                    { value: "yes", label: "🏠 Live on campus", desc: "Current Cité residents" },
                    { value: "alumni", label: "🎓 Alumni", desc: "Former Cité residents" },
                    { value: "visit", label: "🚶 Visit often", desc: "Regular visitors" },
                    { value: "no", label: "❌ No connection", desc: "Not connected to Cité" },
                  ].map((option) => {
                    const isSelected = newEvent.targetCiteConnection.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        style={{
                          padding: isMobile ? 16 : 20,
                          borderRadius: 14,
                          border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                          background: isSelected ? theme.primary : theme.card,
                          color: isSelected ? "white" : theme.text,
                          fontSize: isMobile ? 15 : 16,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left",
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setNewEvent({...newEvent, targetCiteConnection: newEvent.targetCiteConnection.filter(c => c !== option.value)});
                          } else {
                            setNewEvent({...newEvent, targetCiteConnection: [...newEvent.targetCiteConnection, option.value]});
                          }
                        }}
                      >
                        <div>{option.label}</div>
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{option.desc}</div>
                      </button>
                    );
                  })}
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
                    onClick={() => setCreateEventStep(10)}
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
                    onClick={() => setCreateEventStep(12)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 12: Target by What Brings You Here (Optional) */}
            {createEventStep === 12 && (
              <div style={{ textAlign: "center", ...fadeIn }}>
                <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, marginBottom: 12, color: theme.text }}>
                  Target by purpose of stay? ✈️
                </h3>
                <p style={{ fontSize: isMobile ? 14 : 16, color: theme.textMuted, marginBottom: 32 }}>
                  Show this event to specific groups (optional - leave empty for everyone)
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 32 }}>
                  {[
                    { value: "erasmus", label: "🎓 Erasmus / Exchange" },
                    { value: "degree", label: "📚 Degree student" },
                    { value: "working", label: "💼 Working / Internship" },
                    { value: "visiting", label: "✈️ Visiting / Short stay" },
                    { value: "local", label: "🏘️ Local resident" },
                    { value: "other", label: "🌍 Other" },
                  ].map((option) => {
                    const isSelected = newEvent.targetReasons.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        style={{
                          padding: isMobile ? 16 : 20,
                          borderRadius: 14,
                          border: `2px solid ${isSelected ? theme.primary : theme.border}`,
                          background: isSelected ? theme.primary : theme.card,
                          color: isSelected ? "white" : theme.text,
                          fontSize: isMobile ? 15 : 16,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left",
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setNewEvent({...newEvent, targetReasons: newEvent.targetReasons.filter(r => r !== option.value)});
                          } else {
                            setNewEvent({...newEvent, targetReasons: [...newEvent.targetReasons, option.value]});
                          }
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
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
                    onClick={() => setCreateEventStep(11)}
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
                      // Validate end time before creating
                      if (newEvent.time && newEvent.endTime && !isValidEndTime(newEvent.time, newEvent.endTime)) {
                        alert("End time must be after start time");
                        return;
                      }
                      
                      // Create event via API
                      try {
                        console.log("STEP 1: Button clicked, starting event creation");
                        console.log("STEP 2: Current newEvent state:", JSON.stringify(newEvent, null, 2));
                        console.log("STEP 3: Current userName:", userName);
                        
                        const eventData = {
                          name: newEvent.name,
                          location: newEvent.location,
                          venue: newEvent.venue,
                          address: newEvent.address,
                          coordinates: newEvent.coordinates,
                          date: newEvent.date,
                          time: newEvent.time,
                          end_time: newEvent.endTime || null,
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
                          target_interests: newEvent.targetInterests.length > 0 ? newEvent.targetInterests : null,
                          target_cite_connection: newEvent.targetCiteConnection.length > 0 ? newEvent.targetCiteConnection : null,
                          target_reasons: newEvent.targetReasons.length > 0 ? newEvent.targetReasons : null,
                        };
                        
                        console.log("STEP 4: Prepared eventData:", JSON.stringify(eventData, null, 2));
                        console.log("STEP 5: About to call createEvent API...");
                        
                        // Call the API to create the event
                        const result = await createEvent(eventData);
                        
                        console.log("STEP 6: API call successful! Result:", result);
                        console.log("STEP 7: Awarding points...");
                        
                        // Award 3 points for hosting an event
                        if (addPoints) {
                          const newPoints = addPoints(userName, 3);
                          console.log("STEP 8: Points awarded! New total:", newPoints);
                          alert(`🎉 Event created successfully!\n\n⭐ +3 points earned! You now have ${newPoints} points!\n\nYour event will appear in:\n• Your 'My Hosted Events' section\n• Other users' 'Community Events' section`);
                        } else {
                          console.log("STEP 8: No points system available");
                          alert("🎉 Event created successfully!\n\nYour event will appear in:\n• Your 'My Hosted Events' section\n• Other users' 'Community Events' section");
                        }
                        
                        console.log("STEP 9: Resetting form and closing modal...");
                        // Reset form and close
                        setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", endTime: "", description: "", category: "food", languages: [], capacity: 6, imageUrl: "", templateEventId: null, targetInterests: [], targetCiteConnection: [], targetReasons: [] });
                        setCreateEventStep(1);
                        setShowCreateEventModal(false);
                        setShowAllLanguages(false);
                        console.log("STEP 10: Event creation complete!");
                      } catch (err) {
                        console.error("❌ ERROR at some step:");
                        console.error("Error object:", err);
                        console.error("Error message:", err.message);
                        console.error("Error name:", err.name);
                        console.error("Error stack:", err.stack);
                        alert("Failed to create event. Please try again.\n\nError: " + err.message);
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
                setNewEvent({ name: "", location: "cite", venue: "", address: "", coordinates: null, date: "", time: "", endTime: "", description: "", category: "food", languages: [], capacity: 6, imageUrl: "", templateEventId: null });
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
            alignItems: "flex-start",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
            paddingTop: "5vh",
            overflowY: "auto",
            paddingBottom: 100,
          }}
          onClick={() => {
            setEventPreview(null);
            setShowAdminMenu(false);
          }}
        >
          <div 
            style={{
              background: theme.card,
              borderRadius: 18,
              padding: isMobile ? 24 : 32,
              paddingBottom: isMobile ? 100 : 120,
              maxWidth: 600,
              width: "100%",
              maxHeight: "none",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              position: "relative",
              marginBottom: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* COMPONENT 1: HEADER BLOCK */}
            {/* Header with navigation and utility actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <button
                onClick={() => setEventPreview(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: theme.textMuted,
                  padding: 0,
                }}
              >
                ← Back to Events
              </button>
              
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {/* Share button (utility action) */}
                <button
                  onClick={() => {
                    // Share functionality
                    if (navigator.share) {
                      navigator.share({
                        title: eventPreview.name,
                        text: `Join me at ${eventPreview.name}!`,
                        url: window.location.href,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 20,
                    cursor: "pointer",
                    color: theme.textMuted,
                    padding: 0,
                  }}
                >
                  🔗
                </button>
                
                {/* Admin/Host Controls */}
                {(() => {
                  const isAdmin = currentUser?.name === "Admin" || currentUser?.username === "admin" || adminMode || userName === "Admin" || userName === "admin";
                  const isHost = eventPreview?.host?.name === userName || eventPreview?.createdBy === userName;
                  
                  return (isAdmin || isHost) ? (
                  <button
                    onClick={() => {
                      setShowAdminMenu(!showAdminMenu);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: 20,
                      cursor: "pointer",
                      color: theme.textMuted,
                      padding: 0,
                    }}
                  >
                    ⚙️
                  </button>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Admin Dropdown Menu */}
            {showAdminMenu && (
              <div style={{
                position: "absolute",
                top: 70,
                right: 32,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                overflow: "hidden",
                zIndex: 1001,
              }}>
                <button
                  onClick={() => {
                    setShowAdminMenu(false);
                    setAdminEditMode(true);
                    setAdminEditForm({
                      name: eventPreview.name || "",
                      description: eventPreview.description || "",
                      location: eventPreview.location || "cite",
                      venue: eventPreview.venue || "",
                      address: eventPreview.address || "",
                      coordinates: eventPreview.coordinates || null,
                      date: eventPreview.date || "",
                      time: eventPreview.time || "",
                      category: eventPreview.category || "food",
                      languages: Array.isArray(eventPreview.languages) ? eventPreview.languages.slice() : [],
                      capacity: eventPreview.capacity || null,
                      imageUrl: eventPreview.imageUrl || "",
                    });
                  }}
                  style={{
                    width: "100%",
                    background: "white",
                    color: theme.text,
                    border: "none",
                    padding: "12px 20px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: "1px solid #eee",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  ✏️ Edit Event
                </button>
                <button
                  onClick={() => {
                    setShowAdminMenu(false);
                    alert("Manage Co-Hosts feature coming soon!");
                  }}
                  style={{
                    width: "100%",
                    background: "white",
                    color: theme.text,
                    border: "none",
                    padding: "12px 20px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: "1px solid #eee",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  👥 Manage Co-Hosts
                </button>
                <button
                  onClick={async () => {
                    setShowAdminMenu(false);
                    if (window.confirm("Archive this event? It will be moved to the Archive tab and hidden from the main feed.")) {
                      try {
                        await archiveEvent(eventPreview.id, userName);
                        alert("Event archived successfully!");
                        setEventPreview(null);
                        window.location.reload();
                      } catch (error) {
                        console.error("Failed to archive:", error);
                        alert("Failed to archive event: " + error.message);
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    background: "white",
                    color: theme.text,
                    border: "none",
                    padding: "12px 20px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: "1px solid #eee",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  📦 Archive Event
                </button>
                <button
                  onClick={async () => {
                    setShowAdminMenu(false);
                    if (window.confirm("⚠️ Delete this event permanently? This cannot be undone!")) {
                      try {
                        const { default: api } = await import("./api");
                        await api.deleteEvent(eventPreview.id, userName);
                        alert("Event deleted successfully!");
                        setEventPreview(null);
                        window.location.reload();
                      } catch (error) {
                        console.error("Failed to delete:", error);
                        alert("Failed to delete event: " + error.message);
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    background: "white",
                    color: "#EA2B2B",
                    border: "none",
                    padding: "12px 20px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#FEE"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  🗑️ Delete Event
                </button>
              </div>
            )}

            {/* Event Title - Large, prominent */}
            <h2 style={{ 
              fontSize: isMobile ? 24 : 28, 
              fontWeight: 900, 
              color: theme.text, 
              marginBottom: 20,
              lineHeight: 1.2,
            }}>
              {eventPreview.name}
            </h2>

            {/* Event Banner Image */}
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

            {/* Host Badge - Prominent positioning near title */}
            {(() => {
              const getHostInfo = () => {
                if (eventPreview.host) {
                  return eventPreview.host;
                } else if (eventPreview.createdBy) {
                  return users.find(u => u.name === eventPreview.createdBy || u.username === eventPreview.createdBy);
                }
                return null;
              };
              
              const hostInfo = getHostInfo();
              
              if (!hostInfo) return null;
              
              return (
                <div style={{ 
                  background: theme.bg, 
                  padding: 16, 
                  borderRadius: 12, 
                  marginBottom: 20,
                  border: `1px solid ${theme.border}`,
                }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 800, 
                    color: theme.textMuted, 
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    👤 HOSTED BY
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>
                    {hostInfo.emoji || ""} {hostInfo.name} {hostInfo.country || ""}
                  </div>
                  {hostInfo.bio && (
                    <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 6, fontStyle: "italic" }}>
                      "{hostInfo.bio}"
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Logistics Bar - Scannable list with emojis */}
            <div style={{ 
              marginBottom: 20,
              display: "grid",
              gap: 12,
            }}>
              {/* Date & Time */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>
                    {eventPreview.date || "TBA"}
                  </div>
                  {eventPreview.time && (
                    <div style={{ fontSize: 14, color: theme.textMuted }}>
                      {eventPreview.time}
                      {eventPreview.endTime && ` – ${eventPreview.endTime}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {eventPreview.location && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>
                      {eventPreview.location === "cite" ? "Cité Internationale" : eventPreview.location === "paris" ? "Paris" : eventPreview.location}
                    </div>
                    {eventPreview.venue && (
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 2 }}>
                        {eventPreview.venue}
                      </div>
                    )}
                    {eventPreview.address && (
                      <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2, lineHeight: 1.4 }}>
                        {formatAddressForDisplay(eventPreview.address)}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Category */}
              {eventPreview.category && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>
                    {getCategoryEmoji(eventPreview.category)} {eventPreview.category}
                  </div>
                </div>
              )}
            </div>

            {/* COMPONENT 2: DESCRIPTION BLOCK */}
            {/* Languages - If present, show prominently */}
            {eventPreview.languages && eventPreview.languages.length > 0 && (
              <div style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                padding: "16px 20px",
                borderRadius: 12,
                marginBottom: 20,
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

            {/* Description - Formatted for scannability */}
            {eventPreview.description && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 800, 
                  color: theme.textMuted, 
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  📝 ABOUT THIS EVENT
                </div>
                <div style={{ 
                  fontSize: 15, 
                  color: theme.text, 
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  background: theme.bg,
                  padding: 18,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                }}>
                  {eventPreview.description}
                </div>
              </div>
            )}

            {/* Admin Edit Form */}
            {adminMode && adminEditMode && adminEditForm && (
              <div style={{
                marginBottom: 20,
                background: "#F9FAFB",
                border: "1px solid #EEF2F7",
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#1CB0F6", marginBottom: 10 }}>Admin Edit</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label style={{ fontWeight: 800, fontSize: 13 }}>Name</label>
                    <input type="text" value={adminEditForm.name} onChange={(e)=>setAdminEditForm(prev=>({...prev,name:e.target.value}))} style={{ width:"100%", padding:10, border:"1px solid #EEF2F7", borderRadius:10 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontWeight: 800, fontSize: 13 }}>Date</label>
                      <input type="date" value={adminEditForm.date} onChange={(e)=>setAdminEditForm(prev=>({...prev,date:e.target.value}))} style={{ width:"100%", padding:10, border:"1px solid #EEF2F7", borderRadius:10 }} />
                    </div>
                    <div>
                      <label style={{ fontWeight: 800, fontSize: 13 }}>Time</label>
                      <input type="time" value={adminEditForm.time} onChange={(e)=>setAdminEditForm(prev=>({...prev,time:e.target.value}))} style={{ width:"100%", padding:10, border:"1px solid #EEF2F7", borderRadius:10 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: 800, fontSize: 13 }}>📍 Venue & Address</label>
                    <LocationPicker
                      theme={theme}
                      initialAddress={adminEditForm.venue || adminEditForm.address || ""}
                      initialCoordinates={adminEditForm.coordinates || null}
                      filterMode="all"
                      onLocationSelect={(location) => {
                        setAdminEditForm(prev => ({
                          ...prev,
                          venue: location.name,
                          address: location.address,
                          coordinates: { lat: location.lat, lng: location.lng }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 800, fontSize: 13 }}>Description</label>
                    <textarea rows={3} value={adminEditForm.description} onChange={(e)=>setAdminEditForm(prev=>({...prev,description:e.target.value}))} style={{ width:"100%", padding:10, border:"1px solid #EEF2F7", borderRadius:10, resize:"vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => { setAdminEditMode(false); setAdminEditForm(null); }}
                      style={{ background: "#6B7280", color:"white", border:"none", borderRadius:10, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}
                    >Cancel</button>
                    <button
                      onClick={async () => {
                        try {
                          const payload = {
                            name: adminEditForm.name,
                            description: adminEditForm.description || "",
                            location: adminEditForm.location || (eventPreview.location || "cite"),
                            venue: adminEditForm.venue || "",
                            address: adminEditForm.address || "",
                            coordinates: adminEditForm.coordinates || null,
                            date: adminEditForm.date || "",
                            time: adminEditForm.time || "",
                            category: adminEditForm.category || (eventPreview.category || "food"),
                            languages: Array.isArray(adminEditForm.languages) ? adminEditForm.languages : [],
                            is_public: eventPreview.isPublic !== undefined ? eventPreview.isPublic : true,
                            event_type: eventPreview.type || "custom",
                            capacity: adminEditForm.capacity || null,
                            image_url: adminEditForm.imageUrl || "",
                            created_by: eventPreview.createdBy || userName,
                          };
                          await updateEvent(eventPreview.id, payload);
                          // Reflect changes locally in preview UI
                          setEventPreview(prev => prev ? ({
                            ...prev,
                            name: payload.name,
                            description: payload.description,
                            address: payload.address,
                            date: payload.date,
                            time: payload.time,
                            category: payload.category,
                            languages: payload.languages,
                            imageUrl: payload.image_url || prev.imageUrl,
                          }) : prev);
                          setAdminEditMode(false);
                          setAdminEditForm(null);
                          alert("Event updated");
                        } catch (err) {
                          console.error("Failed to update event", err);
                          alert("Failed to update event: " + (err?.message || String(err)));
                        }
                      }}
                      style={{ background: "#58CC02", color:"white", border:"none", borderRadius:10, padding:"10px 14px", fontWeight:900, cursor:"pointer", boxShadow:"0 6px 16px rgba(88,204,2,0.28)" }}
                    >Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* COMPONENT 3: PARTICIPANTS BLOCK */}
            {/* Participants - Visual avatars with social proof */}
            {(() => {
              // Combine host and participants, avoiding duplicates
              const allParticipants = [];
              if (eventPreview.host) {
                allParticipants.push(eventPreview.host.name);
              }
              if (eventPreview.participants) {
                eventPreview.participants.forEach(p => {
                  const pName = typeof p === 'string' ? p : p.name;
                  if (!allParticipants.includes(pName)) {
                    allParticipants.push(p);
                  }
                });
              }
              
              if (allParticipants.length === 0) return null;
              
              return (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 800, 
                    color: theme.textMuted, 
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    👥 PARTICIPANTS ({allParticipants.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {allParticipants.slice(0, 10).map((member, i) => {
                      const userInfo = typeof member === "object" && member !== null
                        ? member
                        : users.find((u) => u.name === member || u.username === member) || { name: member };
                      return (
                        <div key={i} style={{
                          background: theme.bg,
                          padding: "10px 16px",
                          borderRadius: 999,
                          fontSize: 15,
                          fontWeight: 600,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                          {userInfo.emoji && <span style={{ fontSize: 18 }}>{userInfo.emoji}</span>}
                          <span>{userInfo.name}</span>
                        </div>
                      );
                    })}
                    {allParticipants.length > 10 && (
                      <div style={{
                        background: theme.bg,
                        padding: "10px 16px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.textMuted,
                        border: `1px solid ${theme.border}`,
                      }}>
                        +{allParticipants.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              {/* Join This Event Button */}
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
              
              {/* For featured events, also show "Create Your Own" button */}
              {(eventPreview.isFeatured || (eventPreview.createdBy && eventPreview.createdBy.toLowerCase() === 'admin')) && (
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
                      endTime: "",
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
              )}
              
              {adminMode && !adminEditMode && (
                <button
                  style={{
                    padding: "16px 24px",
                    background: "#1CB0F6",
                    color: "white",
                    border: "none",
                    borderRadius: 14,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // open edit mode (duplicate of top edit button for convenience)
                    setAdminEditMode(true);
                    setAdminEditForm({
                      name: eventPreview.name || "",
                      description: eventPreview.description || "",
                      location: eventPreview.location || "cite",
                      venue: eventPreview.venue || "",
                      address: eventPreview.address || "",
                      coordinates: eventPreview.coordinates || null,
                      date: eventPreview.date || "",
                      time: eventPreview.time || "",
                      endTime: eventPreview.endTime || "",
                      category: eventPreview.category || "food",
                      languages: Array.isArray(eventPreview.languages) ? eventPreview.languages.slice() : [],
                      capacity: eventPreview.capacity || null,
                      imageUrl: eventPreview.imageUrl || "",
                    });
                  }}
                >
                  ✏️ Edit
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
                        ⏰ {event.time}{event.endTime ? `–${event.endTime}` : ""}
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
          <div style={{ fontSize: 12, fontWeight: activeBottomTab === "events" ? 700 : 600 }}>
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
          <div style={{ fontSize: 12, fontWeight: activeBottomTab === "explore" ? 700 : 600 }}>
            Explore
          </div>
        </button>

        <button
          onClick={() => {
            setShowCreateEventModal(true);
            if (showOnboardingTooltip) {
              setShowOnboardingTooltip(false);
              localStorage.setItem('hasSeenOnboardingTooltip', 'true');
            }
          }}
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
            position: "relative",
          }}
        >
          +
          {showOnboardingTooltip && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 12px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: theme.text,
              color: "white",
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              zIndex: 1001,
              animation: "tooltipBounce 0.6s ease-in-out infinite",
            }}>
              Tap + to create your first hangout
              <div style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: `6px solid ${theme.text}`,
              }} />
            </div>
          )}
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
          <div style={{ fontSize: 12, fontWeight: activeBottomTab === "calendar" ? 700 : 600 }}>
            Calendar
          </div>
        </button>

        <button
          onClick={() => {
            setActiveBottomTab("following");
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
            color: activeBottomTab === "following" ? theme.primary : theme.textMuted,
          }}
        >
          <div style={{ fontSize: 24 }}>👥</div>
          <div style={{ fontSize: 12, fontWeight: activeBottomTab === "following" ? 700 : 600 }}>
            Following
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

      {/* Notifications Inbox Modal */}
      {showNotificationsInbox && (
        <NotificationsInbox
          currentUser={currentUser}
          notifications={notificationsData}
          onClose={() => setShowNotificationsInbox(false)}
          onViewProfile={() => {
            setActiveBottomTab("profile");
            onEditProfile && onEditProfile();
          }}
          onViewPublicProfile={() => {
            // Close notifications first
            setShowNotificationsInbox(false);
            // Force show public profile view, not edit mode
            if (onUserClick) {
              // Pass a flag or create a modified user object to bypass the edit check
              const userForPublicView = { ...currentUser, _forcePublicView: true };
              onUserClick(userForPublicView);
            }
          }}
          onSignOut={onSignOut}
          onEventClick={(event) => {
            if (onJoinedEventClick) {
              onJoinedEventClick(event);
            }
          }}
          onMarkAsRead={() => {
            if (onRefreshNotifications) {
              onRefreshNotifications();
            }
          }}
          allEvents={publicEvents}
          followRequests={followRequestsIncoming}
          onAcceptFollowRequest={onAcceptFollowRequestFrom}
          onDeclineFollowRequest={onDeclineFollowRequestFrom}
        />
      )}

      {/* Image Cropper Modal */}
      {showImageCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={(croppedImage) => {
            setNewEvent({...newEvent, imageUrl: croppedImage});
            setShowImageCropper(false);
            setImageToCrop(null);
          }}
          onCancel={() => {
            setShowImageCropper(false);
            setImageToCrop(null);
          }}
          theme={theme}
        />
      )}

      {/* Paris Trees Modal */}
      {showParisTreesModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20,
          }}
          onClick={() => {
            setShowParisTreesModal(false);
            setSelectedTree(null);
            setParisTreesView("selection");
          }}
        >
          <div 
            style={{
              background: theme.card,
              borderRadius: 24,
              maxWidth: 600,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 16px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {parisTreesView === "tree" && (
                  <button
                    onClick={() => {
                      setParisTreesView("selection");
                      setSelectedTree(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.text,
                      fontSize: 24,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    ←
                  </button>
                )}
                <h2 style={{ 
                  fontSize: 24, 
                  fontWeight: 900, 
                  color: theme.text,
                  margin: 0,
                }}>
                  {parisTreesView === "selection" ? "🌳 Paris Trees" : `${selectedTree === 'bars' ? '🍺 Bars' : selectedTree === 'clubs' ? '💃 Clubs' : '🏛️ Cité'} Tree`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowParisTreesModal(false);
                  setSelectedTree(null);
                  setParisTreesView("selection");
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textMuted,
                  fontSize: 28,
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24 }}>
              {parisTreesView === "selection" ? (
                // Tree Selection View
                <div>
                  <p style={{ 
                    fontSize: 16, 
                    color: theme.textMuted, 
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}>
                    Choose your path to explore Paris! Each tree contains venues you can discover and visit.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Bars Tree */}
                    <div
                      onClick={() => {
                        setSelectedTree('bars');
                        setParisTreesView('tree');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: 18,
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(240, 147, 251, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 147, 251, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(240, 147, 251, 0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 48 }}>🍺</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 8px 0' }}>
                            Bars Tree
                          </h3>
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                            Discover the best bars in Paris
                          </p>
                        </div>
                        <div style={{ fontSize: 24, color: 'white' }}>→</div>
                      </div>
                    </div>

                    {/* Clubs Tree */}
                    <div
                      onClick={() => {
                        setSelectedTree('clubs');
                        setParisTreesView('tree');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 18,
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 48 }}>💃</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 8px 0' }}>
                            Clubs Tree
                          </h3>
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                            Experience Paris nightlife
                          </p>
                        </div>
                        <div style={{ fontSize: 24, color: 'white' }}>→</div>
                      </div>
                    </div>

                    {/* Cité Tree */}
                    <div
                      onClick={() => {
                        setSelectedTree('cite');
                        setParisTreesView('tree');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #58CC02 0%, #37B300 100%)',
                        borderRadius: 18,
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(88, 204, 2, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(88, 204, 2, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 204, 2, 0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 48 }}>🏛️</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 8px 0' }}>
                            Cité Tree
                          </h3>
                          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                            Explore Cité Universitaire venues
                          </p>
                        </div>
                        <div style={{ fontSize: 24, color: 'white' }}>→</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Individual Tree View - Duolingo Style
                <div>
                  <p style={{ 
                    fontSize: 16, 
                    color: theme.textMuted, 
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}>
                    Click on any venue to learn more and find events there!
                  </p>
                  
                  {/* Duolingo-style tree path */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 32,
                    position: 'relative',
                    paddingTop: 20,
                  }}>
                    {/* Connecting line */}
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: `linear-gradient(180deg, ${theme.border} 0%, transparent 100%)`,
                      transform: 'translateX(-50%)',
                      zIndex: 0,
                    }} />

                    {/* Venue nodes */}
                    {(selectedTree === 'bars' ? [
                      { name: 'Le Fleurus', emoji: '🍺', description: 'Cozy bar near Cité Universitaire' },
                      { name: 'Violon Dingue', emoji: '🎻', description: 'Live music and great atmosphere' },
                      { name: 'Le Crocodile', emoji: '🐊', description: 'Hidden gem with unique cocktails' },
                      { name: 'Frog & Princess', emoji: '🐸', description: 'English pub with craft beers' },
                      { name: 'Le Pantalon', emoji: '👖', description: 'Student-friendly bar' },
                    ] : selectedTree === 'clubs' ? [
                      { name: 'Rex Club', emoji: '🎧', description: 'Legendary techno club' },
                      { name: 'Concrete', emoji: '🏗️', description: 'Floating club on the Seine' },
                      { name: 'Badaboum', emoji: '💥', description: 'Electronic music venue' },
                      { name: 'La Machine', emoji: '⚙️', description: 'Industrial-style nightclub' },
                      { name: 'Supersonic', emoji: '🚀', description: 'Alternative and rock club' },
                    ] : [
                      { name: 'Maison du Brésil', emoji: '🇧🇷', description: 'Brazilian house with parties' },
                      { name: 'Maison du Cambodge', emoji: '🇰🇭', description: 'Cambodian cultural center' },
                      { name: 'Maison d\'Italie', emoji: '🇮🇹', description: 'Italian house events' },
                      { name: 'Fondation Deutsch', emoji: '🏛️', description: 'Modern residence hall' },
                      { name: 'Maison des USA', emoji: '🇺🇸', description: 'American house gatherings' },
                    ]).map((venue, index) => {
                      const completedVenues = treeProgress[selectedTree] || [];
                      const isCompleted = completedVenues.includes(index);
                      const isUnlocked = index === 0 || completedVenues.includes(index - 1);
                      const isLocked = !isUnlocked && !isCompleted;
                      
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (isUnlocked || isCompleted) {
                              setSelectedVenue({ ...venue, index, tree: selectedTree });
                              setShowVenueModal(true);
                            }
                          }}
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            transform: index % 2 === 0 ? 'translateX(-40px)' : 'translateX(40px)',
                            opacity: isLocked ? 0.5 : 1,
                          }}
                        >
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              background: isCompleted
                                ? 'linear-gradient(135deg, #58CC02, #37B300)'
                                : isUnlocked
                                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                : 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 36,
                              boxShadow: isLocked 
                                ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                                : '0 6px 20px rgba(0, 0, 0, 0.15)',
                              transition: 'all 0.3s ease',
                              border: `4px solid ${theme.card}`,
                              filter: isLocked ? 'grayscale(100%)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (!isLocked) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLocked) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                              }
                            }}
                          >
                            {isLocked ? '🔒' : venue.emoji}
                          </div>
                          <div style={{
                            marginTop: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            color: isLocked ? theme.textMuted : theme.text,
                            textAlign: 'center',
                            maxWidth: 100,
                          }}>
                            {isLocked ? '???' : venue.name}
                          </div>
                          {isCompleted && (
                            <div style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              background: '#58CC02',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              boxShadow: '0 2px 8px rgba(88, 204, 2, 0.4)',
                            }}>
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Trophy at the end */}
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      marginTop: 20,
                    }}>
                      <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
                        border: `4px solid ${theme.card}`,
                      }}>
                        🏆
                      </div>
                      <div style={{
                        marginTop: 12,
                        fontSize: 15,
                        fontWeight: 900,
                        color: theme.text,
                        textAlign: 'center',
                      }}>
                        Complete All!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Venue Detail Modal */}
      {showVenueModal && selectedVenue && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: 20,
          }}
          onClick={() => {
            setShowVenueModal(false);
            setVenueModalView("options");
          }}
        >
          <div
            style={{
              background: theme.card,
              borderRadius: 24,
              maxWidth: venueModalView === "details" ? 600 : 500,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {venueModalView === "options" ? (
              // Initial view with full details AND three action options
              <>
                {/* Header with gradient */}
                <div style={{
                  background: treeProgress[selectedVenue.tree]?.includes(selectedVenue.index)
                    ? 'linear-gradient(135deg, #58CC02, #37B300)'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  padding: '32px 24px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 72, marginBottom: 12 }}>
                    {selectedVenue.emoji}
                  </div>
                  <h2 style={{ 
                    fontSize: 28, 
                    fontWeight: 900, 
                    color: 'white',
                    margin: 0,
                  }}>
                    {selectedVenue.name}
                  </h2>
                  <p style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.9)',
                    margin: '8px 0 0 0',
                  }}>
                    {selectedVenue.description}
                  </p>
                </div>

                {/* Content with full details */}
                <div style={{ padding: 24 }}>
                  {/* Location Details section */}
                  <div style={{
                    background: theme.bg,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: theme.textMuted,
                      letterSpacing: '0.5px',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      📍 Location Details
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 20 }}>📍</div>
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>
                            {selectedTree === 'bars' ? 'Bar & Restaurant' : selectedTree === 'clubs' ? 'Nightclub' : 'Cultural Center'}
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: 14 }}>
                            Paris, France
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 20 }}>🕒</div>
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>
                            {selectedTree === 'bars' ? 'Open Daily' : selectedTree === 'clubs' ? 'Thu-Sat Nights' : 'Various Events'}
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: 14 }}>
                            Check for specific hours
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About section */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: theme.textMuted,
                      letterSpacing: '0.5px',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      📝 About
                    </div>
                    <p style={{
                      fontSize: 15,
                      color: theme.text,
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {selectedVenue.name} is a popular spot in Paris. {selectedVenue.description}
                      {selectedTree === 'bars' && ' Perfect for meeting friends and enjoying drinks in a relaxed atmosphere.'}
                      {selectedTree === 'clubs' && ' Experience the vibrant Paris nightlife scene with great music and atmosphere.'}
                      {selectedTree === 'cite' && ' A great place to connect with the international student community.'}
                    </p>
                  </div>

                  {/* Tips section */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: theme.text,
                      letterSpacing: '0.5px',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      💡 Tips
                    </div>
                    <ul style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: theme.text,
                      fontSize: 15,
                      lineHeight: 1.8,
                    }}>
                      <li>Bring your student ID for potential discounts</li>
                      <li>Best to visit with friends from Cité</li>
                      <li>Check their social media for special events</li>
                      <li>Take a photo to mark your visit complete!</li>
                    </ul>
                  </div>

                  {treeProgress[selectedVenue.tree]?.includes(selectedVenue.index) ? (
                    // Already completed
                    <div style={{
                      background: 'linear-gradient(135deg, #58CC02, #37B300)',
                      borderRadius: 16,
                      padding: '16px 24px',
                      textAlign: 'center',
                      marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                      <div style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>
                        Completed!
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 }}>
                        You've visited this venue
                      </div>
                    </div>
                  ) : (
                    // Three action buttons
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* I'm Interested */}
                      <button
                        onClick={() => setVenueModalView("details")}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          border: 'none',
                          borderRadius: 16,
                          padding: '16px 24px',
                          color: 'white',
                          fontSize: 18,
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
                        }}
                      >
                        💡 I'm Interested
                      </button>

                      {/* Already Done */}
                      <button
                        onClick={() => {
                          const newProgress = { ...treeProgress };
                          if (!newProgress[selectedVenue.tree]) {
                            newProgress[selectedVenue.tree] = [];
                          }
                          if (!newProgress[selectedVenue.tree].includes(selectedVenue.index)) {
                            newProgress[selectedVenue.tree] = [...newProgress[selectedVenue.tree], selectedVenue.index];
                            setTreeProgress(newProgress);
                            localStorage.setItem('parisTreesProgress', JSON.stringify(newProgress));
                          }
                          setShowVenueModal(false);
                          setVenueModalView("options");
                        }}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #58CC02, #37B300)',
                          border: 'none',
                          borderRadius: 16,
                          padding: '16px 24px',
                          color: 'white',
                          fontSize: 18,
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 6px 20px rgba(88, 204, 2, 0.3)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(88, 204, 2, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(88, 204, 2, 0.3)';
                        }}
                      >
                        ✓ Mark as Visited
                      </button>

                      {/* Find Alternative */}
                      <button
                        onClick={() => {
                          // Get a random alternative venue from the same tree
                          const alternatives = venueAlternatives[selectedVenue.tree];
                          const randomIndex = Math.floor(Math.random() * alternatives.length);
                          const alternative = alternatives[randomIndex];
                          
                          // Replace current venue with alternative
                          setSelectedVenue({
                            ...alternative,
                            index: selectedVenue.index,
                            tree: selectedVenue.tree,
                            isAlternative: true
                          });
                          
                          // Don't close modal, just update the venue shown
                          setVenueModalView("options");
                        }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: `2px solid ${theme.border}`,
                          borderRadius: 16,
                          padding: '14px 24px',
                          color: theme.text,
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme.bg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        🔄 Find Alternative
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowVenueModal(false);
                      setVenueModalView("options");
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 16,
                      padding: '12px 24px',
                      color: theme.textMuted,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 12,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.textMuted;
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              // Detailed view - Event preview style
              <>
                {/* Header with back button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: `1px solid ${theme.border}`,
                }}>
                  <button
                    onClick={() => setVenueModalView("options")}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.text,
                      fontSize: 24,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 700,
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      setShowVenueModal(false);
                      setVenueModalView("options");
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.textMuted,
                      fontSize: 28,
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Content - Event preview style */}
                <div style={{ padding: 24 }}>
                  {/* Hero section */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 72, marginBottom: 12 }}>
                      {selectedVenue.emoji}
                    </div>
                    <h2 style={{ 
                      fontSize: 28, 
                      fontWeight: 900, 
                      color: theme.text,
                      margin: '0 0 8px 0',
                    }}>
                      {selectedVenue.name}
                    </h2>
                    <p style={{
                      fontSize: 15,
                      color: theme.textMuted,
                      margin: 0,
                    }}>
                      {selectedVenue.description}
                    </p>
                  </div>

                  {/* Logistics section - styled like event preview */}
                  <div style={{
                    background: theme.bg,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: theme.textMuted,
                      letterSpacing: '0.5px',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      📍 Location Details
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 20 }}>📍</div>
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>
                            {selectedTree === 'bars' ? 'Bar & Restaurant' : selectedTree === 'clubs' ? 'Nightclub' : 'Cultural Center'}
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: 14 }}>
                            Paris, France
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 20 }}>🕒</div>
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>
                            {selectedTree === 'bars' ? 'Open Daily' : selectedTree === 'clubs' ? 'Thu-Sat Nights' : 'Various Events'}
                          </div>
                          <div style={{ color: theme.textMuted, fontSize: 14 }}>
                            Check for specific hours
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About section */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: theme.textMuted,
                      letterSpacing: '0.5px',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      📝 About
                    </div>
                    <p style={{
                      fontSize: 15,
                      color: theme.text,
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
                      {selectedVenue.name} is a popular spot in Paris. {selectedVenue.description}
                      {selectedTree === 'bars' && ' Perfect for meeting friends and enjoying drinks in a relaxed atmosphere.'}
                      {selectedTree === 'clubs' && ' Experience the vibrant Paris nightlife scene with great music and atmosphere.'}
                      {selectedTree === 'cite' && ' A great place to connect with the international student community.'}
                    </p>
                  </div>

                  {/* Tips section */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: theme.text,
                      letterSpacing: '0.5px',
                      marginBottom: 12,
                      textTransform: 'uppercase',
                    }}>
                      💡 Tips
                    </div>
                    <ul style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: theme.text,
                      fontSize: 15,
                      lineHeight: 1.8,
                    }}>
                      <li>Bring your student ID for potential discounts</li>
                      <li>Best to visit with friends from Cité</li>
                      <li>Check their social media for special events</li>
                      <li>Take a photo to mark your visit complete!</li>
                    </ul>
                  </div>

                  {/* Action section */}
                  <div style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: theme.textMuted,
                    letterSpacing: '0.5px',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}>
                    🎯 What would you like to do?
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {/* Join Active Hangout */}
                    <button
                      onClick={() => {
                        // TODO: Show active hangouts at this venue
                        setShowVenueModal(false);
                        setVenueModalView("options");
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none',
                        borderRadius: 16,
                        padding: '20px 24px',
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 32 }}>👥</div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                            Join Active Hangout
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 400, opacity: 0.9 }}>
                            Find people already planning to go
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Create New Hangout */}
                    <button
                      onClick={() => {
                        // TODO: Open create hangout modal with venue pre-filled
                        setShowVenueModal(false);
                        setVenueModalView("options");
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #58CC02, #37B300)',
                        border: 'none',
                        borderRadius: 16,
                        padding: '20px 24px',
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(88, 204, 2, 0.3)',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(88, 204, 2, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(88, 204, 2, 0.3)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 32 }}>✨</div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                            Create New Hangout
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 400, opacity: 0.9 }}>
                            Start a new gathering at this venue
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialHome;