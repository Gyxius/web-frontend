import React, { useState, useEffect } from "react";
import * as api from "./api";
import users from "./users";

function NotificationsInbox({
  currentUser,
  notifications,
  onClose,
  onViewProfile,
  onViewPublicProfile,
  onSignOut,
  onEventClick,
  onMarkAsRead,
  allEvents = [],
  followRequests = [],
  onAcceptFollowRequest,
  onDeclineFollowRequest,
  onFollowBackUser,
  follows = {},
}) {
  const [notificationDetails, setNotificationDetails] = useState([]);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [acceptedFollowRequests, setAcceptedFollowRequests] = useState(new Set());

  useEffect(() => {
    // Enrich notifications with event details
    if (notifications && notifications.by_event) {
      const enriched = Object.entries(notifications.by_event).map(([eventId, count]) => {
        const event = allEvents.find(e => e.id === parseInt(eventId));
        return {
          evetesntId: parseInt(eventId),
          count,
          eventName: event?.name || "Unknown Event",
          event: event,
        };
      });
      setNotificationDetails(enriched);
    }
  }, [notifications, allEvents]);

  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    danger: "#EA2B2B",
    border: "#EEF2F7",
    shadow: "0 4px 14px rgba(0,0,0,0.06)",
    radius: 16,
  };

  const styles = {
    profileRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    avatarSmall: {
      width: 56,
      height: 56,
      borderRadius: 12,
      background: "#EEE",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 26,
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    container: {
      background: theme.card,
      borderRadius: theme.radius,
      padding: 24,
      maxWidth: 500,
      width: "90%",
      maxHeight: "80vh",
      overflow: "auto",
      boxShadow: theme.shadow,
    },
    header: {
      fontSize: 24,
      fontWeight: 700,
      color: theme.text,
      marginBottom: 20,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: 24,
      cursor: "pointer",
      color: theme.textMuted,
      padding: 0,
      width: 32,
      height: 32,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    profileButton: {
      width: "100%",
      padding: 16,
      background: theme.primary,
      color: "white",
      border: "none",
      borderRadius: theme.radius,
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      marginBottom: 20,
      transition: "background 0.2s",
    },
    signOutButton: {
      width: "100%",
      padding: 14,
      background: "#EA2B2B",
      color: "white",
      border: "none",
      borderRadius: theme.radius,
      fontSize: 15,
      fontWeight: 800,
      cursor: "pointer",
      marginBottom: 20,
      boxShadow: "0 4px 12px rgba(234,43,43,0.25)",
      transition: "opacity 0.2s, transform 0.1s",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: theme.text,
      marginBottom: 12,
      marginTop: 8,
    },
    notificationCard: {
      background: theme.bg,
      borderRadius: theme.radius,
      padding: 16,
      marginBottom: 12,
      border: `1px solid ${theme.border}`,
      transition: "all 0.2s",
    },
    notificationHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    eventName: {
      fontSize: 16,
      fontWeight: 600,
      color: theme.text,
      flex: 1,
    },
    badge: {
      background: "#FF4444",
      color: "white",
      borderRadius: 12,
      padding: "4px 10px",
      fontSize: 12,
      fontWeight: 600,
      marginLeft: 8,
    },
    notificationText: {
      fontSize: 14,
      color: theme.textMuted,
      marginBottom: 12,
    },
    buttonRow: {
      display: "flex",
      gap: 8,
    },
    viewButton: {
      flex: 1,
      padding: "10px 16px",
      background: theme.primary,
      color: "white",
      border: "none",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background 0.2s",
    },
    markReadButton: {
      flex: 1,
      padding: "10px 16px",
      background: "white",
      color: theme.text,
      border: `2px solid ${theme.border}`,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    emptyState: {
      textAlign: "center",
      padding: 40,
      color: theme.textMuted,
      fontSize: 16,
    },
  };

  const handleMarkAsRead = async (eventId) => {
    if (isMarkingRead) return; // Prevent duplicate calls
    
    try {
      setIsMarkingRead(true);
      const username = currentUser?.username || currentUser?.name || currentUser;
      await api.markNotificationsRead(username, eventId);
      if (onMarkAsRead) {
        onMarkAsRead();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleViewEvent = async (event, eventId) => {
    if (isMarkingRead) return; // Prevent duplicate calls
    
    try {
      setIsMarkingRead(true);
      // Mark as read before opening the chat
      const username = currentUser?.username || currentUser?.name || currentUser;
      await api.markNotificationsRead(username, eventId);
      
      // Refresh notification count immediately
      if (onMarkAsRead) {
        await onMarkAsRead();
      }
      
      // Then open the chat and close modal
      if (onEventClick && event) {
        onEventClick(event);
      }
      onClose();
    } catch (error) {
      console.error("Failed to mark as read and open chat:", error);
      // Even if there's an error, still try to open the chat
      if (onEventClick && event) {
        onEventClick(event);
      }
      onClose();
    } finally {
      setIsMarkingRead(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>Notifications</span>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Quick profile preview centered at the top */}
        <div style={{ marginBottom: 12 }}>
          {(() => {
            const usernameKey = currentUser?.username || currentUser?.name || currentUser;
            let localProfile = null;
            try {
              const raw = localStorage.getItem(`userProfile_${usernameKey}`);
              if (raw) localProfile = JSON.parse(raw);
            } catch (e) {
              // ignore
            }

            const avatarSpec = localProfile?.avatar;
            let avatarUrl = null;
            if (avatarSpec) {
              if (avatarSpec.provider === 'dicebear') {
                avatarUrl = `https://api.dicebear.com/6.x/${avatarSpec.style}/svg?seed=${encodeURIComponent(avatarSpec.seed)}`;
              } else if (avatarSpec.provider === 'custom') {
                avatarUrl = avatarSpec.url;
              }
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" style={{ ...styles.avatarSmall, width: 72, height: 72, borderRadius: 14 }} />
                ) : (
                  <div style={{ ...styles.avatarSmall, width: 72, height: 72, borderRadius: 14 }}>{localProfile?.emoji || '🙂'}</div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: styles.header?.color || '#111', fontSize: 18 }}>
                    {(usernameKey || '').toLowerCase() === 'admin' ? 'Admin' : (localProfile?.name || usernameKey)}
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: 13 }}>{localProfile?.homeCountries?.[0] || localProfile?.country || ''}</div>
                </div>
              </div>
            );
          })()}
        </div>

        <button 
          style={styles.profileButton}
          onClick={() => {
            onViewProfile();
            onClose();
          }}
          onMouseEnter={(e) => e.target.style.background = theme.primaryDark}
          onMouseLeave={(e) => e.target.style.background = theme.primary}
        >
          See My Profile
        </button>

        <button 
          style={{
            ...styles.profileButton,
            background: theme.accent,
          }}
          onClick={() => {
            if (onViewPublicProfile) {
              onViewPublicProfile();
              onClose();
            }
          }}
          onMouseEnter={(e) => e.target.style.background = '#1591C7'}
          onMouseLeave={(e) => e.target.style.background = theme.accent}
        >
          👁️ View My Public Profile
        </button>

        <button
          style={styles.signOutButton}
          onClick={() => {
            if (onSignOut) onSignOut();
            onClose();
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          🚪 Sign Out
        </button>

        {/* Follow Requests Section */}
        {followRequests && followRequests.length > 0 && (
          <>
            <div style={styles.sectionTitle}>
              👥 Follow Requests
            </div>
            {followRequests.map((req, idx) => {
              const fromKey = req.from;
              const fromUser = users.find(u => u.name === fromKey || u.username === fromKey);
              const userLabel = fromUser ? `${fromUser.emoji || ""} ${fromUser.name} ${fromUser.country || ""}` : fromKey;
              const userName = fromUser ? fromUser.name : fromKey;
              const hasAccepted = acceptedFollowRequests.has(fromKey);
              
              // Check if current user already follows the requester back
              const currentUserKey = currentUser?.username || currentUser?.name;
              const isAlreadyFollowingBack = follows[currentUserKey]?.some(f => 
                (f.id || f.name || f.username) === fromKey || 
                (f.id || f.name || f.username) === (fromUser?.id || fromUser?.username)
              );
              
              // Don't show follow-back prompt if already following
              const shouldShowFollowBack = hasAccepted && !isAlreadyFollowingBack;
              
              return (
                <div key={idx} style={styles.notificationCard}>
                  <div style={styles.notificationHeader}>
                    <div style={styles.eventName}>{userLabel}</div>
                  </div>
                  <div style={styles.notificationText}>
                    {shouldShowFollowBack ? `Do you want to follow ${userName} back?` : "wants to follow you"}
                  </div>
                  <div style={styles.buttonRow}>
                    <button 
                      style={styles.viewButton}
                      onClick={() => {
                        if (shouldShowFollowBack) {
                          // Follow back action
                          if (onFollowBackUser) {
                            onFollowBackUser(fromKey);
                          }
                          // Remove from accepted set
                          setAcceptedFollowRequests(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(fromKey);
                            return newSet;
                          });
                        } else if (isAlreadyFollowingBack) {
                          // Already following back, just dismiss the notification
                          if (onDeclineFollowRequest) {
                            onDeclineFollowRequest(fromKey);
                          }
                          setAcceptedFollowRequests(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(fromKey);
                            return newSet;
                          });
                        } else {
                          // Accept follow request
                          if (onAcceptFollowRequest) {
                            onAcceptFollowRequest(fromKey);
                          }
                          // Mark as accepted to show follow-back prompt (unless already following)
                          if (!isAlreadyFollowingBack) {
                            setAcceptedFollowRequests(prev => new Set(prev).add(fromKey));
                          } else {
                            // Already following, just dismiss
                            if (onDeclineFollowRequest) {
                              onDeclineFollowRequest(fromKey);
                            }
                          }
                        }
                      }}
                      onMouseEnter={(e) => e.target.style.background = theme.primaryDark}
                      onMouseLeave={(e) => e.target.style.background = theme.primary}
                    >
                      {hasAccepted && isAlreadyFollowingBack ? 'Dismiss' : 'Accept'}
                    </button>
                    <button 
                      style={styles.markReadButton}
                      onClick={() => {
                        // Clean up accepted state if declining
                        setAcceptedFollowRequests(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(fromKey);
                          return newSet;
                        });
                        if (onDeclineFollowRequest) {
                          onDeclineFollowRequest(fromKey);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#FEE";
                        e.target.style.borderColor = theme.danger;
                        e.target.style.color = theme.danger;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "white";
                        e.target.style.borderColor = theme.border;
                        e.target.style.color = theme.text;
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div style={styles.sectionTitle}>
          📬 Message Notifications
        </div>

        {notificationDetails.length === 0 ? (
          <div style={styles.emptyState}>
            🎉 All caught up!<br/>
            No new notifications
          </div>
        ) : (
          notificationDetails.map((notification) => (
            <div key={notification.eventId} style={styles.notificationCard}>
              <div style={styles.notificationHeader}>
                <div style={styles.eventName}>{notification.eventName}</div>
                <div style={styles.badge}>
                  {notification.count} new
                </div>
              </div>
              <div style={styles.notificationText}>
                You have {notification.count} unread message{notification.count > 1 ? "s" : ""} in this event chat
              </div>
              <div style={styles.buttonRow}>
                <button 
                  style={{...styles.viewButton, opacity: isMarkingRead ? 0.6 : 1}}
                  onClick={() => handleViewEvent(notification.event, notification.eventId)}
                  disabled={isMarkingRead}
                  onMouseEnter={(e) => !isMarkingRead && (e.target.style.background = theme.primaryDark)}
                  onMouseLeave={(e) => !isMarkingRead && (e.target.style.background = theme.primary)}
                >
                  {isMarkingRead ? "Processing..." : "View Chat"}
                </button>
                <button 
                  style={{...styles.markReadButton, opacity: isMarkingRead ? 0.6 : 1}}
                  onClick={() => handleMarkAsRead(notification.eventId)}
                  disabled={isMarkingRead}
                  onMouseEnter={(e) => {
                    e.target.style.background = theme.bg;
                    e.target.style.borderColor = theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "white";
                    e.target.style.borderColor = theme.border;
                  }}
                >
                  Mark Read
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsInbox;
