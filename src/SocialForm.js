import React, { useState } from "react";

const types = [
  { id: "student", label: "🎓 Student" },
  { id: "cite", label: "🏠 Cité" },
  { id: "touristic", label: "🗼 Touristic" },
  { id: "popular", label: "🔥 Popular" },
  { id: "local", label: "🧃 Local" },
];
const categories = [
  { id: "music", label: "🎶 Music" },
  { id: "outdoor", label: "🌳 Outdoor" },
  { id: "games", label: "🎳 Games" },
  { id: "food", label: "🍽️ Food" },
  { id: "random", label: "🎲 Random" },
];
const languages = [
  { id: "Spanish", label: "🇪🇸 Spanish" },
  { id: "French", label: "🇫🇷 French" },
  { id: "English", label: "🇬🇧 English" },
  { id: "Italian", label: "🇮🇹 Italian" },
  { id: "Japanese", label: "🇯🇵 Japanese" },
];

function SocialForm({ onConfirm, onHome }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [timeOfDay, setTimeOfDay] = useState(null);
  const [budgetMax, setBudgetMax] = useState(10);
  const [type, setType] = useState(null);
  const [category, setCategory] = useState(null);
  const [language, setLanguage] = useState(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { date, timeOfDay, budgetMax, type, category, language };
    onConfirm && onConfirm(payload);
  };

  const styles = {
    form: {
      maxWidth: 520,
      margin: "36px auto",
      background: theme.bg,
      padding: 22,
      borderRadius: theme.radiusLg,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      fontFamily: "Inter, Roboto, Nunito Sans, Arial, sans-serif",
      transition: "box-shadow 0.3s, transform 0.2s",
    },
    title: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 6,
      color: theme.text,
      letterSpacing: "-0.2px",
      transition: "color 0.2s",
    },
    subtitle: { fontSize: 15, color: theme.textMuted, marginBottom: 16, transition: "color 0.2s" },
    inputs: {
      background: theme.card,
      padding: 18,
      borderRadius: theme.radius,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s",
    },
    label: { display: "block", fontSize: 13, fontWeight: 800, color: theme.textMuted, marginTop: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px", transition: "color 0.2s" },
    input: {
      width: "100%",
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: 10,
      margin: "2px 0 8px",
      outline: "none",
      background: "#FFFFFF",
      fontSize: 14.5,
      transition: "box-shadow 0.2s, border-color 0.2s",
    },
    inputFocus: {
      boxShadow: "0 0 0 2px #58CC02",
      borderColor: theme.primary,
    },
    pillRow: { display: "flex", flexWrap: "wrap", gap: 8, margin: "6px 0 10px" },
    pill: {
      border: `1px solid ${theme.border}`,
      borderRadius: 999,
      padding: "8px 12px",
      background: "#FFFFFF",
      cursor: "pointer",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s, background 0.2s, transform 0.15s",
    },
    pillSelected: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      borderColor: "transparent",
      boxShadow: "0 6px 14px rgba(88,204,2,0.22)",
      transform: "scale(1.08)",
    },
    pillText: { fontSize: 14, color: theme.text, fontWeight: 600, transition: "color 0.2s" },
    pillTextSelected: { color: "#fff", fontWeight: 900, transition: "color 0.2s" },
    btn: {
      width: "100%",
      padding: "14px",
      borderRadius: 14,
      border: "none",
      color: "white",
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 16,
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      boxShadow: "0 10px 22px rgba(88,204,2,0.28)",
      marginTop: 16,
      transition: "box-shadow 0.2s, transform 0.15s, background 0.2s",
    },
    btnAccent: {
      background: theme.accent,
      boxShadow: theme.shadow,
      marginTop: 8,
      transition: "box-shadow 0.2s, transform 0.15s, background 0.2s",
    },
  };



  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>🎲 Spin to Practice Languages</h2>
      <p style={styles.subtitle}>
        Pick a language you want to practice, your budget, and the kind of event you like — we’ll find a crew ready to chat and learn together.
      </p>

      <div style={styles.inputs}>
        <label style={styles.label}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
          onFocus={e => e.target.style.boxShadow = styles.inputFocus.boxShadow}
          onBlur={e => e.target.style.boxShadow = "none"}
        />

        <label style={styles.label}>Time of Day</label>
        <div style={styles.pillRow}>
          {[
            { id: "morning", label: "🌅 Morning" },
            { id: "afternoon", label: "🌤️ Afternoon" },
            { id: "evening", label: "🌇 Evening" },
            { id: "night", label: "🌙 Night" },
            { id: "whole-day", label: "🗓️ Whole Day" },
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              style={{ ...styles.pill, ...(timeOfDay === t.id ? styles.pillSelected : {}) }}
              onClick={() => setTimeOfDay(timeOfDay === t.id ? null : t.id)}
              onMouseEnter={e => { if (timeOfDay !== t.id) e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { if (timeOfDay !== t.id) e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={{ ...(timeOfDay === t.id ? styles.pillTextSelected : styles.pillText) }}>{t.label}</span>
            </button>
          ))}
        </div>

        <label style={styles.label}>Max Budget (€)</label>
        <div style={{ marginBottom: 8, color: theme.textMuted, fontSize: 13 }}>
          Current: <b style={{ color: theme.text }}>€{budgetMax}</b>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={budgetMax}
          onChange={(e) => setBudgetMax(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        <label style={styles.label}>Pick a Type</label>
        <div style={styles.pillRow}>
          {types.map((t) => (
            <button
              type="button"
              key={t.id}
              style={{ ...styles.pill, ...(type === t.id ? styles.pillSelected : {}) }}
              onClick={() => setType(type === t.id ? null : t.id)}
              onMouseEnter={e => { if (type !== t.id) e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { if (type !== t.id) e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={{ ...(type === t.id ? styles.pillTextSelected : styles.pillText) }}>{t.label}</span>
            </button>
          ))}
        </div>

        <label style={styles.label}>Choose a Category</label>
        <div style={styles.pillRow}>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              style={{ ...styles.pill, ...(category === c.id ? styles.pillSelected : {}) }}
              onClick={() => setCategory(category === c.id ? null : c.id)}
              onMouseEnter={e => { if (category !== c.id) e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { if (category !== c.id) e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={{ ...(category === c.id ? styles.pillTextSelected : styles.pillText) }}>{c.label}</span>
            </button>
          ))}
        </div>

        <label style={styles.label}>Language you want to practice</label>
        <div style={styles.pillRow}>
          {languages.map((lang) => (
            <button
              type="button"
              key={lang.id}
              style={{ ...styles.pill, ...(language === lang.id ? styles.pillSelected : {}) }}
              onClick={() => setLanguage(language === lang.id ? null : lang.id)}
              onMouseEnter={e => { if (language !== lang.id) e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { if (language !== lang.id) e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={{ ...(language === lang.id ? styles.pillTextSelected : styles.pillText) }}>{lang.label}</span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          style={styles.btn}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Confirm
        </button>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnAccent }}
          onClick={onHome}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Go to Homepage
        </button>
      </div>
    </form>
  );
}

export default SocialForm;