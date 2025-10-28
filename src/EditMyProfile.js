import React, { useState } from "react";
import { FaArrowLeft, FaSave } from "react-icons/fa";

function EditMyProfile({ userName, onBack }) {
  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#1CB0F6",
    border: "#E5E7EB",
    radius: 16,
    radiusLg: 20,
    shadow: "0 4px 14px rgba(0,0,0,0.08)",
  };

  // Load user data from localStorage or use defaults
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(`userProfile_${userName}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: userName,
      firstName: "",
      age: "",
      university: "",
      degree: "",
      emoji: "😊",
      country: "🇫🇷",
      countriesFrom: ["France"],
      city: "Paris",
      house: "",
      desc: "Language enthusiast",
      languages: ["English", "French"],
      languageLevels: { "English": "Fluent", "French": "Native" },
      bio: "",
      interests: [],
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const [successMessage, setSuccessMessage] = useState("");

  const availableLanguages = [
    "English", "French", "Spanish", "German", "Italian", "Portuguese",
    "Dutch", "Russian", "Chinese", "Japanese", "Korean", "Arabic",
    "Hindi", "Turkish", "Polish", "Swedish", "Norwegian", "Danish"
  ];

  const availableCountries = [
    "France", "United Kingdom", "United States", "Spain", "Germany", "Italy",
    "Portugal", "Netherlands", "Russia", "China", "Japan", "South Korea",
    "Saudi Arabia", "India", "Turkey", "Poland", "Sweden", "Norway",
    "Denmark", "Madagascar", "Morocco", "Algeria", "Tunisia", "Senegal"
  ];

  const availableHouses = [
    "Fondation Deutsch de la Meurthe",
    "Fondation des États-Unis",
    "Maison de l'Argentine",
    "Maison du Brésil",
    "Maison du Cambodge",
    "Maison du Canada",
    "Maison de la Chine",
    "Collège d'Espagne",
    "Maison de la Grèce",
    "Maison de l'Inde",
    "Maison Internationale",
    "Maison du Japon",
    "Maison du Liban",
    "Maison du Maroc",
    "Maison du Mexique",
    "Maison de la Norvège",
    "Maison des Provinces de France",
    "Maison de la Tunisie",
    "Other"
  ];

  const languageLevels = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"];

  const availableInterests = [
    "Sports", "Music", "Art", "Movies", "Books", "Gaming",
    "Travel", "Food", "Technology", "Fashion", "Photography", "Fitness"
  ];

  const countryEmojis = [
    "🇫🇷", "🇬🇧", "🇺🇸", "🇪🇸", "🇩🇪", "🇮🇹", "🇵🇹", "🇳🇱",
    "🇷🇺", "🇨🇳", "🇯🇵", "🇰🇷", "🇸🇦", "🇮🇳", "🇹🇷", "🇵🇱", "🇲🇬"
  ];

  const handleSave = () => {
    setProfile(editedProfile);
    localStorage.setItem(`userProfile_${userName}`, JSON.stringify(editedProfile));
    setIsEditing(false);
    setSuccessMessage("✅ Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleLanguageToggle = (lang) => {
    const updated = editedProfile.languages.includes(lang)
      ? editedProfile.languages.filter(l => l !== lang)
      : [...editedProfile.languages, lang];
    
    // Initialize language level if not exists
    const updatedLevels = { ...(editedProfile.languageLevels || {}) };
    if (!editedProfile.languages.includes(lang) && !updatedLevels[lang]) {
      updatedLevels[lang] = "Beginner";
    }
    // Remove level if language unchecked
    if (editedProfile.languages.includes(lang)) {
      delete updatedLevels[lang];
    }
    
    setEditedProfile({ ...editedProfile, languages: updated, languageLevels: updatedLevels });
  };

  const handleLanguageLevelChange = (lang, level) => {
    const updatedLevels = { ...(editedProfile.languageLevels || {}) };
    updatedLevels[lang] = level;
    setEditedProfile({ ...editedProfile, languageLevels: updatedLevels });
  };

  const handleCountryToggle = (country) => {
    const countriesFrom = editedProfile.countriesFrom || [];
    const updated = countriesFrom.includes(country)
      ? countriesFrom.filter(c => c !== country)
      : [...countriesFrom, country];
    setEditedProfile({ ...editedProfile, countriesFrom: updated });
  };

  const handleInterestToggle = (interest) => {
    const updated = editedProfile.interests.includes(interest)
      ? editedProfile.interests.filter(i => i !== interest)
      : [...editedProfile.interests, interest];
    setEditedProfile({ ...editedProfile, interests: updated });
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: theme.bg,
      padding: "20px",
      fontFamily: "Inter, Roboto, sans-serif",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      maxWidth: 800,
      margin: "0 auto 24px auto",
    },
    backButton: {
      background: "transparent",
      border: "none",
      fontSize: 24,
      color: theme.primary,
      cursor: "pointer",
      padding: 8,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
      maxWidth: 800,
      margin: "0 auto 20px auto",
    },
    title: {
      fontSize: 28,
      fontWeight: 900,
      marginBottom: 8,
      color: theme.text,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: 700,
      color: theme.textMuted,
      marginBottom: 8,
      display: "block",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: 12,
      borderRadius: 12,
      border: `2px solid ${theme.border}`,
      fontSize: 15,
      fontFamily: "inherit",
      outline: "none",
      transition: "border 0.2s",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: 12,
      borderRadius: 12,
      border: `2px solid ${theme.border}`,
      fontSize: 15,
      fontFamily: "inherit",
      outline: "none",
      minHeight: 100,
      resize: "vertical",
      boxSizing: "border-box",
    },
    value: {
      fontSize: 16,
      color: theme.text,
      padding: "8px 0",
    },
    button: {
      padding: "12px 24px",
      borderRadius: 12,
      border: "none",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      transition: "transform 0.1s, box-shadow 0.2s",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    },
    primaryButton: {
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
      color: "white",
      boxShadow: "0 4px 12px rgba(88,204,2,0.3)",
    },
    secondaryButton: {
      background: theme.card,
      color: theme.textMuted,
      border: `2px solid ${theme.border}`,
    },
    buttonGroup: {
      display: "flex",
      gap: 12,
      marginTop: 20,
    },
    chipContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    chip: (isSelected) => ({
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 14,
      fontWeight: 600,
      cursor: isEditing ? "pointer" : "default",
      border: `2px solid ${isSelected ? theme.primary : theme.border}`,
      background: isSelected ? theme.primary : theme.card,
      color: isSelected ? "white" : theme.text,
      transition: "all 0.2s",
    }),
    emojiPicker: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 8,
    },
    emojiButton: (isSelected) => ({
      fontSize: 32,
      padding: 8,
      cursor: "pointer",
      border: `2px solid ${isSelected ? theme.primary : "transparent"}`,
      borderRadius: 8,
      background: isSelected ? theme.bg : "transparent",
    }),
    successMessage: {
      background: theme.primary,
      color: "white",
      padding: "12px 20px",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 16,
      maxWidth: 800,
      margin: "0 auto 16px auto",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          <FaArrowLeft />
        </button>
        <h1 style={styles.title}>My Profile</h1>
        {!isEditing && (
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {successMessage && (
        <div style={styles.successMessage}>{successMessage}</div>
      )}

      <div style={styles.card}>
        <div style={styles.section}>
          <label style={styles.label}>Profile Emoji</label>
          {isEditing ? (
            <div style={styles.emojiPicker}>
              {["😊", "😎", "🤓", "😃", "🥳", "🌟", "🚀", "💪"].map((emoji) => (
                <span
                  key={emoji}
                  style={styles.emojiButton(editedProfile.emoji === emoji)}
                  onClick={() => setEditedProfile({ ...editedProfile, emoji })}
                >
                  {emoji}
                </span>
              ))}
            </div>
          ) : (
            <div style={styles.value}>{profile.emoji}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Username</label>
          <div style={styles.value}>{profile.name}</div>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>First Name</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.firstName}
              onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
              placeholder="Enter your first name"
            />
          ) : (
            <div style={styles.value}>{profile.firstName || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Age</label>
          {isEditing ? (
            <input
              type="number"
              style={styles.input}
              value={editedProfile.age}
              onChange={(e) => setEditedProfile({ ...editedProfile, age: e.target.value })}
              placeholder="Enter your age"
              min="1"
              max="150"
            />
          ) : (
            <div style={styles.value}>{profile.age || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>University</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.university}
              onChange={(e) => setEditedProfile({ ...editedProfile, university: e.target.value })}
              placeholder="Enter your university"
            />
          ) : (
            <div style={styles.value}>{profile.university || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Degree</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.degree}
              onChange={(e) => setEditedProfile({ ...editedProfile, degree: e.target.value })}
              placeholder="Enter your degree (e.g., Bachelor's in Computer Science)"
            />
          ) : (
            <div style={styles.value}>{profile.degree || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Country Flag</label>
          {isEditing ? (
            <div style={styles.emojiPicker}>
              {countryEmojis.map((flag) => (
                <span
                  key={flag}
                  style={styles.emojiButton(editedProfile.country === flag)}
                  onClick={() => setEditedProfile({ ...editedProfile, country: flag })}
                >
                  {flag}
                </span>
              ))}
            </div>
          ) : (
            <div style={styles.value}>{profile.country}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>City</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.city}
              onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
              placeholder="Enter your city"
            />
          ) : (
            <div style={styles.value}>{profile.city}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>House in Cité</label>
          {isEditing ? (
            <select
              style={styles.input}
              value={editedProfile.house || ""}
              onChange={(e) => setEditedProfile({ ...editedProfile, house: e.target.value })}
            >
              <option value="">Select your house</option>
              {availableHouses.map(house => (
                <option key={house} value={house}>{house}</option>
              ))}
            </select>
          ) : (
            <div style={styles.value}>{profile.house || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Countries From</label>
          {isEditing ? (
            <div style={styles.chipContainer}>
              {availableCountries.map(country => (
                <span
                  key={country}
                  style={styles.chip((editedProfile.countriesFrom || []).includes(country))}
                  onClick={() => handleCountryToggle(country)}
                >
                  {country}
                </span>
              ))}
            </div>
          ) : (
            <div style={styles.chipContainer}>
              {(profile.countriesFrom || []).length > 0 ? (
                (profile.countriesFrom || []).map(country => (
                  <span key={country} style={styles.chip(true)}>{country}</span>
                ))
              ) : (
                <div style={styles.value}>No countries specified</div>
              )}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Short Description</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.desc}
              onChange={(e) => setEditedProfile({ ...editedProfile, desc: e.target.value })}
              placeholder="e.g., Language enthusiast, Coffee lover"
            />
          ) : (
            <div style={styles.value}>{profile.desc}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Bio</label>
          {isEditing ? (
            <textarea
              style={styles.textarea}
              value={editedProfile.bio}
              onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          ) : (
            <div style={styles.value}>{profile.bio || "No bio yet"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Languages You Speak</label>
          <div style={styles.chipContainer}>
            {isEditing ? (
              availableLanguages.map(lang => (
                <span
                  key={lang}
                  style={styles.chip(editedProfile.languages.includes(lang))}
                  onClick={() => handleLanguageToggle(lang)}
                >
                  {lang}
                </span>
              ))
            ) : (
              profile.languages.map(lang => (
                <span key={lang} style={styles.chip(true)}>{lang}</span>
              ))
            )}
          </div>
        </div>

        {/* Language Proficiency Levels */}
        {editedProfile.languages && editedProfile.languages.length > 0 && (
          <div style={styles.section}>
            <label style={styles.label}>Language Proficiency Levels</label>
            {editedProfile.languages.map(lang => (
              <div key={lang} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, minWidth: 120, color: theme.text }}>
                  {lang}:
                </div>
                {isEditing ? (
                  <select
                    style={{ ...styles.input, width: 'auto', flex: 1 }}
                    value={(editedProfile.languageLevels || {})[lang] || "Beginner"}
                    onChange={(e) => handleLanguageLevelChange(lang, e.target.value)}
                  >
                    {languageLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                ) : (
                  <div style={styles.value}>
                    {(profile.languageLevels || {})[lang] || "Not specified"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={styles.section}>
          <label style={styles.label}>Interests</label>
          <div style={styles.chipContainer}>
            {isEditing ? (
              availableInterests.map(interest => (
                <span
                  key={interest}
                  style={styles.chip(editedProfile.interests.includes(interest))}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </span>
              ))
            ) : (
              profile.interests.length > 0 ? (
                profile.interests.map(interest => (
                  <span key={interest} style={styles.chip(true)}>{interest}</span>
                ))
              ) : (
                <div style={styles.value}>No interests selected</div>
              )
            )}
          </div>
        </div>

        {isEditing && (
          <div style={styles.buttonGroup}>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleSave}
            >
              <FaSave /> Save Changes
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditMyProfile;
