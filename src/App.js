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

function App() {
  const [user, setUser] = useState(null);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userEvents, setUserEvents] = useState(() => {
    // Load joined events from localStorage
    const saved = localStorage.getItem("userEvents");
    return saved ? JSON.parse(saved) : {};
  });
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem("friends");
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingFriendRequests, setPendingFriendRequests] = useState(() => {
    const saved = localStorage.getItem("pendingFriendRequests");
    return saved ? JSON.parse(saved) : [];
  });
  
  // Suggested events - events assigned by admin but not yet accepted by user
  const [suggestedEvents, setSuggestedEvents] = useState(() => {
    const saved = localStorage.getItem("suggestedEvents");
    return saved ? JSON.parse(saved) : {};
  });
  
  // Public events - load from adminEvents and filter for public only
  const [publicEvents, setPublicEvents] = useState(() => {
    const saved = localStorage.getItem("adminEvents");
    const allEvents = saved ? JSON.parse(saved) : [];
    return allEvents.filter(event => event.isPublic !== false); // Show public events (isPublic true or undefined for backward compatibility)
  });
  
  // Sync public events with adminEvents whenever localStorage changes
  useEffect(() => {
    const syncPublicEvents = () => {
      const saved = localStorage.getItem("adminEvents");
      if (saved) {
        let allEvents = JSON.parse(saved);
        
        // Migration: Add capacity to events that don't have it
        let needsUpdate = false;
        allEvents = allEvents.map(event => {
          if (event.capacity === undefined) {
            needsUpdate = true;
            // Admin events (type: "custom") have no capacity limit
            // User-created events (has host or createdBy) have capacity of 6
            const isAdminEvent = event.type === "custom" || (!event.host && !event.createdBy);
            return {
              ...event,
              capacity: isAdminEvent ? null : 6
            };
          }
          return event;
        });
        
        // Save back to localStorage if we added capacity fields
        if (needsUpdate) {
          localStorage.setItem("adminEvents", JSON.stringify(allEvents));
        }
        
        // Filter to only show public events
        setPublicEvents(allEvents.filter(event => event.isPublic !== false));
      }
    };
    
    // Listen for storage changes
    window.addEventListener("storage", syncPublicEvents);
    
    // Also check periodically in case changes happen in same tab
    const interval = setInterval(syncPublicEvents, 2000);
    
    return () => {
      window.removeEventListener("storage", syncPublicEvents);
      clearInterval(interval);
    };
  }, []);

  const joinedEvents = user ? userEvents[user?.username || user?.name] || [] : [];
  const userSuggestedEvents = user ? suggestedEvents[user?.username || user?.name] || [] : [];

  // Migration: Add capacity to userEvents that don't have it
  useEffect(() => {
    let needsUpdate = false;
    const migratedUserEvents = { ...userEvents };
    
    Object.keys(migratedUserEvents).forEach(username => {
      migratedUserEvents[username] = migratedUserEvents[username].map(event => {
        if (event.capacity === undefined) {
          needsUpdate = true;
          // Admin events (type: "custom") have no capacity limit
          // User-created events (has host or createdBy) have capacity of 6
          const isAdminEvent = event.type === "custom" || (!event.host && !event.createdBy);
          return {
            ...event,
            capacity: isAdminEvent ? null : 6
          };
        }
        return event;
      });
    });
    
    if (needsUpdate) {
      setUserEvents(migratedUserEvents);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - migration only

  useEffect(() => {
    localStorage.setItem("userEvents", JSON.stringify(userEvents));
  }, [userEvents]);
  useEffect(() => {
    localStorage.setItem("suggestedEvents", JSON.stringify(suggestedEvents));
  }, [suggestedEvents]);
  // Reference unused setters to satisfy linter (setters may be used in future flows)
  useEffect(() => {
    // no-op
  }, [setUserEvents, setChatHistory]);
  useEffect(() => {
    localStorage.setItem("friends", JSON.stringify(friends));
  }, [friends]);
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);
  useEffect(() => {
    localStorage.setItem("pendingFriendRequests", JSON.stringify(pendingFriendRequests));
  }, [pendingFriendRequests]);

  // Expose cleanup function to browser console and auto-remove specific event
  useEffect(() => {
    window.removeEventByNameAndDate = (eventName, eventDate) => {
      // Remove from adminEvents
      const adminEvents = localStorage.getItem("adminEvents");
      if (adminEvents) {
        const events = JSON.parse(adminEvents);
        const filtered = events.filter(e => !(e.name === eventName && e.date === eventDate));
        localStorage.setItem("adminEvents", JSON.stringify(filtered));
        console.log(`✅ Removed ${events.length - filtered.length} event(s) from adminEvents`);
      }

      // Remove from userEvents state
      setUserEvents(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(username => {
          updated[username] = updated[username].filter(e => !(e.name === eventName && e.date === eventDate));
        });
        return updated;
      });

      console.log("✅ Event removed! Page will reload.");
      setTimeout(() => window.location.reload(), 500);
    };

    // Auto-remove the Language Exchange event
    const autoCleanup = () => {
      let needsReload = false;

      // Remove from adminEvents
      const adminEvents = localStorage.getItem("adminEvents");
      if (adminEvents) {
        const events = JSON.parse(adminEvents);
        const filtered = events.filter(e => !(e.name === "Language Exchange" && e.date === "2025-11-02"));
        if (filtered.length !== events.length) {
          localStorage.setItem("adminEvents", JSON.stringify(filtered));
          console.log("🗑️ Auto-removed Language Exchange event from adminEvents");
          needsReload = true;
        }
      }

      // Remove from all users' joined events
      Object.keys(localStorage).forEach(key => {
        if (key === "userEvents") {
          const userEvents = JSON.parse(localStorage.getItem(key) || "{}");
          let modified = false;
          Object.keys(userEvents).forEach(username => {
            const original = userEvents[username].length;
            userEvents[username] = userEvents[username].filter(e => !(e.name === "Language Exchange" && e.date === "2025-11-02"));
            if (userEvents[username].length !== original) {
              modified = true;
              console.log(`�️ Removed Language Exchange from ${username}'s events`);
            }
          });
          if (modified) {
            localStorage.setItem(key, JSON.stringify(userEvents));
            needsReload = true;
          }
        }
      });

      if (needsReload) {
        console.log("✅ Cleanup complete! Reloading...");
        setTimeout(() => window.location.reload(), 500);
      }
    };

    autoCleanup();

    console.log("🔧 To remove an event, use: removeEventByNameAndDate('Event Name', 'YYYY-MM-DD')");
  }, []);

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
  } else if ((user?.username || user?.name)?.toLowerCase() === "admin") {
    mainContent = (
      <>
        <AdminAssign
          userEvents={userEvents}
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
    // Build crew_full: all users who joined this event
    let crew_full = [];
    Object.entries(userEvents).forEach(([userKey, events]) => {
      if (Array.isArray(events) && events.find(ev => ev.name === rouletteResult?.name)) {
        const userInfo = users.find(u => u.name === userKey || u.username === userKey);
        if (userInfo) crew_full.push(userInfo);
        else crew_full.push({ name: userKey });
      }
    });
    mainContent = (
      <SocialChat
        event={{ ...rouletteResult, crew_full }}
        initialMessages={chatHistory[rouletteResult.name] || []}
        currentUser={user?.username || user?.name}
        onSendMessage={(msg) => {
          const key = rouletteResult.name;
          setChatHistory((prev) => {
            const list = prev[key] || [];
            const withTs = { ...msg, ts: Date.now() };
            return { ...prev, [key]: [...list, withTs] };
          });
        }}
        onBack={() => {
          setShowChat(false);
          setShowResult(true);
        }}
        onHome={() => {
          setShowChat(false);
          setRouletteResult(null);
        }}
        onUserClick={setSelectedProfile}
        onLeaveEvent={(evToRemove) => {
          const currentUserKey = user?.username || user?.name;
          // Remove from user's joined events
          setUserEvents(prev => {
            const updated = { ...prev };
            const list = Array.isArray(updated[currentUserKey]) ? updated[currentUserKey] : [];
            updated[currentUserKey] = list.filter(ev => String(ev.id || ev.name) !== String(evToRemove?.id || evToRemove?.name));
            return updated;
          });
          // Navigate back to home
          setShowChat(false);
          setRouletteResult(null);
          // Show confirmation
          alert(`You have left the event "${evToRemove?.name}"`);
        }}
        onEditEvent={(updatedEvent) => {
          // Update in adminEvents localStorage
          const saved = localStorage.getItem("adminEvents");
          if (saved) {
            const events = JSON.parse(saved);
            const index = events.findIndex(e => e.id === updatedEvent.id);
            if (index !== -1) {
              events[index] = updatedEvent;
              localStorage.setItem("adminEvents", JSON.stringify(events));
              
              // Update the rouletteResult to reflect changes
              setRouletteResult(updatedEvent);
              
              // Also update in userEvents state and localStorage
              const userKey = user?.username || user?.name;
              setUserEvents(prev => {
                const newUserEvents = { ...prev };
                if (newUserEvents[userKey]) {
                  const userEventIndex = newUserEvents[userKey].findIndex(e => e.id === updatedEvent.id);
                  if (userEventIndex !== -1) {
                    newUserEvents[userKey][userEventIndex] = updatedEvent;
                  }
                }
                return newUserEvents;
              });
              
              // Also update in joinedEvents localStorage
              const joinedKey = `joinedEvents_${userKey}`;
              const joinedSaved = localStorage.getItem(joinedKey);
              if (joinedSaved) {
                const joinedEvents = JSON.parse(joinedSaved);
                const joinedIndex = joinedEvents.findIndex(e => e.id === updatedEvent.id);
                if (joinedIndex !== -1) {
                  joinedEvents[joinedIndex] = updatedEvent;
                  localStorage.setItem(joinedKey, JSON.stringify(joinedEvents));
                }
              }
              
              alert("✨ Event updated successfully!");
            }
          }
        }}
        onDeleteEvent={(eventToDelete) => {
          // Remove from adminEvents localStorage
          const saved = localStorage.getItem("adminEvents");
          if (saved) {
            const events = JSON.parse(saved);
            const filteredEvents = events.filter(e => e.id !== eventToDelete.id);
            localStorage.setItem("adminEvents", JSON.stringify(filteredEvents));
          }
          
          // Remove from all users' joined events
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith("joinedEvents_")) {
              const joinedEvents = JSON.parse(localStorage.getItem(key) || "[]");
              const filtered = joinedEvents.filter(e => e.id !== eventToDelete.id);
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          });
          
          // Remove from userEvents state
          setUserEvents(prev => {
            const newUserEvents = { ...prev };
            Object.keys(newUserEvents).forEach(key => {
              newUserEvents[key] = newUserEvents[key].filter(e => e.id !== eventToDelete.id);
            });
            return newUserEvents;
          });
          
          // Navigate back to home
          setShowChat(false);
          setRouletteResult(null);
          alert("🗑️ Event deleted successfully!");
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
          suggestedEvents={userSuggestedEvents}
          publicEvents={publicEvents}
          addPoints={addPoints}
          getUserPoints={getUserPoints}
          onJoinPublicEvent={(event) => {
            const currentUserKey = user?.username || user?.name;
            // Check if already joined
            const list = userEvents[currentUserKey] || [];
            if (list.find(x => String(x.id) === String(event.id))) {
              alert(`You've already joined "${event.name}"! Check your joined events below.`);
              return;
            }
            // Add public event to joined events
            setUserEvents(prev => {
              const updated = { ...prev };
              const list = updated[currentUserKey] || [];
              updated[currentUserKey] = [...list, event];
              return updated;
            });
            // Award 1 point for joining an event
            const newPoints = addPoints(currentUserKey, 1);
            // Show success message
            alert(`🎉 Success! You joined "${event.name}"!\n\n📍 ${event.location}${event.place ? ` - ${event.place}` : ''}\n⏰ ${event.date} at ${event.time}\n\n⭐ +1 point earned! You now have ${newPoints} points!\n\nCheck your "My Joined Events" section below to see it!`);
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
          onUserClick={setSelectedProfile}
          onLeaveEvent={(evToRemove) => {
            const currentUserKey = user?.username || user?.name;
            setUserEvents(prev => {
              const updated = { ...prev };
              const list = Array.isArray(updated[currentUserKey]) ? updated[currentUserKey] : [];
              updated[currentUserKey] = list.filter(ev => String(ev.id || ev.name) !== String(evToRemove?.id || evToRemove?.name));
              return updated;
            });
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