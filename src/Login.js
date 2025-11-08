import React, { useEffect, useState } from "react";
import * as api from "./api";

// Avatar styles and emoji options
const AVATAR_STYLES = ['bottts','micah','adventurer','pixel-art','avataaars','lorelei','notionists','personas','thumbs','fun-emoji'];
const EMOJI_OPTIONS = ['😊','😎','🤓','😃','🥳','🌟','🚀','💪','❤️','🎉','🔥','✨'];
const INTERESTS_OPTIONS = ['Sports','Music','Art','Movies','Books','Gaming','Travel','Food','Technology','Fashion','Photography','Fitness'];

const hashString = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

function Login({ onLogin, onRegistered }) {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration-only fields (comprehensive profile)
  const [avatarTab, setAvatarTab] = useState("emoji");
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState("avataaars");
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [major, setMajor] = useState("");
  const [currentCountry, setCurrentCountry] = useState("France");
  const [currentCity, setCurrentCity] = useState("Paris");
  const [houseInCite, setHouseInCite] = useState("");
  const [homeCountries, setHomeCountries] = useState([]);
  const [countryInput, setCountryInput] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState("");
  const [languageLevels, setLanguageLevels] = useState({});
  const [interests, setInterests] = useState([]);
  
  // New questions
  const [citeStatus, setCiteStatus] = useState(""); // yes/alumni/visit/no
  const [cityReasons, setCityReasons] = useState([]); // array of reasons

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
      // Mobile responsive
      "@media (maxWidth: 600px)": {
        margin: "16px",
        padding: 16,
        borderRadius: 12,
      },
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
      fontSize: window.innerWidth <= 600 ? 18 : 22,
      fontWeight: 900,
      color: theme.text,
      marginBottom: 6,
      letterSpacing: "-0.2px",
    },
    subtitle: {
      textAlign: "center",
      color: theme.textMuted,
      marginBottom: 16,
      fontSize: window.innerWidth <= 600 ? 13 : 14.5,
    },
    input: {
      width: "100%",
      padding: window.innerWidth <= 600 ? "10px 12px" : "12px 14px",
      margin: "6px 0 10px",
      borderRadius: 14,
      border: `1px solid ${theme.border}`,
      outline: "none",
      background: "#FFFFFF",
      fontSize: window.innerWidth <= 600 ? 14 : 15,
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "#fff",
      fontWeight: 900,
      padding: window.innerWidth <= 600 ? "10px 12px" : "12px 14px",
      borderRadius: 14,
      border: "none",
      marginTop: 4,
      cursor: "pointer",
      boxShadow: "0 10px 22px rgba(88,204,2,0.28)",
      fontSize: window.innerWidth <= 600 ? 15 : 16,
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
  const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    margin: "6px 0 10px",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    outline: "none",
    background: "#FFFFFF",
    fontSize: 15,
    boxSizing: "border-box",
  };

  const handleAddCountry = () => {
    if (countryInput.trim() && !homeCountries.includes(countryInput.trim())) {
      setHomeCountries([...homeCountries, countryInput.trim()]);
      setCountryInput("");
    }
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    if (isRegistering) {
      // Client-side validation for registration
      if (userName.trim().length < 3) {
        setError("Username should be at least 3 characters.");
        return;
      }
      if (password.length < 3) {
        setError("Password should be at least 3 characters.");
        return;
      }
      if (!firstName.trim()) {
        setError("Please enter your first name.");
        return;
      }
      if (!citeStatus) {
        setError("Please answer if you live on Cité campus.");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";
      const endpoint = isRegistering ? "/register" : "/login";
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName.trim(), password: password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.username) {
          // If this was a new registration, persist the full profile locally
          if (isRegistering) {
            try {
              // Determine avatar spec
              let avatarSpec;
              if (avatarTab === "emoji") {
                avatarSpec = { provider: "emoji", emoji: selectedEmoji };
              } else {
                const seed = userName.trim();
                avatarSpec = { provider: "dicebear", style: selectedAvatarStyle, seed };
              }
              
              const profile = {
                name: userName.trim(),
                firstName: firstName.trim(),
                age: age.trim(),
                university: university.trim(),
                degree: degree.trim(),
                major: major.trim(),
                emoji: selectedEmoji,
                avatar: avatarSpec,
                country: currentCountry,
                homeCountries: homeCountries,
                city: currentCity,
                house: houseInCite.trim(),
                desc: bio.trim(),
                languages: languages,
                languageLevels: languageLevels,
                bio: bio.trim(),
                interests: interests,
                citeStatus: citeStatus,
                cityReasons: cityReasons,
              };
              localStorage.setItem(`userProfile_${data.username}`, JSON.stringify(profile));
              
              // Save to server
              try {
                await api.saveUserProfile(data.username, profile);
              } catch (e) {
                console.warn("Could not save profile to server:", e);
              }
              
              // Let the app know we just registered
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
          setError(isRegistering ? "Registration failed. Please try a different username." : "User not found. Only existing users can log in.");
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
    <div style={{ maxWidth: isRegistering ? 600 : 420, margin: "32px auto", padding: 24, background: theme.bg, borderRadius: theme.radius, border: `1px solid ${theme.border}`, boxShadow: theme.shadow, fontFamily: "Inter, Roboto, sans-serif", maxHeight: isRegistering ? '90vh' : 'auto', overflowY: isRegistering ? 'auto' : 'visible' }}>
      <form onSubmit={handleLogin} autoComplete="off">
        <div style={{ background: theme.card, padding: 22, borderRadius: theme.radius, border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, color: theme.primary, fontWeight: 900, fontSize: 18 }}>
            <img 
              src={`${API_URL}/static/assets/logo.png`} 
              alt="Lemi Logo" 
              style={{ width: 60, height: 60, objectFit: 'contain' }}
            />
          </div>
          <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, color: theme.text, marginBottom: 6 }}>
            {isRegistering ? "Create Your Profile" : "Welcome to Lemi"}
          </h2>
          <p style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 16, fontSize: 14.5 }}>
            Lemi helps international students, Erasmus students, and Cité residents organize hangouts, explore the city, and make friends along the way.
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
            {/* Avatar Selection */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 8 }}>Profile Avatar</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setAvatarTab("emoji")}
                  style={{ flex: 1, padding: '8px 12px', border: `2px solid ${avatarTab === "emoji" ? theme.primary : theme.border}`, borderRadius: 10, background: avatarTab === "emoji" ? theme.primary : 'white', color: avatarTab === "emoji" ? 'white' : theme.text, fontWeight: 700, cursor: 'pointer' }}
                >Emoji</button>
                <button
                  type="button"
                  onClick={() => setAvatarTab("avatars")}
                  style={{ flex: 1, padding: '8px 12px', border: `2px solid ${avatarTab === "avatars" ? theme.primary : theme.border}`, borderRadius: 10, background: avatarTab === "avatars" ? theme.primary : 'white', color: avatarTab === "avatars" ? 'white' : theme.text, fontWeight: 700, cursor: 'pointer' }}
                >Avatars</button>
              </div>
              
              {avatarTab === "emoji" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      style={{ padding: 12, fontSize: 28, border: `3px solid ${selectedEmoji === emoji ? theme.primary : theme.border}`, borderRadius: 12, background: 'white', cursor: 'pointer' }}
                    >{emoji}</button>
                  ))}
                </div>
              )}
              
              {avatarTab === "avatars" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {AVATAR_STYLES.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedAvatarStyle(style)}
                      style={{ padding: 8, border: `3px solid ${selectedAvatarStyle === style ? theme.primary : theme.border}`, borderRadius: 12, background: 'white', cursor: 'pointer', overflow: 'hidden' }}
                    >
                      <img src={`https://api.dicebear.com/6.x/${style}/svg?seed=${userName || 'preview'}`} alt={style} style={{ width: '100%', height: 'auto' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
            <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="University" value={university} onChange={(e) => setUniversity(e.target.value)} style={inputStyle} />
            
            <select value={degree} onChange={(e) => setDegree(e.target.value)} style={inputStyle}>
              <option value="">Degree</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
              <option value="Other">Other</option>
            </select>
            
            <input type="text" placeholder="Major" value={major} onChange={(e) => setMajor(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Current Country" value={currentCountry} onChange={(e) => setCurrentCountry(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Current City" value={currentCity} onChange={(e) => setCurrentCity(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="House in Cité" value={houseInCite} onChange={(e) => setHouseInCite(e.target.value)} style={inputStyle} />

            {/* Home Countries */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Home Countries</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Type a country and press Enter"
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCountry(); } }}
                  style={{ ...inputStyle, margin: 0 }}
                />
                <button type="button" onClick={handleAddCountry} style={{ padding: '8px 16px', background: theme.primary, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {homeCountries.map(country => (
                  <div key={country} style={{ padding: '6px 12px', background: theme.primary, color: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    {country}
                    <button type="button" onClick={() => setHomeCountries(homeCountries.filter(c => c !== country))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <textarea rows={3} placeholder="Short Bio" value={bio} onChange={(e) => setBio(e.target.value)} style={{ ...inputStyle, resize: 'vertical', marginTop: 12 }} />

            {/* Languages */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Languages You Speak</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Type a language and press Enter"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLanguage(); } }}
                  style={{ ...inputStyle, margin: 0 }}
                />
                <button type="button" onClick={handleAddLanguage} style={{ padding: '8px 16px', background: theme.primary, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {languages.map(lang => (
                  <div key={lang} style={{ padding: '6px 12px', background: theme.primary, color: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    {lang}
                    <button type="button" onClick={() => setLanguages(languages.filter(l => l !== lang))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Proficiency Levels */}
            {languages.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Language Proficiency Levels</label>
                {languages.map(lang => (
                  <div key={lang} style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 13, color: theme.textMuted }}>{lang}:</label>
                    <select
                      value={languageLevels[lang] || ""}
                      onChange={(e) => setLanguageLevels({ ...languageLevels, [lang]: e.target.value })}
                      style={{ ...inputStyle, margin: '4px 0' }}
                    >
                      <option value="">Select level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Native">Native</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Interests */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Interests</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                {INTERESTS_OPTIONS.map(interest => {
                  const checked = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setInterests(checked ? interests.filter(i => i !== interest) : [...interests, interest])}
                      style={{ padding: '8px 12px', border: `2px solid ${checked ? theme.primary : theme.border}`, borderRadius: 10, background: checked ? theme.primary : 'white', color: checked ? 'white' : theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >{interest}</button>
                  );
                })}
              </div>
            </div>

            {/* New Question: Cité Status */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Do you live on Cité campus (Cité Internationale Universitaire)?</label>
              <div style={{ marginTop: 8 }}>
                {[
                  { value: "yes", label: "🔘 Yes, I live on campus now" },
                  { value: "alumni", label: "🔘 I lived there before (alumni)" },
                  { value: "visit", label: "🔘 No, but I visit often" },
                  { value: "no", label: "🔘 No" }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCiteStatus(option.value)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', marginBottom: 8, border: `2px solid ${citeStatus === option.value ? theme.primary : theme.border}`, borderRadius: 10, background: citeStatus === option.value ? `${theme.primary}15` : 'white', color: theme.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >{option.label}</button>
                ))}
              </div>
            </div>

            {/* New Question: What brings you to the city */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>What brings you to the city?</label>
              <div style={{ marginTop: 8 }}>
                {[
                  "Erasmus / Exchange student",
                  "International degree student",
                  "Working / Internship",
                  "Visiting / Short stay",
                  "Local resident",
                  "Other"
                ].map(reason => {
                  const checked = cityReasons.includes(reason);
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setCityReasons(checked ? cityReasons.filter(r => r !== reason) : [...cityReasons, reason])}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', marginBottom: 8, border: `2px solid ${checked ? theme.primary : theme.border}`, borderRadius: 10, background: checked ? `${theme.primary}15` : 'white', color: theme.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {checked ? '☑' : '▢'} {reason}
                    </button>
                  );
                })}
              </div>
            </div>
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
    </div>
  );
}

export default Login;