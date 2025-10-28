import React, { useState, useEffect } from "react";

// Step options
const locations = [
  { id: "Cité", label: "🏠 Cité" },
  { id: "Paris", label: "🗼 Paris" },
];

const categories = [
  { id: "food", label: "🍽️ Food" },
  { id: "drinks", label: "🍹 Drinks" },
  { id: "party", label: "🎉 Party" },
  { id: "random", label: "🎲 Random" },
  { id: "walk", label: "🚶 A Walk" },
];

const languages = [
  { id: "Spanish", label: "🇪🇸 Spanish" },
  { id: "French", label: "🇫🇷 French" },
  { id: "English", label: "🇬🇧 English" },
  { id: "Italian", label: "🇮🇹 Italian" },
  { id: "German", label: "🇩🇪 German" },
  { id: "Portuguese", label: "🇵🇹 Portuguese" },
  { id: "Japanese", label: "🇯🇵 Japanese" },
  { id: "Mandarin", label: "🇨🇳 Mandarin" },
  { id: "Korean", label: "🇰🇷 Korean" },
  { id: "Arabic", label: "🇸🇦 Arabic" },
  { id: "Russian", label: "🇷🇺 Russian" },
  { id: "Hindi", label: "🇮🇳 Hindi" },
  { id: "Dutch", label: "🇳🇱 Dutch" },
  { id: "Swedish", label: "🇸🇪 Swedish" },
  { id: "Polish", label: "🇵🇱 Polish" },
  { id: "Turkish", label: "🇹🇷 Turkish" },
  { id: "Greek", label: "🇬🇷 Greek" },
  { id: "Hebrew", label: "🇮🇱 Hebrew" },
];

const timePreferences = [
  { id: "this-week", label: "📅 This Week" },
  { id: "this-weekend", label: "🎉 This Weekend" },
  { id: "saturday", label: "📆 Saturday" },
  { id: "sunday", label: "📆 Sunday" },
  { id: "next-week", label: "📅 Next Week" },
  { id: "flexible", label: "🤷 Flexible" },
];

const timeOfDayOptions = [
  { id: "morning", label: "🌅 Morning" },
  { id: "afternoon", label: "🌤️ Afternoon" },
  { id: "evening", label: "🌇 Evening" },
  { id: "night", label: "🌙 Night" },
  { id: "whole-day", label: "🗓️ Whole Day" },
];

