import React, { useState, useEffect } from "react";
import * as api from "./api";

function NotificationsInbox({
  currentUser,
  notifications,
  onClose,
  onViewProfile,
  onEventClick,
  onMarkAsRead,
  allEvents = [],
}) {
  const [notificationDetails, setNotificationDetails] = useState([]);

  useEffect(() => {
    // Enrich notifications with event details
    if (notifications && notifications.by_event) {
      const enriched = Object.entries(notifications.by_event).map(([eventId, count]) => {
        const event = allEvents.find(e => e.id === parseInt(eventId));
        return {
          eventId: parseInt(eventId),
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
    try {
      const username = currentUser?.username || currentUser?.name || currentUser;
      await api.markNotificationsRead(username, eventId);
      if (onMarkAsRead) {
        onMarkAsRead();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleViewEvent = async (event, eventId) => {
    try {
      // Mark as read before opening the chat
      const username = currentUser?.username || currentUser?.name || currentUser;
      await api.markNotificationsRead(username, eventId);
      
      // Refresh notification count immediately
      if (onMarkAsRead) {
        await onMarkAsRead();
      }
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then open the chat
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
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>Notifications</span>
          <button style={styles.closeButton} onClick={onClose}>×</button>
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
                  style={styles.viewButton}
                  onClick={() => handleViewEvent(notification.event, notification.eventId)}
                  onMouseEnter={(e) => e.target.style.background = theme.primaryDark}
                  onMouseLeave={(e) => e.target.style.background = theme.primary}
                >
                  View Chat
                </button>
                <button 
                  style={styles.markReadButton}
                  onClick={() => handleMarkAsRead(notification.eventId)}
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
