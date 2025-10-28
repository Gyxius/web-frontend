import React, { useState } from "react";
import axios from "axios";
import localEvents from "./events";

function SocialRoulette({ onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState(null);

  const fetchEvents = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.get(`${apiUrl}/events`);
      return response.data;
    } catch (error) {
      // Fallback to local seed events
      return localEvents;
    }
  };

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.get(`${apiUrl}/users`);
      return response.data;
    } catch (error) {
      return [];
    }
  };

  const handleSpin = async () => {
    setSpinning(true);
    setError("");
    setScale(1.2);
    setTimeout(async () => {
      setScale(1);
      const data = await fetchEvents();
      if (!data || !data.length) {
        setError("No events found. Try again in a moment.");
        setSpinning(false);
        return;
      }
      const chosenEvent = data[Math.floor(Math.random() * data.length)];
      const users = await fetchUsers();
      const shuffled = users.sort(() => 0.5 - Math.random());
      const residents = shuffled.slice(0, 4);
      setSuggestion({ event: chosenEvent, residents });
      if (onResult) onResult({ ...chosenEvent, crew_full: residents });
      setSpinning(false);
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>Crewlette</div>
      <div style={styles.center}>
        <div style={{ ...styles.shazamButton, transform: `scale(${scale})`, transition: "transform 1.5s cubic-bezier(.68,-0.55,.27,1.55)" }}>
          <button
            style={{ ...styles.buttonText, background: "none", border: "none", width: "100%", height: "100%", cursor: "pointer" }}
            onClick={handleSpin}
            disabled={spinning}
          >
            🎲 Spin the Roulette
          </button>
        </div>
      </div>
      {suggestion && (
        <div style={{ marginTop: 32, background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px #eee" }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Suggested Event:</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{suggestion.event.name}</div>
          <div style={{ color: "#444", marginBottom: 12 }}>{suggestion.event.description}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Residents:</div>
          {suggestion.residents.map((user, idx) => (
            <div key={idx} style={{ fontSize: 15, color: "#333", marginBottom: 4 }}>
              👤 {user.username}
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginTop: 24 }}>{error}</div>}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 40,
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shazamButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    background: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 40px #3b82f6",
    margin: "0 auto",
  },
  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    padding: 0,
  },
};

export default SocialRoulette;
