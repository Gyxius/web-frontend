import React, { useState } from "react";

function Login({ onLogin }) {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://192.168.1.25:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName }),
      });
      const data = await response.json();
      if (response.ok && data.username) {
        onLogin(data.username);
      } else {
        setError("Login failed. Try a different username.");
      }
    } catch (err) {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: 320, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #eee" }}>
      <h2 style={{ color: "#3b82f6", textAlign: "center" }}>Welcome to Lemi</h2>
      <p style={{ textAlign: "center", color: "#555" }}>Log in to join events while learning a new language and meeting new people</p>
      <input
        type="text"
        placeholder="username"
        value={userName}
        onChange={e => setUserName(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "12px 0", borderRadius: 8, border: "1px solid #ccc" }}
        autoComplete="username"
      />
      <button type="submit" disabled={loading} style={{ width: "100%", background: "#3b82f6", color: "#fff", fontWeight: 600, padding: 12, borderRadius: 8, border: "none", marginTop: 4 }}>
        {loading ? "Logging in..." : "🚀 Log In"}
      </button>
      {error && <p style={{ color: "#ef4444", textAlign: "center", marginTop: 12 }}>{error}</p>}
    </form>
  );
}

export default Login;
