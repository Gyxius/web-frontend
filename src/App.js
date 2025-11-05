import React, { useState, useEffect } from "react";
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
  const [user, setUser] = useState(null);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userEvents, setUserEvents] = useState({});
  const [chatHistory, setChatHistory] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [friends, setFriends] = useState({});
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [suggestedEvents, setSuggestedEvents] = useState({});
  const [publicEvents, setPublicEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [templateEventToCreate, setTemplateEventToCreate] = useState(null);
  const [adminOpenEventId, setAdminOpenEventId] = useState(null);
  
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

        // Load friends
        const friendsList = await api.getFriends(username);
        setFriends({ [username]: friendsList });

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

  // Refresh public events periodically
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
    // Reset navigation states to ensure user lands on homepage
    setShowEditProfile(false);
    setShowRoulette(false);
    setShowResult(false);
    setShowChat(false);
    setSelectedProfile(null);
  };
  const handleSignOut = () => {
  setUser(null);
  setShowRoulette(false);
  setShowResult(false);
  setShowChat(false);
  setSelectedProfile(null);
  };

  let mainContent;
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
    mainContent = (
      <SocialChat
        event={{ ...rouletteResult, crew_full }}
        initialMessages={chatHistory[rouletteResult.id] || []}
        currentUser={user?.username || user?.name}
        onSendMessage={async (msg) => {
          try {
            await api.sendChatMessage(rouletteResult.id, msg.from, msg.text);
            const key = rouletteResult.id;
            setChatHistory((prev) => {
              const list = prev[key] || [];
              const withTs = { ...msg, ts: Date.now() };
              return { ...prev, [key]: [...list, withTs] };
            });
          } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message. Please try again.");
          }
        }}
        onBack={() => {
          setShowChat(false);
          setRouletteResult(null);
          setSelectedProfile(null);
          // If admin opened it, go back to admin dashboard
          if ((user?.username || user?.name)?.toLowerCase() === 'admin') {
            setAdminOpenEventId(null);
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
            const eventData = {
              name: updatedEvent.name,
              description: updatedEvent.description || "",
              location: updatedEvent.location || "cite",
              venue: updatedEvent.venue || "",
              address: updatedEvent.address || "",
              coordinates: updatedEvent.coordinates || null,
              date: updatedEvent.date || "",
              time: updatedEvent.time || "",
              category: updatedEvent.category || "food",
              languages: updatedEvent.languages || [],
              is_public: updatedEvent.isPublic !== undefined ? updatedEvent.isPublic : true,
              event_type: updatedEvent.type || "custom",
              capacity: updatedEvent.capacity || null,
              image_url: updatedEvent.imageUrl || "",
              created_by: username,
            };
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
      />
    );
  } else if ((user?.username || user?.name)?.toLowerCase() === "admin") {
    // If admin clicked an event, show the same screen users see, focused on that event
    if (!adminOpenEventId) {
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
          onClick={handleSignOut}
          style={{ position: "absolute", top: 20, right: 20, background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", zIndex: 10 }}
        >
          Sign Out
        </button>
      </>
    );
    }
  } else if (selectedProfile) {
    const currentUserKey = user?.username || user?.name;
    const selectedKey = selectedProfile?.username || selectedProfile?.name;
    const isFriend = !!(friends[currentUserKey] && friends[currentUserKey].find(f => f.id === selectedProfile?.id));
    const hasPendingRequest = pendingFriendRequests.some(
      req => req.from === currentUserKey && req.to === selectedKey
    );
    const incomingRequest = pendingFriendRequests.find(
      req => req.from === selectedKey && req.to === currentUserKey
    );
    mainContent = (
      <UserProfile
        user={selectedProfile}
        currentUser={user}
        getUserPoints={getUserPoints}
        onBack={() => setSelectedProfile(null)}
        onAddFriend={() => {
          // Send friend request
          if (!hasPendingRequest && !isFriend) {
            setPendingFriendRequests(prev => [...prev, { from: currentUserKey, to: selectedKey }]);
          }
        }}
        onAcceptFriendRequest={() => {
          // Accept incoming request
          setFriends(prev => {
            const updated = { ...prev };
            if (!updated[currentUserKey]) updated[currentUserKey] = [];
            if (!updated[currentUserKey].find(f => f.id === selectedProfile.id)) {
              updated[currentUserKey].push(selectedProfile);
            }
            // Also add current user to selectedProfile's friends (robust id/name fallback)
            const selfFriendObj = {
              id: user?.id || user?.username || user?.name,
              name: user?.name || user?.username,
              emoji: user?.emoji,
              country: user?.country,
              desc: user?.desc,
            };
            if (!updated[selectedKey]) updated[selectedKey] = [];
            if (!updated[selectedKey].find(f => (f.id || f.name) === selfFriendObj.id)) {
              updated[selectedKey].push(selfFriendObj);
            }
            return updated;
          });
          setPendingFriendRequests(prev => prev.filter(req => !(req.from === selectedKey && req.to === currentUserKey)));
        }}
        onDeclineFriendRequest={() => {
          setPendingFriendRequests(prev => prev.filter(req => !(req.from === selectedKey && req.to === currentUserKey)));
        }}
        onRemoveFriend={() => {
          setFriends(prev => {
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
        isFriend={isFriend}
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
    mainContent = (
      <SocialChat
        event={{ ...rouletteResult, crew_full }}
        initialMessages={chatHistory[rouletteResult.id] || []}
        currentUser={user?.username || user?.name}
        onSendMessage={async (msg) => {
          try {
            // Save message to backend database
            await api.sendChatMessage(rouletteResult.id, msg.from, msg.text);
            // Also update local state for immediate display
            const key = rouletteResult.id;
            setChatHistory((prev) => {
              const list = prev[key] || [];
              const withTs = { ...msg, ts: Date.now() };
              return { ...prev, [key]: [...list, withTs] };
            });
          } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message. Please try again.");
          }
        }}
        onBack={() => {
          setShowChat(false);
          setShowResult(true);
          setSelectedProfile(null);
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
              category: updatedEvent.category || "food",
              languages: updatedEvent.languages || [],
              is_public: updatedEvent.isPublic !== undefined ? updatedEvent.isPublic : true,
              event_type: updatedEvent.type || "custom",
              capacity: updatedEvent.capacity || null,
              image_url: updatedEvent.imageUrl || "",
              created_by: username,
            };
            
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
          // Switch to viewing a different event
          setRouletteResult(newEvent);
          // Keep chat open to show the new event
        }}
        allUsers={users}
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
    mainContent = (
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
          onEditProfile={() => setShowEditProfile(true)}
          joinedEvents={joinedEvents}
          templateEventToCreate={templateEventToCreate}
          onTemplateEventHandled={() => setTemplateEventToCreate(null)}
          suggestedEvents={userSuggestedEvents}
          publicEvents={publicEvents}
          addPoints={addPoints}
          getUserPoints={getUserPoints}
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
              alert(`🎉 Success! You joined "${event.name}"!\n\n📍 ${event.location}${event.place ? ` - ${event.place}` : ''}\n⏰ ${event.date} at ${event.time}\n\n⭐ +1 point earned! You now have ${newPoints} points!\n\nCheck your "My Joined Events" section below to see it!`);
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
            
            // If clicking on own profile, go to edit profile
            if (currentUserKey === clickedUserKey) {
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
          friendEvents={(friends[user?.username || user?.name] || []).map(fr => ({
            friend: fr,
            events: userEvents[fr?.username || fr?.name] || []
          })).filter(fe => Array.isArray(fe.events) && fe.events.length > 0)}
          friendRequestsIncoming={pendingFriendRequests.filter(r => r.to === (user?.username || user?.name))}
          onAcceptFriendRequestFrom={(fromKey) => {
            const currentUserKey = user?.username || user?.name;
            const requester = users.find(u => u.name === fromKey || u.username === fromKey) || { name: fromKey, id: fromKey };
            setFriends(prev => {
              const updated = { ...prev };
              if (!updated[currentUserKey]) updated[currentUserKey] = [];
              if (!updated[currentUserKey].find(f => (f.id || f.name) === (requester.id || requester.name))) {
                updated[currentUserKey].push(requester);
              }
              const selfFriendObj = {
                id: user?.id || user?.username || user?.name,
                name: user?.name || user?.username,
                emoji: user?.emoji,
                country: user?.country,
                desc: user?.desc,
              };
              if (!updated[fromKey]) updated[fromKey] = [];
              if (!updated[fromKey].find(f => (f.id || f.name) === selfFriendObj.id)) {
                updated[fromKey].push(selfFriendObj);
              }
              return updated;
            });
            setPendingFriendRequests(prev => prev.filter(req => !(req.from === fromKey && req.to === (user?.username || user?.name))));
          }}
          onDeclineFriendRequestFrom={(fromKey) => {
            setPendingFriendRequests(prev => prev.filter(req => !(req.from === fromKey && req.to === (user?.username || user?.name))));
          }}
        />
      </>
    );
  }

  return (
    <div className="App">
      {mainContent}
    </div>
  );
}
export default App;