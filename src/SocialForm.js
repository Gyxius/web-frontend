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
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [budget, setBudget] = useState(10);
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
    const payload = { date, start: startTime, end: endTime, budget, type, category, language };
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
    },
    title: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 6,
      color: theme.text,
      letterSpacing: "-0.2px",
    },
    subtitle: { fontSize: 15, color: theme.textMuted, marginBottom: 16 },
    inputs: {
      background: theme.card,
      padding: 18,
      borderRadius: theme.radius,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    label: { display: "block", fontSize: 13, fontWeight: 800, color: theme.textMuted, marginTop: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" },
    input: {
      width: "100%",
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: 10,
      margin: "2px 0 8px",
      outline: "none",
      background: "#FFFFFF",
      fontSize: 14.5,
    },
    pillRow: { display: "flex", flexWrap: "wrap", gap: 8, margin: "6px 0 10px" },
    pill: {
      border: `1px solid ${theme.border}`,
      borderRadius: 999,
      padding: "8px 12px",
      background: "#FFFFFF",
      cursor: "pointer",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },
    pillSelected: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      borderColor: "transparent",
      boxShadow: "0 6px 14px rgba(88,204,2,0.22)",
    },
    pillText: { fontSize: 14, color: theme.text, fontWeight: 600 },
    pillTextSelected: { color: "#fff", fontWeight: 900 },
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
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />

        <label style={styles.label}>Start Time</label>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.input} />

        <label style={styles.label}>End Time</label>
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.input} />

        <label style={styles.label}>Your Budget (€)</label>
        <input
          type="number"
          min={0}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          style={styles.input}
        />

        <label style={styles.label}>Pick a Type</label>
        <div style={styles.pillRow}>
          {types.map((t) => (
            <button
              type="button"
              key={t.id}
              style={{ ...styles.pill, ...(type === t.id ? styles.pillSelected : {}) }}
              onClick={() => setType(type === t.id ? null : t.id)}
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
            >
              <span style={{ ...(language === lang.id ? styles.pillTextSelected : styles.pillText) }}>{lang.label}</span>
            </button>
          ))}
        </div>

        <button type="submit" style={styles.btn}>Confirm</button>
        <button type="button" style={{ ...styles.btn, background: theme.accent, boxShadow: theme.shadow, marginTop: 8 }} onClick={onHome}>
          Go to Homepage
        </button>
      </div>
    </form>
  );
}

export default SocialForm;