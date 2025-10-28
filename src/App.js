import React, { useState, useEffect } from "react";
import Login from "./Login";
import SocialHome from "./SocialHome";
import SocialForm from "./SocialForm";
import SocialRoulette from "./SocialRoulette";
import AdminAssign from "./AdminAssign";
import UserProfile from "./UserProfile";
import EditMyProfile from "./EditMyProfile";
import SocialChat from "./SocialChat";
import SocialResult from "./SocialResult";
import WaitingForAdmin from "./WaitingForAdmin";
import users from "./users";
import allEvents from "./events";

function App() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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
  const [pendingRequests, setPendingRequests] = useState(() => {
    const saved = localStorage.getItem("pendingRequests");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPendingRequestIdx, setSelectedPendingRequestIdx] = useState(null);
  
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
        const allEvents = JSON.parse(saved);
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
  useEffect(() => {
    localStorage.setItem("pendingRequests", JSON.stringify(pendingRequests));
  }, [pendingRequests]);

  const handleLogin = (usernameOrObj) => {
    let userObj = usernameOrObj;
    if (typeof usernameOrObj === "string") {
      userObj = users.find(u => u.name.toLowerCase() === usernameOrObj.toLowerCase() || u.id === usernameOrObj || u.username === usernameOrObj);
      if (!userObj) userObj = { username: usernameOrObj, name: usernameOrObj };
    }
    setUser(userObj);
  };
  const handleSignOut = () => {
  setUser(null);
  setShowRoulette(false);
  setShowResult(false);
  setShowChat(false);
  setWaitingForAdmin(false);
  setSelectedProfile(null);
  };

  let mainContent;
  if (!user) {
    mainContent = <Login onLogin={handleLogin} />;
  } else if (showEditProfile) {
    mainContent = (
      <EditMyProfile
        userName={user?.username || user?.name}
        onBack={() => setShowEditProfile(false)}
      />
    );
  } else if ((user?.username || user?.name)?.toLowerCase() === "admin") {
    mainContent = (
      <>
        <AdminAssign
          pendingRequests={pendingRequests}
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
          onAssignEvent={(reqIdx, eventId, eventObj) => {
            if (!eventId || eventId === "") return; // guard against empty/falsy eventId
            const req = pendingRequests[reqIdx];
            if (!req) return;
            const userKey = typeof req.user === "object" ? (req.user.username || req.user.name) : req.user;
            // Use passed event object if available, otherwise try to find in allEvents
            const ev = eventObj || allEvents.find(e => String(e.id) === String(eventId));
            if (!ev) return;
            
            // Calculate match score and details
            const userRequest = req.event || {};
            const matchDetails = {
              location: userRequest.location && ev.location ? 
                String(ev.location).toLowerCase() === String(userRequest.location).toLowerCase() : null,
              category: userRequest.category && ev.category ? 
                ev.category === userRequest.category : null,
              timePreference: userRequest.timePreference ? 
                true : null, // Can't match timePreference perfectly, just acknowledge it exists
              language: userRequest.language && ev.languages ? 
                ev.languages.includes(userRequest.language) : null,
            };
            const matchCount = Object.values(matchDetails).filter(v => v === true).length;
            const totalCriteria = Object.values(matchDetails).filter(v => v !== null).length;
            const matchPercentage = totalCriteria > 0 ? Math.round((matchCount / totalCriteria) * 100) : 100;
            
            // Add event to suggested events with match info
            const eventWithMatch = {
              ...ev,
              matchDetails,
              matchPercentage,
              userRequest, // Include original request for reference
            };
            
            setSuggestedEvents(prev => {
              const updated = { ...prev };
              const list = updated[userKey] || [];
              if (!list.find(x => String(x.id || x.name) === String(ev.id))) {
                updated[userKey] = [...list, eventWithMatch];
              }
              return updated;
            });
            // Update pending request to stage 3 with assigned event id
            setPendingRequests(prev => prev.map((r, i) => {
              if (i !== reqIdx) return r;
              const now = Date.now();
              const nextHistory = Array.isArray(r.history) ? [...r.history, { stage: 3, ts: now }] : [{ stage: 3, ts: now }];
              return { ...r, stage: 3, assignedEventId: ev.id, history: nextHistory };
            }));
            // Check crew size for stage 4 (simple heuristic: at least 4 users joined)
            setTimeout(() => {
              const participants = Object.values(userEvents).reduce((acc, events) => acc + (Array.isArray(events) && events.find(e2 => String(e2.id) === String(ev.id)) ? 1 : 0), 0) + 1; // +1 for newly assigned
              if (participants >= 4) {
                setPendingRequests(prev => prev.map((r, i) => {
                  if (i !== reqIdx) return r;
                  const now2 = Date.now();
                  const nextHistory2 = Array.isArray(r.history) ? [...r.history, { stage: 4, ts: now2 }] : [{ stage: 4, ts: now2 }];
                  return { ...r, stage: 4, history: nextHistory2 };
                }));
              }
            }, 0);
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
        onLeaveEvent={() => {
          setShowChat(false);
          setRouletteResult(null);
        }}
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
  } else if (waitingForAdmin) {
    const currentUserKey = user?.username || user?.name;
    // If a specific request is selected, use it; otherwise find by current user
    let req;
    if (selectedPendingRequestIdx !== null && pendingRequests[selectedPendingRequestIdx]) {
      req = pendingRequests[selectedPendingRequestIdx];
    } else {
      req = pendingRequests.find(r => (typeof r.user === 'object' ? (r.user.username || r.user.name) : r.user) === currentUserKey);
    }
    // Look for assigned event in suggested events or allEvents
    let assignedEvent = null;
    if (req?.assignedEventId) {
      const suggestedList = userSuggestedEvents || [];
      assignedEvent = suggestedList.find(e => String(e.id) === String(req.assignedEventId)) || 
                      allEvents.find(e => String(e.id) === String(req.assignedEventId)) || 
                      null;
    }
    mainContent = (
      <WaitingForAdmin
        onHome={() => {
          setWaitingForAdmin(false);
          setSelectedPendingRequestIdx(null);
        }}
        request={req}
        assignedEvent={assignedEvent}
        onGoChat={() => {
          if (!assignedEvent) return;
          // mark complete by removing the pending request
          setPendingRequests(prev => prev.filter((_, i) => i !== selectedPendingRequestIdx));
          setWaitingForAdmin(false);
          setSelectedPendingRequestIdx(null);
          setRouletteResult(assignedEvent);
          setShowChat(true);
        }}
      />
    );
  } else if (showForm) {
    mainContent = (
      <SocialForm
        currentUserKey={user?.username || user?.name}
        onConfirm={(payload) => {
          const requester = user?.username || user?.name;
          const now = Date.now();
          setPendingRequests((prev) => [
            ...prev,
            { user: requester, event: payload, stage: 2, history: [{ stage: 1, ts: now }, { stage: 2, ts: now }] },
          ]);
          setShowForm(false);
          setWaitingForAdmin(true);
        }}
        onHome={() => setShowForm(false)}
      />
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
          onJoinEvent={() => setShowForm(true)}
          onEditProfile={() => setShowEditProfile(true)}
          joinedEvents={joinedEvents}
          suggestedEvents={userSuggestedEvents}
          publicEvents={publicEvents}
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
            // Show success message
            alert(`🎉 Success! You joined "${event.name}"!\n\n📍 ${event.location}${event.place ? ` - ${event.place}` : ''}\n⏰ ${event.date} at ${event.time}\n\nCheck your "My Joined Events" section below to see it!`);
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
            // Mark pending request as complete (stage 5) and remove it
            setPendingRequests(prev => prev.filter(r => {
              const userKey = typeof r.user === "object" ? (r.user.username || r.user.name) : r.user;
              return userKey !== currentUserKey || String(r.assignedEventId) !== String(event.id);
            }));
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
            // Revert pending request back to stage 2 (waiting for admin)
            setPendingRequests(prev => prev.map(r => {
              const userKey = typeof r.user === "object" ? (r.user.username || r.user.name) : r.user;
              if (userKey === currentUserKey && String(r.assignedEventId) === String(event.id)) {
                return { ...r, stage: 2, assignedEventId: null };
              }
              return r;
            }));
          }}
          pendingRequests={pendingRequests.filter(r => r.user === (user?.username || user?.name) && r.event)}
          onCancelPendingRequest={idx => setPendingRequests(prev => prev.filter((_, i) => i !== idx))}
          onOpenPendingRequest={(idx) => {
            setSelectedPendingRequestIdx(idx);
            setWaitingForAdmin(true);
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
          onRequestJoinEvent={(friend, event) => {
            const requester = user?.username || user?.name;
            setPendingRequests(prev => [
              ...prev,
              { user: requester, event, targetFriend: friend?.name || friend?.username }
            ]);
          }}
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