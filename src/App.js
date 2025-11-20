import React, { useState, useEffect, useCallback } from "react";
import Login from "./Login";
import SocialHome from "./SocialHome";
import SocialRoulette from "./SocialRoulette";
import AdminAssign from "./AdminAssign";
import UserProfile from "./UserProfile";
import EditMyProfile from "./EditMyProfile";
import SocialChat from "./SocialChat";
import SocialResult from "./SocialResult";
import users from "./users";
import * as api from "./api";

function App() {
  // Persisted session: restore user from localStorage on first render
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sessionUser");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [previousEvent, setPreviousEvent] = useState(null); // Track previous event for back navigation
  const [showResult, setShowResult] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userEvents, setUserEvents] = useState({});
  const [chatHistory, setChatHistory] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [follows, setFollows] = useState({});
  const [pendingFollowRequests, setPendingFollowRequests] = useState([]);
  const [suggestedEvents, setSuggestedEvents] = useState({});
  const [publicEvents, setPublicEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [templateEventToCreate, setTemplateEventToCreate] = useState(null);
  const [adminOpenEventId, setAdminOpenEventId] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsData, setNotificationsData] = useState(null);
  
  // Load data from API when user logs in
  useEffect(() => {
    if (!user) {
      return;
    }

    const loadUserData = async () => {
      try {
        const username = user?.username || user?.name;

        // Load all public events
        const events = await api.getAllEvents();
        setPublicEvents(events);

        // Load user's joined events
        const userEventsData = await api.getUserEvents(username);
        setUserEvents({ [username]: userEventsData });

        // Load follows
        const followsList = await api.getFollows(username);
        setFollows({ [username]: followsList });

        // Load pending requests for admin
        if (username?.toLowerCase() === 'admin') {
          try {
            const requests = await api.getPendingRequests();
            setPendingRequests(requests);
          } catch (error) {
            console.error("Failed to load pending requests:", error);
          }
        }

      } catch (error) {
        console.error("Failed to load data from API:", error);
      }
    };

    loadUserData();
  }, [user]);

  // Expose a global hook so Admin panel can open the user event view
  useEffect(() => {
    if ((user?.username || user?.name)?.toLowerCase() === "admin") {
      window.__ADMIN_OPEN_EVENT__ = (id) => setAdminOpenEventId(id);
      return () => { try { delete window.__ADMIN_OPEN_EVENT__; } catch {} };
    }
  }, [user]);

  // If the app is opened with ?event=ID in the URL, open that event directly (useful for share links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const evId = params.get('event') || params.get('id');
      if (!evId) return;
      const openSharedEvent = async () => {
        try {
          const ev = await api.getEventById(evId);
          if (ev) {
            setRouletteResult(ev);
            setShowChat(true);
          }
        } catch (e) {
          console.error('Failed to open shared event', evId, e);
        }
      };
      openSharedEvent();
    } catch (e) {}
  }, []);

  // When admin selects an event, open the same detailed chat view users see
  useEffect(() => {
    const openAdminEvent = async () => {
      if (!adminOpenEventId) return;
      try {
        const ev = await api.getEventById(adminOpenEventId);
        setRouletteResult(ev);
        setShowChat(true);
      } catch (e) {
        console.error("Failed to open admin event", adminOpenEventId, e);
      }
    };
    openAdminEvent();
  }, [adminOpenEventId]);

  // Function to refresh notification count
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotificationCount(0);
      setNotificationsData(null);
      return;
    }
    try {
      const username = user?.username || user?.name;
      const notifications = await api.getNotifications(username);
      setNotificationCount(notifications.total_unread || 0);
      setNotificationsData(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [user]);

  // Fetch notifications and poll every 30 seconds
  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    // Fetch immediately
    refreshNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(refreshNotifications, 30000);

    return () => clearInterval(interval);
  }, [user, refreshNotifications]);  // Refresh public events periodically
  useEffect(() => {
    const refreshEvents = async () => {
      try {
        const events = await api.getAllEvents();
        setPublicEvents(events);
      } catch (error) {
        console.error("Failed to refresh events:", error);
      }
    };

    const interval = setInterval(refreshEvents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Refresh the logged-in user's events periodically so newly created/joined events appear without reload
  useEffect(() => {
    if (!user) return;
    const currentUserKey = user?.username || user?.name;
    const refreshUserEvents = async () => {
      try {
        const userEventsData = await api.getUserEvents(currentUserKey);
        setUserEvents({ [currentUserKey]: userEventsData });
      } catch (error) {
        console.error("Failed to refresh user events:", error);
      }
    };
    const interval = setInterval(refreshUserEvents, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Load chat messages and refresh event data when opening a chat
  useEffect(() => {
    if (showChat && rouletteResult?.id) {
      const loadChatData = async () => {
        try {
          // Load chat messages
          const messages = await api.getChatMessages(rouletteResult.id);
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            from: msg.username,
            text: msg.message,
            ts: new Date(msg.timestamp).getTime()
          }));
          setChatHistory(prev => ({
            ...prev,
            [rouletteResult.id]: formattedMessages
          }));
          
          // Refresh event data to get latest participants
          const allEvents = await api.getAllEvents();
          const updatedEvent = allEvents.find(e => e.id === rouletteResult.id);
          if (updatedEvent) {
            setRouletteResult(updatedEvent);
          }
        } catch (error) {
          console.error("Failed to load chat data:", error);
        }
      };
      loadChatData();
    }
  }, [showChat, rouletteResult?.id]);

  const joinedEvents = user ? userEvents[user?.username || user?.name] || [] : [];
  const userSuggestedEvents = user ? suggestedEvents[user?.username || user?.name] || [] : [];


  // Points management functions
  const getUserPoints = (username) => {
    const pointsData = localStorage.getItem("userPoints");
    const points = pointsData ? JSON.parse(pointsData) : {};
    return points[username] || 0;
  };

  const addPoints = (username, pointsToAdd) => {
    const pointsData = localStorage.getItem("userPoints");
    const points = pointsData ? JSON.parse(pointsData) : {};
    points[username] = (points[username] || 0) + pointsToAdd;
    localStorage.setItem("userPoints", JSON.stringify(points));
    return points[username];
  };

  const handleLogin = (usernameOrObj) => {
    let userObj = usernameOrObj;
    if (typeof usernameOrObj === "string") {
      userObj = users.find(u => u.name.toLowerCase() === usernameOrObj.toLowerCase() || u.id === usernameOrObj || u.username === usernameOrObj);
      if (!userObj) userObj = { username: usernameOrObj, name: usernameOrObj };
    }
    setUser(userObj);
    try { localStorage.setItem("sessionUser", JSON.stringify(userObj)); } catch {}
    // Reset navigation states to ensure user lands on homepage
    setShowEditProfile(false);
    setShowRoulette(false);
    setShowResult(false);
    setShowChat(false);
    setSelectedProfile(null);
  };
  const handleSignOut = () => {
  setUser(null);
  try { localStorage.removeItem("sessionUser"); } catch {}
  setShowRoulette(false);
  setShowResult(false);
  setShowChat(false);
  setSelectedProfile(null);
  };

  let mainContent;
  let socialHomeContent = null;
  if (!user) {
    mainContent = (
      <Login
        onLogin={handleLogin}
        onRegistered={() => {
          setJustRegistered(true);
          setShowEditProfile(true);
        }}
      />
    );
  } else if (showEditProfile) {
    mainContent = (
      <EditMyProfile
        userName={user?.username || user?.name}
        onBack={() => { setShowEditProfile(false); setJustRegistered(false); }}
        onSignOut={handleSignOut}
        startEditing={!!justRegistered}
        onAccessAdminPanel={(user?.username || user?.name)?.toLowerCase() === 'admin' ? () => {
          setShowEditProfile(false);
          setShowAdminPanel(true);
        } : undefined}
      />
    );
  // Show detailed event/chat view for any user (including admin) if requested
  } else if (showChat && rouletteResult) {
    // Build crew_full from database participants if available, otherwise from localStorage
    let crew_full = [];
    if (rouletteResult.participants && rouletteResult.participants.length > 0) {
      // Use participants from database
      rouletteResult.participants.forEach(username => {
        const userInfo = users.find(u => u.name === username || u.username === username);
        if (userInfo) crew_full.push(userInfo);
        else crew_full.push({ name: username });
      });
    } else {
      // Fallback to localStorage
      Object.entries(userEvents).forEach(([userKey, events]) => {
        if (Array.isArray(events) && events.find(ev => ev.name === rouletteResult?.name)) {
          const userInfo = users.find(u => u.name === userKey || u.username === userKey);
          if (userInfo) crew_full.push(userInfo);
          else crew_full.push({ name: userKey });
        }
      });
    }
    
    // Enrich host object with full user details
    let enrichedHost = rouletteResult.host;
    if (rouletteResult.host && rouletteResult.host.name) {
      const hostUserInfo = users.find(u => u.name === rouletteResult.host.name || u.username === rouletteResult.host.name);
      if (hostUserInfo) {
        enrichedHost = hostUserInfo;
      }
    }
    
    mainContent = (
      <SocialChat
        event={{ ...rouletteResult, crew_full, host: enrichedHost }}
        initialMessages={chatHistory[rouletteResult.id] || []}
        currentUser={user?.username || user?.name}
        onSendMessage={(msg) => {
          // Parent: just persist message to app-level chatHistory (component sends to API)
          const key = rouletteResult.id;
          setChatHistory((prev) => {
            const list = prev[key] || [];
            const withTs = { ...msg, ts: Date.now() };
            return { ...prev, [key]: [...list, withTs] };
          });
        }}
        onBack={() => {
          // If there's a previous event, go back to it. Otherwise close chat.
          if (previousEvent) {
            setRouletteResult(previousEvent);
            setPreviousEvent(null);
          } else {
            setShowChat(false);
            setRouletteResult(null);
            setSelectedProfile(null);
            // If admin opened it, go back to admin dashboard
            if ((user?.username || user?.name)?.toLowerCase() === 'admin') {
              setAdminOpenEventId(null);
            }
          }
        }}
        onHome={() => {
          setShowChat(false);
          setRouletteResult(null);
          setSelectedProfile(null);
          if ((user?.username || user?.name)?.toLowerCase() === 'admin') {
            setAdminOpenEventId(null);
          }
        }}
        onUserClick={(clickedUser) => {
          const currentUserKey = user?.username || user?.name;
          const clickedUserKey = clickedUser?.username || clickedUser?.name;
          
          // If clicking on own profile, go to edit profile
          if (currentUserKey === clickedUserKey) {
            setShowChat(false);
            setRouletteResult(null);
            setShowEditProfile(true);
          } else {
            // Otherwise show the other user's profile
            setShowChat(false);
            setRouletteResult(null);
            setSelectedProfile(clickedUser);
          }
        }}
        onLeaveEvent={async (evToRemove) => {
          const currentUserKey = user?.username || user?.name;
          try {
            await api.leaveEvent(evToRemove.id, currentUserKey);
            const userEventsData = await api.getUserEvents(currentUserKey);
            setUserEvents({ [currentUserKey]: userEventsData });
            const allEvents = await api.getAllEvents();
            setPublicEvents(allEvents);
            setShowChat(false);
            setRouletteResult(null);
            alert(`You have left the event "${evToRemove?.name}"`);
          } catch (error) {
            console.error("Failed to leave event:", error);
            alert("Failed to leave event. Please try again.");
          }
        }}
        onEditEvent={async (updatedEvent) => {
          try {
            const username = user?.username || user?.name;
            console.log("Received event to save:", updatedEvent);
            console.log("endTime value:", updatedEvent.endTime);
            const eventData = {
              name: updatedEvent.name,
              description: updatedEvent.description || "",
              location: updatedEvent.location || "cite",
              venue: updatedEvent.venue || "",
              address: updatedEvent.address || "",
              coordinates: updatedEvent.coordinates || null,
              date: updatedEvent.date || "",
              time: updatedEvent.time || "",
              end_time: updatedEvent.endTime || null,
              category: updatedEvent.category || "food",
              languages: updatedEvent.languages || [],
              is_public: updatedEvent.isPublic !== undefined ? updatedEvent.isPublic : true,
              event_type: updatedEvent.type || "custom",
              capacity: updatedEvent.capacity || null,
              image_url: updatedEvent.imageUrl || "",
              created_by: username,
              target_interests: updatedEvent.targetInterests || null,
              target_cite_connection: updatedEvent.targetCiteConnection || null,
              target_reasons: updatedEvent.targetReasons || null,
            };
            console.log("Sending to API:", eventData);
            await api.updateEvent(updatedEvent.id, eventData);
            const allEvents = await api.getAllEvents();
            setPublicEvents(allEvents);
            const userEventsData = await api.getUserEvents(username);
            setUserEvents({ [username]: userEventsData });
            setRouletteResult(updatedEvent);
            alert("Event changes saved!");
          } catch (error) {
            console.error("Failed to update event:", error);
            alert("Failed to update event: " + error.message);
          }
        }}
        onDeleteEvent={async (eventToDelete) => {
          console.log("🗑️ Starting delete event:", eventToDelete);
          try {
            // Delete from backend
            const username = user?.username || user?.name;
            console.log("Deleting event from backend:", eventToDelete.id, "by user:", username);
            await api.deleteEvent(eventToDelete.id, username);
            console.log("✅ Event deleted from backend");
            
            // Refresh public events from API
            const allEvents = await api.getAllEvents();
            setPublicEvents(allEvents);
            console.log("✅ Public events refreshed");
            
            // Refresh user events from API
            const userEventsData = await api.getUserEvents(username);
            setUserEvents({ [username]: userEventsData });
            console.log("✅ User events refreshed");
            
            // Remove from adminEvents localStorage
            const saved = localStorage.getItem("adminEvents");
            if (saved) {
              const events = JSON.parse(saved);
              const filteredEvents = events.filter(e => e.id !== eventToDelete.id);
              localStorage.setItem("adminEvents", JSON.stringify(filteredEvents));
            }
            
            // Remove from all users' joined events localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith("joinedEvents_")) {
                const joinedEvents = JSON.parse(localStorage.getItem(key) || "[]");
                const filtered = joinedEvents.filter(e => e.id !== eventToDelete.id);
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            });
            
            // Show success message
            alert("🗑️ Event deleted successfully!");
            console.log("✅ Delete complete, navigating back");
            
            // Navigate back to home
            setShowChat(false);
            setRouletteResult(null);
          } catch (error) {
            console.error("❌ Failed to delete event:", error);
            alert("Failed to delete event: " + (error.message || "Unknown error"));
          }
        }}
        onCreateHangout={(featuredEvent) => {
          // Close chat and trigger create event flow with featured event as template
          setShowChat(false);
          setRouletteResult(null);
          setTemplateEventToCreate(featuredEvent);
        }}
        onEventClick={(newEvent) => {
          // Switch to viewing a different event - save current as previous for back navigation
          setPreviousEvent(rouletteResult);
          setRouletteResult(newEvent);
          // Keep chat open to show the new event
        }}
        allUsers={users}
        onNotificationRead={refreshNotifications}
      />
    );
  } else if (showAdminPanel) {
    // Admin panel view - accessed via button in profile
    mainContent = (
      <>
        <AdminAssign
          userEvents={userEvents}
          pendingRequests={pendingRequests}
          onAddPendingRequests={(requests) => setPendingRequests(requests)}
          onRemoveJoinedEvent={(userKey, idx) => {
            setUserEvents(prev => {
              const updated = { ...prev };
              if (updated[userKey]) {
                updated[userKey] = updated[userKey].filter((_, i) => i !== idx);
              }
              return updated;
            });
          }}
        />
        <button
          onClick={() => setShowAdminPanel(false)}
          style={{ position: "absolute", top: 20, right: 20, background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", zIndex: 10 }}
        >
          ← Back to Home
        </button>
      </>
    );
  } else if (selectedProfile) {
    const currentUserKey = user?.username || user?.name;
    const selectedKey = selectedProfile?.username || selectedProfile?.name;
    const isFollowing = !!(follows[currentUserKey] && follows[currentUserKey].find(f => f.id === selectedProfile?.id));
    const hasPendingRequest = pendingFollowRequests.some(
      req => req.from === currentUserKey && req.to === selectedKey
    );
    const incomingRequest = pendingFollowRequests.find(
      req => req.from === selectedKey && req.to === currentUserKey
    );
    
    // Calculate follower and following counts for selected profile
    const followingCount = follows[selectedKey]?.length || 0;
    const followerCount = Object.values(follows).filter(followList => 
      followList.some(f => (f.id || f.name || f.username) === selectedKey || 
                           (f.id || f.name || f.username) === (selectedProfile?.id || selectedProfile?.username))
    ).length;
    
    mainContent = (
      <UserProfile
        user={selectedProfile}
        currentUser={user}
        getUserPoints={getUserPoints}
        onBack={() => setSelectedProfile(null)}
        followingCount={followingCount}
        followerCount={followerCount}
        onAddFollow={() => {
          // Send follow request
          if (!hasPendingRequest && !isFollowing) {
            setPendingFollowRequests(prev => [...prev, { from: currentUserKey, to: selectedKey }]);
          }
        }}
        onAcceptFollowRequest={() => {
          // Accept incoming request
          setFollows(prev => {
            const updated = { ...prev };
            if (!updated[currentUserKey]) updated[currentUserKey] = [];
            if (!updated[currentUserKey].find(f => f.id === selectedProfile.id)) {
              updated[currentUserKey].push(selectedProfile);
            }
            // Also add current user to selectedProfile's follows (robust id/name fallback)
            const selfFollowObj = {
              id: user?.id || user?.username || user?.name,
              name: user?.name || user?.username,
              emoji: user?.emoji,
              country: user?.country,
              desc: user?.desc,
            };
            if (!updated[selectedKey]) updated[selectedKey] = [];
            if (!updated[selectedKey].find(f => (f.id || f.name) === selfFollowObj.id)) {
              updated[selectedKey].push(selfFollowObj);
            }
            return updated;
          });
          setPendingFollowRequests(prev => prev.filter(req => !(req.from === selectedKey && req.to === currentUserKey)));
        }}
        onDeclineFollowRequest={() => {
          setPendingFollowRequests(prev => prev.filter(req => !(req.from === selectedKey && req.to === currentUserKey)));
        }}
        onRemoveFollow={() => {
          setFollows(prev => {
            const updated = { ...prev };
            // Remove from current user's list
            if (updated[currentUserKey]) {
              updated[currentUserKey] = updated[currentUserKey].filter(
                f => f.id !== selectedProfile.id && (f.name !== selectedKey)
              );
            }
            // Remove current user from selected user's list
            const selfId = user?.id || user?.username || user?.name;
            if (updated[selectedKey]) {
              updated[selectedKey] = updated[selectedKey].filter(
                f => (f.id || f.name) !== selfId
              );
            }
            return updated;
          });
        }}
        isFollowing={isFollowing}
        hasPendingRequest={hasPendingRequest}
        incomingRequest={!!incomingRequest}
        onRequestJoinEvent={() => {}}
        joinedEvents={userEvents[selectedKey] || []}
      />
    );
  } else if (showChat && rouletteResult) {
    // Build crew_full from database participants if available, otherwise from localStorage
    let crew_full = [];
    if (rouletteResult.participants && rouletteResult.participants.length > 0) {
      // Use participants from database
      rouletteResult.participants.forEach(username => {
        const userInfo = users.find(u => u.name === username || u.username === username);
        if (userInfo) crew_full.push(userInfo);
        else crew_full.push({ name: username });
      });
    } else {
      // Fallback to localStorage
      Object.entries(userEvents).forEach(([userKey, events]) => {
        if (Array.isArray(events) && events.find(ev => ev.name === rouletteResult?.name)) {
          const userInfo = users.find(u => u.name === userKey || u.username === userKey);
          if (userInfo) crew_full.push(userInfo);
          else crew_full.push({ name: userKey });
        }
      });
    }
    
    // Enrich host object with full user details
    let enrichedHost = rouletteResult.host;
    if (rouletteResult.host && rouletteResult.host.name) {
      const hostUserInfo = users.find(u => u.name === rouletteResult.host.name || u.username === rouletteResult.host.name);
      if (hostUserInfo) {
        enrichedHost = hostUserInfo;
      }
    }
    
    mainContent = (
      <SocialChat
        event={{ ...rouletteResult, crew_full, host: enrichedHost }}
        initialMessages={chatHistory[rouletteResult.id] || []}
        currentUser={user?.username || user?.name}
        onSendMessage={(msg) => {
          // Parent: just persist message to app-level chatHistory (component sends to API)
          const key = rouletteResult.id;
          setChatHistory((prev) => {
            const list = prev[key] || [];
            const withTs = { ...msg, ts: Date.now() };
            return { ...prev, [key]: [...list, withTs] };
          });
        }}
        onBack={() => {
          // If there's a previous event, go back to it. Otherwise go to result screen.
          if (previousEvent) {
            setRouletteResult(previousEvent);
            setPreviousEvent(null);
          } else {
            setShowChat(false);
            setShowResult(true);
            setSelectedProfile(null);
          }
        }}
        onHome={() => {
          setShowChat(false);
          setRouletteResult(null);
          setSelectedProfile(null);
        }}
        onUserClick={(clickedUser) => {
          const currentUserKey = user?.username || user?.name;
          const clickedUserKey = clickedUser?.username || clickedUser?.name;
          
          // If clicking on own profile, go to edit profile
          if (currentUserKey === clickedUserKey) {
            setShowChat(false);
            setRouletteResult(null);
            setShowEditProfile(true);
          } else {
            // Otherwise show the other user's profile
            setShowChat(false);
            setRouletteResult(null);
            setSelectedProfile(clickedUser);
          }
        }}
        onLeaveEvent={async (evToRemove) => {
          const currentUserKey = user?.username || user?.name;
          try {
            // Leave event via API
            await api.leaveEvent(evToRemove.id, currentUserKey);
            // Refresh user's events
            const userEventsData = await api.getUserEvents(currentUserKey);
            setUserEvents({ [currentUserKey]: userEventsData });
            // Refresh all events to update participant counts
            const allEvents = await api.getAllEvents();
            setPublicEvents(allEvents);
            // Navigate back to home
            setShowChat(false);
            setRouletteResult(null);
            // Show confirmation
            alert(`You have left the event "${evToRemove?.name}"`);
          } catch (error) {
            console.error("Failed to leave event:", error);
            alert("Failed to leave event. Please try again.");
          }
        }}
        onEditEvent={async (updatedEvent) => {
          try {
            const username = user?.username || user?.name;
            console.log("Received event to save (2nd handler):", updatedEvent);
            console.log("endTime value:", updatedEvent.endTime);
            
            // Prepare the event data for the API
            const eventData = {
              name: updatedEvent.name,
              description: updatedEvent.description || "",
              location: updatedEvent.location || "cite",
              venue: updatedEvent.venue || "",
              address: updatedEvent.address || "",
              coordinates: updatedEvent.coordinates || null,
              date: updatedEvent.date || "",
              time: updatedEvent.time || "",
              end_time: updatedEvent.endTime || null,
              category: updatedEvent.category || "food",
              languages: updatedEvent.languages || [],
              is_public: updatedEvent.isPublic !== undefined ? updatedEvent.isPublic : true,
              event_type: updatedEvent.type || "custom",
              capacity: updatedEvent.capacity || null,
              image_url: updatedEvent.imageUrl || "",
              created_by: username,
              target_interests: updatedEvent.targetInterests || null,
              target_cite_connection: updatedEvent.targetCiteConnection || null,
              target_reasons: updatedEvent.targetReasons || null,
            };
            console.log("Sending to API (2nd handler):", eventData);
            
            // Update via API
            await api.updateEvent(updatedEvent.id, eventData);
            
            // Refresh events to get latest data
            const allEvents = await api.getAllEvents();
            setPublicEvents(allEvents);
            const userEventsData = await api.getUserEvents(username);
            setUserEvents({ [username]: userEventsData });
            setRouletteResult(updatedEvent);
            alert("Event changes saved!");
          } catch (error) {
            console.error("Failed to update event:", error);
            alert("Failed to update event: " + error.message);
          }
        }}
        onDeleteEvent={async (eventToDelete) => {
          console.log("🗑️ Starting delete event:", eventToDelete);
          try {
            // Delete from backend
            const username = user?.username || user?.name;
            console.log("Deleting event from backend:", eventToDelete.id, "by user:", username);
            await api.deleteEvent(eventToDelete.id, username);
            console.log("✅ Event deleted from backend");
            
            // Refresh public events from API
            const allEvents = await api.getAllEvents();
            setPublicEvents(allEvents);
            console.log("✅ Public events refreshed");
            
            // Refresh user events from API
            const userEventsData = await api.getUserEvents(username);
            setUserEvents({ [username]: userEventsData });
            console.log("✅ User events refreshed");
            
            // Remove from adminEvents localStorage
            const saved = localStorage.getItem("adminEvents");
            if (saved) {
              const events = JSON.parse(saved);
              const filteredEvents = events.filter(e => e.id !== eventToDelete.id);
              localStorage.setItem("adminEvents", JSON.stringify(filteredEvents));
            }
            
            // Remove from all users' joined events localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith("joinedEvents_")) {
                const joinedEvents = JSON.parse(localStorage.getItem(key) || "[]");
                const filtered = joinedEvents.filter(e => e.id !== eventToDelete.id);
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            });
            
            // Show success message
            alert("🗑️ Event deleted successfully!");
            console.log("✅ Delete complete, navigating back");
            
            // Navigate back to home
            setShowChat(false);
            setRouletteResult(null);
          } catch (error) {
            console.error("❌ Failed to delete event:", error);
            alert("Failed to delete event: " + (error.message || "Unknown error"));
          }
        }}
        onCreateHangout={(featuredEvent) => {
          // Close chat and trigger create event flow with featured event as template
          setShowChat(false);
          setRouletteResult(null);
          setTemplateEventToCreate(featuredEvent);
        }}
        onEventClick={(newEvent) => {
          // Switch to viewing a different event - save current as previous for back navigation
          setPreviousEvent(rouletteResult);
          setRouletteResult(newEvent);
          // Keep chat open to show the new event
        }}
        allUsers={users}
        onNotificationRead={refreshNotifications}
      />
    );
  } else if (showResult && rouletteResult) {
    mainContent = (
      <SocialResult
        event={rouletteResult}
        onBack={() => {
          setShowResult(false);
          setShowRoulette(true);
          setRouletteResult(null);
        }}
        onChat={() => {
          setShowResult(false);
          setShowChat(true);
        }}
        onUserClick={setSelectedProfile}
      />
    );
  } else if (showRoulette) {
    mainContent = (
      <SocialRoulette onResult={(event) => {
        setRouletteResult(event);
        setShowRoulette(false);
      }} />
    );
  } else {
    socialHomeContent = (
      <>
        <button
          onClick={handleSignOut}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: 600,
            cursor: "pointer",
            zIndex: 10
          }}
        >
          Sign Out
        </button>
        <SocialHome
          userName={user?.username || user?.name}
          currentUser={user}
          onSignOut={handleSignOut}
          onEditProfile={() => setShowEditProfile(true)}
          joinedEvents={joinedEvents}
          templateEventToCreate={templateEventToCreate}
          onTemplateEventHandled={() => setTemplateEventToCreate(null)}
          suggestedEvents={userSuggestedEvents}
          publicEvents={publicEvents}
          addPoints={addPoints}
          getUserPoints={getUserPoints}
          notificationCount={notificationCount}
          notificationsData={notificationsData}
          onRefreshNotifications={refreshNotifications}
          onJoinPublicEvent={async (event) => {
            const currentUserKey = user?.username || user?.name;
            // Check if already joined
            const list = userEvents[currentUserKey] || [];
            if (list.find(x => String(x.id) === String(event.id))) {
              alert(`You've already joined "${event.name}"! Check your joined events below.`);
              return;
            }
            try {
              // Join event via API
              await api.joinEvent(event.id, currentUserKey);
              // Refresh user's events
              const userEventsData = await api.getUserEvents(currentUserKey);
              setUserEvents({ [currentUserKey]: userEventsData });
              // Refresh all events to update participant counts
              const allEvents = await api.getAllEvents();
              setPublicEvents(allEvents);
              // Award 1 point for joining an event
              const newPoints = addPoints(currentUserKey, 1);
              // Show success message
              alert(`🎉 Success! You joined "${event.name}"!\n\n📍 ${event.location}${event.place ? ` - ${event.place}` : ''}\n⏰ ${event.date} at ${event.time}${event.endTime ? ` – ${event.endTime}` : ''}\n\n⭐ +1 point earned! You now have ${newPoints} points!\n\nCheck your "My Joined Events" section below to see it!`);
            } catch (error) {
              console.error("Failed to join event:", error);
              alert("Failed to join event. Please try again.");
            }
          }}
          onAcceptSuggestion={(idx, event) => {
            const currentUserKey = user?.username || user?.name;
            // Move from suggested to joined events
            setUserEvents(prev => {
              const updated = { ...prev };
              const list = updated[currentUserKey] || [];
              if (!list.find(x => String(x.id) === String(event.id))) {
                updated[currentUserKey] = [...list, event];
              }
              return updated;
            });
            // Remove from suggested events
            setSuggestedEvents(prev => {
              const updated = { ...prev };
              if (updated[currentUserKey]) {
                updated[currentUserKey] = updated[currentUserKey].filter((_, i) => i !== idx);
              }
              return updated;
            });
            // Award 1 point for joining an event
            addPoints(currentUserKey, 1);
          }}
          onDeclineSuggestion={(idx, event) => {
            const currentUserKey = user?.username || user?.name;
            // Remove from suggested events
            setSuggestedEvents(prev => {
              const updated = { ...prev };
              if (updated[currentUserKey]) {
                updated[currentUserKey] = updated[currentUserKey].filter((_, i) => i !== idx);
              }
              return updated;
            });
          }}
          onJoinedEventClick={event => {
            setRouletteResult(event);
            setShowChat(true);
          }}
          onUserClick={(clickedUser) => {
            const currentUserKey = user?.username || user?.name;
            const clickedUserKey = clickedUser?.username || clickedUser?.name;
            
            // If forcing public view (from "View My Public Profile" button), always show public profile
            if (clickedUser?._forcePublicView) {
              setSelectedProfile(clickedUser);
            }
            // If clicking on own profile normally, go to edit profile
            else if (currentUserKey === clickedUserKey) {
              setShowEditProfile(true);
            } else {
              // Otherwise show the other user's profile
              setSelectedProfile(clickedUser);
            }
          }}
          onLeaveEvent={async (evToRemove) => {
            const currentUserKey = user?.username || user?.name;
            try {
              // Leave event via API
              await api.leaveEvent(evToRemove.id, currentUserKey);
              // Refresh user's events
              const userEventsData = await api.getUserEvents(currentUserKey);
              setUserEvents({ [currentUserKey]: userEventsData });
              // Refresh all events
              const allEvents = await api.getAllEvents();
              setPublicEvents(allEvents);
            } catch (error) {
              console.error("Failed to leave event:", error);
              alert("Failed to leave event. Please try again.");
            }
          }}
          showDebug={true}
          followingEvents={(follows[user?.username || user?.name] || []).map(fr => ({
            following: fr,
            events: userEvents[fr?.username || fr?.name] || []
          })).filter(fe => Array.isArray(fe.events) && fe.events.length > 0)}
          followRequestsIncoming={pendingFollowRequests.filter(r => r.to === (user?.username || user?.name))}
          onAcceptFollowRequestFrom={(fromKey) => {
            const currentUserKey = user?.username || user?.name;
            const requester = users.find(u => u.name === fromKey || u.username === fromKey) || { name: fromKey, id: fromKey };
            setFollows(prev => {
              const updated = { ...prev };
              if (!updated[currentUserKey]) updated[currentUserKey] = [];
              if (!updated[currentUserKey].find(f => (f.id || f.name) === (requester.id || requester.name))) {
                updated[currentUserKey].push(requester);
              }
              const selfFollowObj = {
                id: user?.id || user?.username || user?.name,
                name: user?.name || user?.username,
                emoji: user?.emoji,
                country: user?.country,
                desc: user?.desc,
              };
              if (!updated[fromKey]) updated[fromKey] = [];
              if (!updated[fromKey].find(f => (f.id || f.name) === selfFollowObj.id)) {
                updated[fromKey].push(selfFollowObj);
              }
              return updated;
            });
            setPendingFollowRequests(prev => prev.filter(req => !(req.from === fromKey && req.to === (user?.username || user?.name))));
          }}
          onDeclineFollowRequestFrom={(fromKey) => {
            setPendingFollowRequests(prev => prev.filter(req => !(req.from === fromKey && req.to === (user?.username || user?.name))));
          }}
        />
      </>
    );
  }

  return (
    <div className="App">
      {mainContent}
      <div style={{ display: mainContent ? 'none' : 'block', height: '100%' }}>
        {socialHomeContent}
      </div>
    </div>
  );
}
export default App;