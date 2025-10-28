import React, { useState } from "react";

function Login({ onLogin }) {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // 🟢 Duolingo-inspired palette (matches your other screens)
  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#1CB0F6",
    border: "#EEF2F7",
    danger: "#EA2B2B",
    shadow: "0 10px 24px rgba(0,0,0,0.06)",
    radius: 18,
  };

  const styles = {
    wrapper: {
      maxWidth: 420,
      margin: "56px auto",
      padding: 24,
      background: theme.bg,
      borderRadius: theme.radius,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
  fontFamily: "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    },
    card: {
      background: theme.card,
      padding: 22,
      borderRadius: theme.radius,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    title: {
      textAlign: "center",
      fontSize: 22,
      fontWeight: 900,
      color: theme.text,
      marginBottom: 6,
      letterSpacing: "-0.2px",
    },
    subtitle: {
      textAlign: "center",
      color: theme.textMuted,
      marginBottom: 16,
      fontSize: 14.5,
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      margin: "6px 0 10px",
      borderRadius: 14,
      border: `1px solid ${theme.border}`,
      outline: "none",
      background: "#FFFFFF",
      fontSize: 15,
    },
    button: {
      width: "100%",
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "#fff",
      fontWeight: 900,
      padding: "12px 14px",
      borderRadius: 14,
      border: "none",
      marginTop: 4,
      cursor: "pointer",
      boxShadow: "0 10px 22px rgba(88,204,2,0.28)",
      fontSize: 16,
      transition: "transform 0.12s ease, box-shadow 0.2s",
      disabled: { opacity: 0.6, cursor: "not-allowed" },
    },
    error: { color: theme.danger, textAlign: "center", marginTop: 12, fontWeight: 700 },
    brand: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 8,
      color: theme.primary,
      fontWeight: 900,
      fontSize: 18,
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.username) {
        onLogin(data.username);
      } else {
        setError(data?.error || `${isRegistering ? 'Registration' : 'Login'} failed. Try a different username.`);
      }
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <img 
            src="http://localhost:8000/static/assets/logo.png" 
            alt="Lemi Logo" 
            style={{ width: 60, height: 60, objectFit: 'contain' }}
          />
        </div>
  <h2 style={styles.title}>Welcome to Lemi</h2>
        <p style={styles.subtitle}>
          Lemi allows you to learn your target language with other cité residents
        </p>

        <input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={styles.input}
          autoComplete="username"
          aria-label="Username"
        />

        <button
          type="submit"
          disabled={loading || !userName.trim()}
          style={{
            ...styles.button,
            ...(loading || !userName.trim() ? styles.button.disabled : null),
          }}
        >
          {loading ? (isRegistering ? "Creating Account…" : "Logging in…") : (isRegistering ? "🟢 Create Account" : "🟢 Log In")}
        </button>

        {error ? <p style={styles.error}>{error}</p> : null}

        {/* Toggle between Login and Register */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <span style={{ color: theme.textMuted }}>
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            style={{
              background: 'none',
              border: 'none',
              color: theme.primary,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 14,
              padding: 0,
            }}
          >
            {isRegistering ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default Login;