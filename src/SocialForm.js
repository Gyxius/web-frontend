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

function SocialForm({ onConfirm }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [budget, setBudget] = useState(10);
  const [type, setType] = useState(null);
  const [category, setCategory] = useState(null);
  const [language, setLanguage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      date,
      start: startTime,
      end: endTime,
      budget,
      type,
      category,
      language,
    };
    if (onConfirm) onConfirm(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>🎲 Spin to Practice Languages</h2>
      <p style={styles.subtitle}>
        Pick a language you want to practice, your budget, and the kind of event you like, we’ll find a crew ready to chat and learn together.
      </p>
      <div style={styles.inputs}>
        <label>Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} />
        <label>Start Time:</label>
        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={styles.input} />
        <label>End Time:</label>
        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={styles.input} />
        <label>Your Budget (€):</label>
        <input type="number" min={0} value={budget} onChange={e => setBudget(Number(e.target.value))} style={styles.input} />
        <label style={{ marginTop: 12 }}>Pick a Type:</label>
        <div style={styles.pillRow}>
          {types.map(t => (
            <button type="button" key={t.id} style={{ ...styles.pill, ...(type === t.id ? styles.pillSelected : {}) }} onClick={() => setType(type === t.id ? null : t.id)}>
              <span style={{ ...(type === t.id ? styles.pillTextSelected : styles.pillText) }}>{t.label}</span>
            </button>
          ))}
        </div>
        <label style={{ marginTop: 12 }}>Choose a Category:</label>
        <div style={styles.pillRow}>
          {categories.map(c => (
            <button type="button" key={c.id} style={{ ...styles.pill, ...(category === c.id ? styles.pillSelected : {}) }} onClick={() => setCategory(category === c.id ? null : c.id)}>
              <span style={{ ...(category === c.id ? styles.pillTextSelected : styles.pillText) }}>{c.label}</span>
            </button>
          ))}
        </div>
        <label style={{ marginTop: 12 }}>Language you want to practice:</label>
        <div style={styles.pillRow}>
          {languages.map(lang => (
            <button type="button" key={lang.id} style={{ ...styles.pill, ...(language === lang.id ? styles.pillSelected : {}) }} onClick={() => setLanguage(language === lang.id ? null : lang.id)}>
              <span style={{ ...(language === lang.id ? styles.pillTextSelected : styles.pillText) }}>{lang.label}</span>
            </button>
          ))}
        </div>
        <button type="submit" style={{ ...styles.btn, backgroundColor: "#3b82f6", marginTop: 16 }}>Confirm</button>
      </div>
    </form>
  );
}

const styles = {
  form: { maxWidth: 400, margin: "40px auto", background: "#f0f4f8", padding: 20, borderRadius: 16, boxShadow: "0 2px 8px #eee" },
  title: { fontSize: 22, fontWeight: 600, marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#444", marginBottom: 16 },
  inputs: { background: "white", padding: 16, borderRadius: 12, marginBottom: 20 },
  input: { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: 8, margin: "4px 0" },
  pillRow: { display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0" },
  pill: { border: "1px solid #ccc", borderRadius: 16, padding: "6px 12px", background: "#f9f9f9", cursor: "pointer" },
  pillSelected: { background: "#3b82f6", borderColor: "#3b82f6" },
  pillText: { fontSize: 14, color: "#333" },
  pillTextSelected: { color: "white", fontWeight: 600 },
  btn: { width: "100%", padding: "12px", borderRadius: 8, border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 16 },
};

export default SocialForm;
