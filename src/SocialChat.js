import React, { useState, useEffect, useRef } from "react";
import * as api from "./api";

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
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [showManageHostsModal, setShowManageHostsModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const chatBoxRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [templateEvent, setTemplateEvent] = useState(null);
  const [relatedHangouts, setRelatedHangouts] = useState([]);
  const [editedEvent, setEditedEvent] = useState({
    name: event?.name || "",
    location: event?.location || "cite",
    date: event?.date || "",
    time: event?.time || "",
    description: event?.description || "",
    category: event?.category || "food",
    languages: event?.languages || [],
    imageUrl: event?.imageUrl || "",
  });

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

  const sendMsg = () => {
    if (!input.trim()) return;
    const msg = { from: currentUser, text: input.trim() };
    setMessages((m) => [...m, msg]);
    setInput("");
    onSendMessage && onSendMessage(msg);
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages update
    const box = chatBoxRef.current;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages]);

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
      marginBottom: 20,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 900,
      color: theme.text,
      marginBottom: 16,
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
      alignItems: "center",
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
      {/* Back Button - Fixed at top */}
      <div style={{
        position: "sticky",
        top: 0,
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
          Event
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
        {/* Event Title with Edit Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={styles.eventTitle}>{event?.name || "Event"}</h1>
          
          {/* Edit/Options Button - Only for host */}
          {event?.host && event.host.name === currentUser && (
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
                        color: "#FF4B4B",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                          setShowOptionsMenu(false);
                          if (onDeleteEvent) {
                            await onDeleteEvent(event);
                          }
                        }
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#FFF5F5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <span>🗑️</span> Delete Event
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Featured Event Notice - Only show for actual featured events */}
        {event?.isFeatured && (
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px 24px",
            borderRadius: theme.radius,
            marginBottom: 24,
            boxShadow: "0 4px 16px rgba(102,126,234,0.25)",
          }}>
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: "white",
              marginBottom: 8,
            }}>
              🎉 Featured Main Event
            </div>
            <div style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 16,
              lineHeight: 1.5,
            }}>
              Organize a language exchange or hangout related to this event! Create a pre-drinks, coffee meetup, or post-event gathering with your preferred time and languages.
            </div>
            <button
              style={{
                background: "white",
                color: "#667eea",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                width: "100%",
              }}
              onClick={() => {
                if (onCreateHangout) {
                  onCreateHangout(event);
                } else {
                  onHome();
                }
              }}
            >
              ✨ Create Hangout
            </button>
          </div>
        )}

        {/* Event Meta Information */}
        <div style={{ marginBottom: 24 }}>
          {event?.location && (
            <div style={styles.metaRow}>
              <span style={styles.metaIcon}>📍</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {event.location === "cite" ? "Cité Internationale" : event.location === "paris" ? "Paris" : event.location}
                </div>
                {(event.venue || event.address) && (
                  <div style={{ fontSize: 14, color: "#8B8B8B" }}>
                    {event.venue && <div>{event.venue}</div>}
                    {event.address && <div>{event.address}</div>}
                  </div>
                )}
                
                {/* Small Map Preview */}
                {event.coordinates && event.coordinates.lat && event.coordinates.lng && (
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
                      overflow: 'hidden'
                    }}
                  />
                )}
              </div>
            </div>
          )}
          
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>📅</span>
            <span>{event?.date ? `${event.date} at ${event.time}` : event?.time}</span>
          </div>
        </div>

        {/* Languages Section - Prominent Display */}
        {event?.languages && event.languages.length > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
            padding: "20px 24px",
            borderRadius: theme.radius,
            marginBottom: 24,
            boxShadow: "0 4px 16px rgba(88,204,2,0.25)",
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
                  <span>{templateEvent.date}</span>
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
        {event?.isFeatured && relatedHangouts.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              🎪 Related Hangouts ({relatedHangouts.length})
            </div>
            <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>
              People have organized these gatherings based on this event:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedHangouts.map((hangout) => (
                <div
                  key={hangout.id}
                  style={{
                    ...styles.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: theme.name === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)',
                    border: `1px solid ${theme.name === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
                  }}
                  onClick={() => {
                    if (onEventClick) onEventClick(hangout);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
                    {hangout.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: theme.textMuted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📍</span>
                      <span>{hangout.location || 'Cité'} · {hangout.venue || 'Venue TBD'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⏰</span>
                      <span>{hangout.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🎯</span>
                      <span>{hangout.category || 'social'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>👥</span>
                      <span>{Math.max(hangout.eventParticipants?.length || 0, 1)} attendees</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host Section */}
        {event?.host && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👤 Hosted by</div>
            <div 
              style={styles.hostCard}
              onClick={() => onUserClick && onUserClick(event.host)}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={styles.hostAvatar}>
                {event.host.emoji}
              </div>
              <div style={styles.hostInfo}>
                <div style={styles.hostName}>
                  {event.host.name} {event.host.country}
                </div>
                {event.host.bio && (
                  <div style={styles.hostBio}>{event.host.bio}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Co-Hosts Section */}
        {event?.coHosts && event.coHosts.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👥 Co-Hosts ({event.coHosts.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {event.coHosts.map((coHost, i) => (
                <div
                  key={i}
                  style={styles.hostCard}
                  onClick={() => onUserClick && onUserClick(coHost)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={styles.hostAvatar}>
                    {coHost.emoji}
                  </div>
                  <div style={styles.hostInfo}>
                    <div style={styles.hostName}>
                      {coHost.name} {coHost.country}
                    </div>
                    {coHost.bio && (
                      <div style={styles.hostBio}>{coHost.bio}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendees Section */}
        {(event?.crew_full || event?.crew || []).filter(item => !event?.host || item.name !== event.host.name).length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              🧃 Attendees ({(event?.crew_full || event?.crew || []).filter(item => !event?.host || item.name !== event.host.name).length})
            </div>
            <div style={styles.attendeesList}>
              {(event?.crew_full || event?.crew || [])
                .filter(item => !event?.host || item.name !== event.host.name)
                .map((item, i) => (
                  <div
                    key={i}
                    style={styles.attendeeCard}
                    onClick={() => onUserClick && onUserClick(item)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <span style={styles.attendeeAvatar}>{item.emoji}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>💬 Group Chat</div>
          <div style={styles.chatBox} ref={chatBoxRef}>
            {messages.map((m, i) => {
              const mine = m.from === currentUser;
              return (
                <div
                  key={i}
                  style={{ ...styles.row, ...(mine ? styles.rowRight : {}) }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      ...(mine ? styles.bubbleMe : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.bubbleName,
                        ...(mine ? styles.bubbleNameMe : {}),
                      }}
                    >
                      {mine ? "You" : m.from}
                    </span>
                    {m.text}
                  </div>
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
        {/* For featured/admin events, don't show these buttons - they're just templates */}
        {!(event?.isFeatured || (event?.createdBy && event.createdBy.toLowerCase() === 'admin')) && (
          <>
            <button style={styles.homeBtn} onClick={onHome}>Go to Homepage</button>
            <button
              style={styles.leaveBtn}
              onClick={() => onLeaveEvent && onLeaveEvent(event)}
            >
              Leave Event
            </button>
          </>
        )}
        
        {/* For featured events, show back button */}
        {(event?.isFeatured || (event?.createdBy && event.createdBy.toLowerCase() === 'admin')) && (
          <button style={styles.homeBtn} onClick={onHome}>← Back to Events</button>
        )}
      </div>

      {/* Edit Event Screen */}
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
                Time
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
                      // Check file size (max 2MB to avoid localStorage limits)
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Image is too large! Please choose an image smaller than 2MB.");
                        return;
                      }
                      
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditedEvent({...editedEvent, imageUrl: reader.result});
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
                onClick={() => setShowEditModal(false)}
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
                onClick={() => {
                  if (onEditEvent) {
                    const updatedEvent = {
                      ...event,
                      ...editedEvent,
                    };
                    onEditEvent(updatedEvent);
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
                            {coHost.name} {coHost.country && `${coHost.country}`}
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
                          if (window.confirm(`Remove ${coHost.name} as co-host?`)) {
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
    </div>
  );
}

export default SocialChat;