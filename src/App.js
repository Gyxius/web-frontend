
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
  const [user, setUser] = useState(null); // user object or username string
  // Handler for sign out
  const handleSignOut = () => {
    setUser(null);
  };
  // Stub missing handler functions
    const handleAdminAssign = () => {};
    const handleAddFriend = () => {};
    const handleRequestJoinEvent = () => {};
    const handleSendMessage = () => {};
    const goHome = () => {};
    const handleLeaveEvent = () => {};
    const handleJoinEvent = () => {};
    const handleRouletteRequest = () => {};
    const handleSocialFormConfirm = () => {};
    const handleJoinedEventClick = () => {};
  // ...existing code...
  // Log user login
  const handleLogin = (usernameOrObj) => {
    let userObj = usernameOrObj;
    // If only username string, try to find user object
    if (typeof usernameOrObj === "string") {
      userObj = users.find(u => u.name.toLowerCase() === usernameOrObj.toLowerCase() || u.id === usernameOrObj || u.username === usernameOrObj);
      if (!userObj) userObj = { username: usernameOrObj, name: usernameOrObj };
    }
    console.log(`[ACTIVITY] ${userObj.name || userObj.username} logs in`);
    setUser(userObj);
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

  // Removed useEffect that conditionally called setSearches (searches state removed)

  let mainContent;
  if (!user) {
    mainContent = <Login onLogin={handleLogin} />;
  } else if ((user?.username || user?.name)?.toLowerCase() === "admin") {
    mainContent = (
      <>
        <AdminAssign
          pendingRequests={pendingRequests}
          onAssignEvent={handleAdminAssign}
        />
        <button
          onClick={() => setUser(null)}
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
        onAddFriend={handleAddFriend}
        isFriend={!!(friends[user?.username || user?.name] && friends[user?.username || user?.name].find(f => f.id === selectedProfile?.id))}
        onRequestJoinEvent={handleRequestJoinEvent}
        joinedEvents={userEvents[selectedProfile?.username || selectedProfile?.name] || []}
      />
    );
  } else if (showChat && rouletteResult) {
    mainContent = (
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
          handleJoinEvent(rouletteResult);
          setShowResult(false);
          setShowChat(true);
        }}
        onUserClick={setSelectedProfile}
      />
    );
  } else if (showRoulette) {
    mainContent = (
      <SocialRoulette onResult={(event) => {
        handleRouletteRequest(event);
        setShowRoulette(false);
      }} />
    );
  } else if (waitingForAdmin) {
    mainContent = (<WaitingForAdmin onHome={goHome} />);
  } else if (showForm) {
    mainContent = (<SocialForm onConfirm={handleSocialFormConfirm} />);
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
            zIndex: 10,
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
          onJoinedEventClick={handleJoinedEventClick}
          onUserClick={setSelectedProfile}
          onLeaveEvent={handleLeaveEvent}
          showDebug={showDebug}
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
