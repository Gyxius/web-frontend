import React, { useEffect, useState } from "react";

function Login({ onLogin, onRegistered }) {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  // Registration-only fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [about, setAbout] = useState("");
  const [languages, setLanguages] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  // Auto-fill invite code from URL like ?invite=CODE (also supports ?code= or ?invitation=)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("invite") || params.get("code") || params.get("invitation");
      if (code) {
        setInviteCode(code);
        setIsRegistering(true);
      }
    } catch {}
  }, []);

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
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    if (isRegistering) {
      // minimal client-side validation for a "normal" sign-up flow
      if (userName.trim().length < 3) {
        setError("Username should be at least 3 characters.");
        return;
      }
      if (password.length < 3) {
        setError("Password should be at least 3 characters.");
        return;
      }
      // Invitation‑only gate
      try {
        const raw = localStorage.getItem('lemi_invites');
        const invites = raw ? JSON.parse(raw) : [];
        const code = inviteCode.trim();
        if (!code) {
          setError("Lemi is invitation‑only. Please enter your invite code.");
          return;
        }
        const found = Array.isArray(invites) ? invites.find(i => (i.code || '').toLowerCase() === code.toLowerCase()) : null;
        if (!found) {
          setError("Invalid invite code. Ask an admin for a new invitation.");
          return;
        }
        if (found.usedBy) {
          setError("This invite code has already been used.");
          return;
        }
        if (found.assignedTo && found.assignedTo.toLowerCase() !== userName.trim().toLowerCase()) {
          setError(`This invite code is assigned to ${found.assignedTo}.`);
          return;
        }
      } catch {
        setError("Could not validate invite code. Try again or contact admin.");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const endpoint = isRegistering ? "/register" : "/login";
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send password for both login and register; include inviteCode for future server-side enforcement
        body: JSON.stringify({ username: userName.trim(), password: password, inviteCode: inviteCode.trim() || undefined }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.username) {
          // If this was a new registration, persist a starter profile locally so the app feels complete
          if (isRegistering) {
            try {
              const profile = {
                name: fullName?.trim() || data.username,
                email: email?.trim() || undefined,
                city: city?.trim() || undefined,
                desc: about?.trim() || undefined,
                languages: Array.isArray(languages) ? languages : [],
                languageLevels: {},
                emoji: "🙂",
                interests: [],
                countriesFrom: [],
              };
              localStorage.setItem(`userProfile_${data.username}`, JSON.stringify(profile));
              // Mark invite code as used
              try {
                const raw = localStorage.getItem('lemi_invites');
                const invites = raw ? JSON.parse(raw) : [];
                const updated = Array.isArray(invites)
                  ? invites.map(i => (i.code && inviteCode && i.code.toLowerCase() === inviteCode.trim().toLowerCase())
                      ? { ...i, usedBy: data.username, usedAt: Date.now() }
                      : i)
                  : invites;
                localStorage.setItem('lemi_invites', JSON.stringify(updated));
              } catch {}
              // Let the app know we just registered so it can open the full profile setup
              if (typeof onRegistered === 'function') {
                onRegistered(data.username);
              }
            } catch {}
          }
          onLogin(data.username);
        }
      } else {
        const data = await response.json();
        if (response.status === 404) {
          setError(isRegistering ? "Registration failed. Please try a different username." : "User not found. Only existing users (Mitsu, Zine, Admin) can log in.");
        } else if (response.status === 400) {
          setError("Username already exists. Please log in instead.");
        } else {
          setError(data?.detail || `${isRegistering ? 'Registration' : 'Login'} failed. Try a different username.`);
        }
      }
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={styles.wrapper} autoComplete="off">
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

        {/* Auth form */}
        <input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={styles.input}
          autoComplete={isRegistering ? "off" : "username"}
          aria-label="Username"
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete={isRegistering ? "new-password" : "current-password"}
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontWeight: 700 }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >{showPassword ? 'Hide' : 'Show'}</button>
        </div>

        {isRegistering && (
          <>
            <input
              type="text"
              placeholder="Invitation code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              style={styles.input}
              aria-label="Invitation code"
            />
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
              aria-label="Full name"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              aria-label="Email"
            />
            <input
              type="text"
              placeholder="City (optional)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={styles.input}
              aria-label="City"
            />
            <div style={{ margin: '6px 0 10px' }}>
              <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 6 }}>Languages you speak</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['French','English','Spanish','Arabic','German','Italian','Portuguese','Japanese'].map(lang => {
                  const checked = languages.includes(lang);
                  return (
                    <label key={lang} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 10px', borderRadius: 999, border: `1px solid ${checked ? theme.primaryDark : theme.border}`,
                      background: checked ? `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` : '#fff',
                      color: checked ? '#fff' : theme.text,
                      fontSize: 13, cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setLanguages(prev => e.target.checked ? [...prev, lang] : prev.filter(l => l !== lang));
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      {lang}
                    </label>
                  );
                })}
              </div>
            </div>
            <textarea
              rows={3}
              placeholder="About you (optional)"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              style={{ ...styles.input, resize: 'vertical' }}
              aria-label="About you"
            />
          </>
        )}

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
              const goingToRegister = !isRegistering;
              setIsRegistering(goingToRegister);
              setError("");
              // Clear sensitive fields when switching modes to avoid confusing autofill
              setPassword("");
              if (goingToRegister) {
                setUserName("");
              }
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