function SocialForm({ onConfirm, onHome, currentUserKey }) {
  const [step, setStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState("forward");
  const [timePreference, setTimePreference] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(null);
  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState(null);
  const [language, setLanguage] = useState(null);
  const [suggestedLanguages, setSuggestedLanguages] = useState([]);

  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#1CB0F6",
    border: "#EEF2F7",
    shadow: "0 6px 18px rgba(0,0,0,0.06)",
    radius: 16,
    radiusLg: 20,
  };

  // Only show Party for evening/night
  useEffect(() => {
    const partyAllowed = timeOfDay === "evening" || timeOfDay === "night";
    if (!partyAllowed && category === "party") setCategory(null);
  }, [timeOfDay, category]);

  // Load user profile to compute suggested languages (non-native)
  useEffect(() => {
    try {
      if (!currentUserKey) return;
      const raw = localStorage.getItem(`userProfile_${currentUserKey}`);
      if (!raw) return;
      const profile = JSON.parse(raw);
      const levels = profile?.languageLevels || {};
      const langs = Array.isArray(profile?.languages) ? profile.languages : Object.keys(levels);
      const nonNative = langs.filter((lng) => {
        const lvl = (levels?.[lng] || "").toString();
        return lvl && lvl.toLowerCase() !== "native"; // suggest anything that's not native
      });
      // Map to known list so labels/emojis match
      const normalized = nonNative
        .map(l => (typeof l === "string" ? l : (l?.id || l?.label)))
        .filter(Boolean)
        .map(name => {
          // find by id or label match ignoring case
          const found = languages.find(l => l.id.toLowerCase() === name.toLowerCase() || l.label.toLowerCase().includes(name.toLowerCase()));
          return found ? found.id : null;
        })
        .filter(Boolean);
      // Ensure uniqueness and limit to 8 suggestions
      const unique = Array.from(new Set(normalized)).slice(0, 8);
      setSuggestedLanguages(unique);
    } catch (e) {
      // ignore parsing errors
    }
  }, [currentUserKey]);

  const handleNext = () => {
    setSlideDirection("forward");
    setTimeout(() => setStep((s) => Math.min(s + 1, 4)), 50);
  };
  const handleBack = () => {
    setSlideDirection("backward");
    setTimeout(() => setStep((s) => Math.max(s - 1, 0)), 50);
  };
  const handleSubmit = () => {
    const payload = { timePreference, timeOfDay, location, category, language };
    if (onConfirm) onConfirm(payload);
  };

  const styles = {
    container: {
      maxWidth: 520,
      margin: "36px auto",
      background: theme.bg,
      padding: 22,
      borderRadius: theme.radiusLg,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      fontFamily:
        "Inter, Roboto, Nunito Sans, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
      minHeight: 400,
      position: "relative",
      overflow: "hidden",
    },
    stepContainer: {
      animation: `${slideDirection === "forward" ? "slideInRight" : "slideInLeft"} 0.4s ease-out`,
    },
    title: {
      fontSize: 26,
      fontWeight: 900,
      marginBottom: 12,
      color: theme.text,
      letterSpacing: "-0.5px",
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: theme.textMuted,
      marginBottom: 32,
      textAlign: "center",
      lineHeight: 1.5,
    },
    progressBar: {
      height: 6,
      background: theme.border,
      borderRadius: 999,
      marginBottom: 24,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      borderRadius: 999,
      transition: "width 0.4s ease-out",
    },
    pillRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 12,
      margin: "24px 0",
    },
    pill: {
      border: `2px solid ${theme.border}`,
      borderRadius: 16,
      padding: "16px 20px",
      background: "#FFFFFF",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      transition: "all 0.2s ease",
      textAlign: "center",
    },
    pillSelected: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      borderColor: theme.primary,
      boxShadow: "0 8px 20px rgba(88,204,2,0.3)",
      transform: "scale(1.05)",
    },
    pillText: {
      fontSize: 15,
      color: theme.text,
      fontWeight: 700,
      display: "block",
    },
    pillTextSelected: {
      color: "#fff",
      fontWeight: 900,
    },
    buttonRow: {
      display: "flex",
      gap: 12,
      marginTop: 32,
    },
    btn: {
      flex: 1,
      padding: "16px",
      borderRadius: 14,
      border: "none",
      color: "white",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 16,
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      boxShadow: "0 10px 22px rgba(88,204,2,0.28)",
      transition: "all 0.2s ease",
    },
    btnSecondary: {
      background: theme.card,
      color: theme.text,
      border: `2px solid ${theme.border}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    select: {
      width: "100%",
      padding: "16px",
      borderRadius: 14,
      border: `2px solid ${theme.border}`,
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      background: "#FFFFFF",
      outline: "none",
      appearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 16px center",
      backgroundSize: "20px",
      paddingRight: "50px",
    },
  };

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={styles.stepContainer} key="step0">
            <h2 style={styles.title}>When do you want to meet? 📅</h2>
            <p style={styles.subtitle}>Choose your preferred timeframe</p>
            <div style={styles.pillRow}>
              {timePreferences.map((pref) => (
                <button
                  key={pref.id}
                  style={{
                    ...styles.pill,
                    ...(timePreference === pref.id ? styles.pillSelected : {}),
                  }}
                  onClick={() => {
                    setTimePreference(pref.id);
                    handleNext();
                  }}
                >
                  <span
                    style={{
                      ...styles.pillText,
                      ...(timePreference === pref.id ? styles.pillTextSelected : {}),
                    }}
                  >
                    {pref.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div style={styles.stepContainer} key="step1">
            <h2 style={styles.title}>What time of day? ⏰</h2>
            <p style={styles.subtitle}>Select your preferred time</p>
            <div style={styles.pillRow}>
              {timeOfDayOptions.map((t) => (
                <button
                  key={t.id}
                  style={{
                    ...styles.pill,
                    ...(timeOfDay === t.id ? styles.pillSelected : {}),
                  }}
                  onClick={() => {
                    setTimeOfDay(t.id);
                    handleNext();
                  }}
                >
                  <span
                    style={{
                      ...styles.pillText,
                      ...(timeOfDay === t.id ? styles.pillTextSelected : {}),
                    }}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleBack}
            >
              ← Back
            </button>
          </div>
        );
      case 2:
        return (
          <div style={styles.stepContainer} key="step2">
            <h2 style={styles.title}>Pick a location 📍</h2>
            <p style={styles.subtitle}>Where would you like to meet?</p>
            <div style={styles.pillRow}>
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  style={{
                    ...styles.pill,
                    ...(location === loc.id ? styles.pillSelected : {}),
                  }}
                  onClick={() => {
                    setLocation(loc.id);
                    handleNext();
                  }}
                >
                  <span
                    style={{
                      ...styles.pillText,
                      ...(location === loc.id ? styles.pillTextSelected : {}),
                    }}
                  >
                    {loc.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleBack}
            >
              ← Back
            </button>
          </div>
        );
      case 3:
        return (
          <div style={styles.stepContainer} key="step3">
            <h2 style={styles.title}>Choose a category 🎯</h2>
            <p style={styles.subtitle}>What kind of activity?</p>
            <div style={styles.pillRow}>
              {categories
                .filter(
                  (c) => c.id !== "party" || timeOfDay === "evening" || timeOfDay === "night"
                )
                .map((c) => (
                  <button
                    key={c.id}
                    style={{
                      ...styles.pill,
                      ...(category === c.id ? styles.pillSelected : {}),
                    }}
                    onClick={() => {
                      setCategory(c.id);
                      handleNext();
                    }}
                  >
                    <span
                      style={{
                        ...styles.pillText,
                        ...(category === c.id ? styles.pillTextSelected : {}),
                      }}
                    >
                      {c.label}
                    </span>
                  </button>
                ))}
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleBack}
            >
              ← Back
            </button>
          </div>
        );
      case 4:
        return (
          <div style={styles.stepContainer} key="step4">
            <h2 style={styles.title}>Language to practice 🗣️</h2>
            <p style={styles.subtitle}>Which language do you want to practice?</p>
            {/* Suggested (non-native) languages */}
            {(suggestedLanguages?.length > 0 || true) && (
              <div style={{ margin: "16px 0 10px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 8 }}>Suggested for you</div>
                <div style={styles.pillRow}>
                  {/* Any language pill */}
                  <button
                    style={{
                      ...styles.pill,
                      ...(language === "any" ? styles.pillSelected : {}),
                    }}
                    onClick={() => setLanguage("any")}
                  >
                    <span style={{
                      ...styles.pillText,
                      ...(language === "any" ? styles.pillTextSelected : {}),
                    }}>
                      🌐 Any language
                    </span>
                  </button>
                  {(suggestedLanguages || []).map(id => {
                    const lang = languages.find(l => l.id === id);
                    if (!lang) return null;
                    const selected = language === id;
                    return (
                      <button key={id}
                        style={{ ...styles.pill, ...(selected ? styles.pillSelected : {}) }}
                        onClick={() => setLanguage(id)}
                      >
                        <span style={{ ...styles.pillText, ...(selected ? styles.pillTextSelected : {}) }}>
                          {lang.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ fontSize: 14, color: "#9CA3AF", textAlign: "center", margin: "10px 0" }}>or browse all</div>
            <select
              value={language || ""}
              onChange={(e) => setLanguage(e.target.value || null)}
              style={styles.select}
            >
              <option value="">Select a language...</option>
              <option value="any">🌐 Any language</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
            <div style={styles.buttonRow}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={handleBack}
              >
                ← Back
              </button>
              <button style={styles.btn} onClick={handleSubmit} disabled={!language}>
                Confirm ✓
              </button>
            </div>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary, marginTop: 12 }}
              onClick={onHome}
            >
              Go to Homepage
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {renderStep()}
    </div>
  );
}

export default SocialForm;
