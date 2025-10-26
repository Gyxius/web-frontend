import React, { useState, useEffect } from "react";
import Login from "./Login";
import SocialHome from "./SocialHome";
import SocialForm from "./SocialForm";
import SocialRoulette from "./SocialRoulette";
import SocialResult from "./SocialResult";
import SocialChat from "./SocialChat";
import UserProfile from "./UserProfile";
import AdminAssign from "./AdminAssign";
import users from "./users";
import axios from "axios";
import "./App.css";

function WaitingForAdmin({ onHome }) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h2>Waiting for Admin Approval...</h2>
      <p>Your request has been sent to the admin.</p>
      <div style={{ fontSize: 48, margin: 24 }}>⏳</div>
      <p>Please wait until the admin assigns you to an event.</p>
      <button
        style={{ marginTop: 32, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
        onClick={onHome}
      >
        🏠 Home
      </button>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  // Log user login
  const handleLogin = (username) => {
    console.log(`[ACTIVITY] ${username} logs in`);
    setUser(username);
  };
  const [showForm, setShowForm] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userEvents, setUserEvents] = useState(() => {
    const saved = localStorage.getItem("userEvents");
    return saved ? JSON.parse(saved) : {};
  });
  const [chatHistory, setChatHistory] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem("friends");
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingRequests, setPendingRequests] = useState(() => {
    const saved = localStorage.getItem("pendingRequests");
    return saved ? JSON.parse(saved) : [];
  });
  // Removed showAdminAssignConfirm and setShowAdminAssignConfirm since not used in render
  const [showDebug, setShowDebug] = useState(false);

  const joinedEvents = user ? userEvents[user] || [] : [];

  useEffect(() => {
    localStorage.setItem("userEvents", JSON.stringify(userEvents));
  }, [userEvents]);

  useEffect(() => {
    localStorage.setItem("friends", JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem("pendingRequests", JSON.stringify(pendingRequests));
  }, [pendingRequests]);

  // Removed useEffect that conditionally called setSearches (searches state removed)

  const logActivity = (msg) => {
    if (user) {
      console.log(`[ACTIVITY] user "${user}": ${msg}`);
    } else {
      console.log(`[ACTIVITY] ${msg}`);
    }
  };

  const handleSignOut = () => {
    if (user && user.toLowerCase() === "admin") {
      console.log(`[ACTIVITY] Admin signs out`);
    } else if (user) {
      console.log(`[ACTIVITY] ${user} signs out`);
    }
    logActivity("signed out");
    setUser(null);
    setShowForm(false);
    setShowRoulette(false);
    setRouletteResult(null);
    setShowResult(false);
    setShowChat(false);
  };

  const handleJoinEvent = (event) => {
    logActivity(`joined event "${event.name || event.type || event.category || "Event"}"`);
    setUserEvents((prev) => {
      const events = prev[user] ? [...prev[user], event] : [event];
      return { ...prev, [user]: events };
    });
    setChatHistory((prev) => {
      const key = event.name;
      if (!prev[key]) {
        return { ...prev, [key]: [
          { from: "You", text: `Hey team! Ready for ${event.name}?` },
        ] };
      }
      return prev;
    });
  };

  const handleLeaveEvent = (event) => {
    logActivity(`left event "${event.name || event.type || event.category || "Event"}"`);
    setUserEvents((prev) => {
      const events = prev[user] ? prev[user].filter(e => e.name !== event.name) : [];
      return { ...prev, [user]: events };
    });
    setChatHistory((prev) => {
      const updated = { ...prev };
      delete updated[event.name];
      return updated;
    });
  };

  const handleJoinedEventClick = (event) => {
    logActivity(`clicked on joined event "${event.name || event.type || event.category || "Event"}"`);
    setRouletteResult(event);
    setShowChat(true);
    setShowForm(false);
    setShowRoulette(false);
    setShowResult(false);
  };

  const handleSendMessage = (event, message) => {
    logActivity(`sent message in event "${event.name || event.type || event.category || "Event"}": ${message.text}`);
    setChatHistory((prev) => {
      const key = event.name;
      const history = prev[key] || [];
      return { ...prev, [key]: [...history, message] };
    });
  };

  const handleAddFriend = (friendUser) => {
    logActivity(`added friend "${friendUser.name}"`);
    setFriends((prev) => {
      const userFriends = prev[user] ? [...prev[user]] : [];
      if (!userFriends.find(f => f.id === friendUser.id)) {
        return { ...prev, [user]: [...userFriends, friendUser] };
      }
      return prev;
    });
  };

  const handleRequestJoinEvent = (friend, event) => {
    logActivity(`requested to join friend "${friend.name}"'s event "${event.name}"`);
    setChatHistory((prev) => {
      const key = event.name;
      const history = prev[key] || [];
      return {
        ...prev,
        [key]: [...history, { from: user, text: `Request to join ${friend.name}'s event: ${event.name}` }],
      };
    });
    setUserEvents((prev) => {
      const events = prev[user] ? [...prev[user], event] : [event];
      return { ...prev, [user]: events };
    });
  };

  const [lastFormPayload, setLastFormPayload] = useState(null);
  const handleRouletteRequest = (event) => {
    logActivity(`spun roulette for event "${event.name || event.type || event.category || "Event"}"`);
    if (lastFormPayload) {
      const newRequest = { user, event: lastFormPayload, status: "pending" };
      console.log("[DEBUG] Adding pending request:", newRequest);
      setPendingRequests((prev) => [
        ...prev,
        newRequest
      ]);
      setLastFormPayload(null);
    }
    setWaitingForAdmin(true);
    setRouletteResult(event);
  };

  // Removed unused handleApproveRequest

  const goHome = () => {
    setShowChat(false);
    setShowForm(false);
    setShowRoulette(false);
    setShowResult(false);
    setRouletteResult(null);
    setSelectedProfile(null);
    setWaitingForAdmin(false);
  };

  const handleSocialFormConfirm = async (payload) => {
    logActivity("confirmed social form");
    const userObj = users.find(u => u.name.toLowerCase() === user.toLowerCase());
    const searchRequest = {
      userId: userObj ? userObj.id : user,
      ...payload
    };
    try {
      await axios.post("http://localhost:8000/search_requests", searchRequest);
    } catch (err) {
      // Optionally show error to user
    }
    setLastFormPayload(payload);
    setShowRoulette(true);
  };

  return (
    <div className="App">
      <button
        style={{ position: "fixed", top: 8, left: 8, zIndex: 1000, background: showDebug ? "#ef4444" : "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 600, cursor: "pointer" }}
        onClick={() => setShowDebug(v => !v)}
      >
        {showDebug ? "Hide Debug" : "Show Debug"}
      </button>
      {showDebug && (
        <pre style={{ position: "fixed", top: 44, left: 8, background: "#fff", color: "#333", fontSize: 12, zIndex: 999, maxHeight: 200, overflow: "auto", padding: 8, border: "1px solid #eee" }}>
          [DEBUG] pendingRequests: {JSON.stringify(pendingRequests, null, 2)}
        </pre>
      )}
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.toLowerCase() === "admin" ? (
        <>
          <AdminAssign
            pendingRequests={pendingRequests}
            onAssignEvent={(idx, eventId) => {
              // Assign event to user
              const req = pendingRequests[idx];
              // Find event by id
              const events = [
                { id: "e1", name: "Karaoke on the Rooftop", time: "10:00 PM" },
                { id: "e2", name: "Picnic @ Montsouris", time: "9:00 PM" },
                { id: "e3", name: "Board Games Evening", time: "7:30 PM" },
              ];
              const eventObj = events.find(ev => ev.id === eventId);
              if (req && eventObj) {
                // Always include the user from the pending request at idx
                let assignedUsers = pendingRequests
                  .filter(r => r.event && (r.event.id === eventObj.id || r.event.name === eventObj.name))
                  .map(r => r.user);
                if (!assignedUsers.includes(req.user)) {
                  assignedUsers.push(req.user);
                }
                // Build crew array
                const crew = assignedUsers.map(u => ({ name: u }));
                // Add event with crew to all assigned users
                setUserEvents(prev => {
                  const updated = { ...prev };
                  // Use the pending request at idx for merging
                  const assignedPending = pendingRequests[idx];
                  assignedUsers.forEach(u => {
                    const eventsArr = updated[u] ? [...updated[u]] : [];
                    // Merge assigned event details with the pending request at idx
                    const mergedEvent = {
                      ...assignedPending?.event,
                      ...eventObj,
                      crew
                    };
                    // Remove any previous instance of this event (by id or date)
                    const filtered = eventsArr.filter(e => (eventObj.id ? e.id !== eventObj.id : e.date !== mergedEvent.date));
                    updated[u] = [...filtered, mergedEvent];
                  });
                  return updated;
                });
                // Remove all pending requests for this user and the original pending request's date
                  setPendingRequests(prev => prev.filter(r => {
                    // Remove if user matches and event date matches the original pending request's date
                    const assignedUser = req.user;
                    const assignedDate = req.event && req.event.date;
                    return !(r.user === assignedUser && r.event && r.event.date === assignedDate);
                  }));
                 // Force a refresh so users see updated events
                 setTimeout(() => {
                   window.location.reload();
                 }, 500);
              }
            }}
          />
          <button
            onClick={() => setUser(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", zIndex: 10 }}
          >
            Sign Out
          </button>
        </>
      ) : selectedProfile ? (
        <UserProfile
          user={selectedProfile}
          onBack={() => setSelectedProfile(null)}
          onAddFriend={handleAddFriend}
          isFriend={!!(friends[user] && friends[user].find(f => f.id === selectedProfile?.id))}
          onRequestJoinEvent={handleRequestJoinEvent}
          joinedEvents={userEvents[selectedProfile?.username] || []}
        />
      ) : showChat && rouletteResult ? (
        <SocialChat
          event={rouletteResult}
          initialMessages={chatHistory[rouletteResult.name] || []}
          onSendMessage={(msg) => handleSendMessage(rouletteResult, msg)}
          onBack={() => {
            setShowChat(false);
            setShowResult(true);
          }}
          onHome={goHome}
          onUserClick={setSelectedProfile}
          onLeaveEvent={(event) => {
            handleLeaveEvent(event);
            setShowChat(false);
            setRouletteResult(null);
          }}
        />
      ) : showResult && rouletteResult ? (
        <SocialResult
          event={rouletteResult}
          onBack={() => {
            setShowResult(false);
            setShowRoulette(true);
            setRouletteResult(null);
          }}
          onChat={() => {
            handleJoinEvent(rouletteResult);
            setShowResult(false);
            setShowChat(true);
          }}
          onUserClick={setSelectedProfile}
        />
      ) : showRoulette ? (
        <SocialRoulette onResult={(event) => {
          handleRouletteRequest(event);
          setShowRoulette(false);
        }} />
      ) : waitingForAdmin ? (
        <WaitingForAdmin onHome={goHome} />
  ) : showForm ? (
        <SocialForm onConfirm={handleSocialFormConfirm} />
      ) : user && user.toLowerCase() === "admin" ? (
        <>
          <AdminAssign
            pendingRequests={pendingRequests}
            onAssignEvent={(idx, eventId) => {
              // Assign event to user
              const req = pendingRequests[idx];
              // Find event by id
              const events = [
                { id: "e1", name: "Karaoke on the Rooftop", time: "10:00 PM" },
                { id: "e2", name: "Picnic @ Montsouris", time: "9:00 PM" },
                { id: "e3", name: "Board Games Evening", time: "7:30 PM" },
              ];
              const eventObj = events.find(ev => ev.id === eventId);
              if (req && eventObj) {
                // Find all users assigned to this event (including this one)
                const assignedUsers = pendingRequests
                  .filter(r => r.event && (r.event.id === eventObj.id || r.event.name === eventObj.name))
                  .map(r => r.user);
                // Build crew array
                const crew = assignedUsers.map(u => ({ name: u }));
                // Add event with crew to all assigned users
                setUserEvents(prev => {
                  const updated = { ...prev };
                  assignedUsers.forEach(u => {
                    const eventsArr = updated[u] ? [...updated[u]] : [];
                    // Remove any previous instance of this event
                    const filtered = eventsArr.filter(e => e.id !== eventObj.id);
                    updated[u] = [...filtered, { ...eventObj, crew }];
                  });
                  return updated;
                });
                // Remove all pending requests for this event
                setPendingRequests(prev => prev.filter(r => !(r.event && (r.event.id === eventObj.id || r.event.name === eventObj.name))));
              }
            }}
          />
          <button
            onClick={() => setUser(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", zIndex: 10 }}
          >
            Sign Out
          </button>
        </>
      ) : (
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
              zIndex: 10,
            }}
          >
            Sign Out
          </button>
          <SocialHome
            userName={user}
            onJoinEvent={() => setShowForm(true)}
            joinedEvents={joinedEvents}
            pendingRequests={pendingRequests.filter(r => r.user === user && r.event)}
            onCancelPendingRequest={idx => setPendingRequests(prev => prev.filter((_, i) => i !== idx))}
            onJoinedEventClick={handleJoinedEventClick}
            onUserClick={setSelectedProfile}
            onLeaveEvent={handleLeaveEvent}
          />
        </>
      )}
      {/* Only show global Home button if not waiting for admin */}
      {!waitingForAdmin && (
        <button
          onClick={goHome}
          style={{ position: "fixed", bottom: 20, left: 20, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", zIndex: 100 }}
        >
          🏠 Home
        </button>
      )}
    </div>
  );
}

export default App;
