import React, { useState, useEffect } from "react";
import Login from "./Login";
import SocialHome from "./SocialHome";
import SocialForm from "./SocialForm";
import SocialRoulette from "./SocialRoulette";
import AdminAssign from "./AdminAssign";
import UserProfile from "./UserProfile";
import SocialChat from "./SocialChat";
import SocialResult from "./SocialResult";
import WaitingForAdmin from "./WaitingForAdmin";
import users from "./users";
import axios from "axios";

function App() {
  const [user, setUser] = useState(null);
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
  const [showDebug, setShowDebug] = useState(false);

  const joinedEvents = user ? userEvents[user?.username || user?.name] || [] : [];

  useEffect(() => {
    localStorage.setItem("userEvents", JSON.stringify(userEvents));
  }, [userEvents]);
  useEffect(() => {
    localStorage.setItem("friends", JSON.stringify(friends));
  }, [friends]);
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
  } else if ((user?.username || user?.name)?.toLowerCase() === "admin") {
    mainContent = (
      <>
        <AdminAssign
          pendingRequests={pendingRequests}
          onAssignEvent={() => {}}
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
    mainContent = (
      <UserProfile
        user={selectedProfile}
        onBack={() => setSelectedProfile(null)}
  onAddFriend={() => {}}
  isFriend={!!(friends[user?.username || user?.name] && friends[user?.username || user?.name].find(f => f.id === selectedProfile?.id))}
  onRequestJoinEvent={() => {}}
        joinedEvents={userEvents[selectedProfile?.username || selectedProfile?.name] || []}
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
        onSendMessage={() => {}}
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
    mainContent = (<WaitingForAdmin onHome={() => {}} />);
  } else if (showForm) {
    mainContent = (<SocialForm onConfirm={() => {}} onHome={() => setShowForm(false)} />);
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
          joinedEvents={joinedEvents}
          pendingRequests={pendingRequests.filter(r => r.user === (user?.username || user?.name) && r.event)}
          onCancelPendingRequest={idx => setPendingRequests(prev => prev.filter((_, i) => i !== idx))}
          onJoinedEventClick={event => {
            setRouletteResult(event);
            setShowChat(true);
          }}
          onUserClick={setSelectedProfile}
          onLeaveEvent={() => {}}
          showDebug={true}
        />
      </>
    );
  }
  let debugMsg = "";
  if (!user) debugMsg = "[DEBUG] Rendering: Login";
  else if ((user?.username || user?.name)?.toLowerCase() === "admin") debugMsg = `[DEBUG] Rendering: AdminAssign for user ${user?.username || user?.name}`;
  else if (selectedProfile) debugMsg = `[DEBUG] Rendering: UserProfile for user ${selectedProfile?.username || selectedProfile?.name}`;
  else if (showChat && rouletteResult) debugMsg = `[DEBUG] Rendering: SocialChat for event ${rouletteResult?.name}`;
  else if (showResult && rouletteResult) debugMsg = `[DEBUG] Rendering: SocialResult for event ${rouletteResult?.name}`;
  else if (showRoulette) debugMsg = `[DEBUG] Rendering: SocialRoulette`;
  else if (waitingForAdmin) debugMsg = `[DEBUG] Rendering: WaitingForAdmin`;
  else if (showForm) debugMsg = `[DEBUG] Rendering: SocialForm`;
  else debugMsg = `[DEBUG] Rendering: SocialHome for user ${user?.username || user?.name}`;

  return (
    <div className="App">
      {mainContent}
    </div>
  );
}
export default App;