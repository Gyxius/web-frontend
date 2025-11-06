import React, { useEffect, useState, useCallback } from "react";
import * as api from "./api";
import { FaArrowLeft, FaSave } from "react-icons/fa";

function EditMyProfile({ userName, onBack, onSignOut, startEditing = false }) {
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

  // Helper: deterministic avatar spec generator for new users
  const AVATAR_STYLES = ['bottts','micah','adventurer','pixel-art','avataaars'];
  const hashString = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };
  const generateDefaultAvatarSpec = useCallback((name) => {
    const seed = (name || 'guest').toString();
    const idx = hashString(seed) % AVATAR_STYLES.length;
    return { provider: 'dicebear', style: AVATAR_STYLES[idx], seed };
  }, [AVATAR_STYLES]);

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
      major: "",
      emoji: "😊",
      // For new users, generate a quick deterministic avatar (can be changed later)
      avatar: generateDefaultAvatarSpec(userName),
      country: "🇫🇷",
  homeCountries: ["France"],
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
  const [avatarTab, setAvatarTab] = useState("emoji");
  const [successMessage, setSuccessMessage] = useState("");
  // If requested, open in editing mode on mount (used for post-signup flow)
  useEffect(() => {
    if (startEditing) setIsEditing(true);
  }, [startEditing]);
  // Single reusable invite code for this user
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState("");

  const loadOrCreateInviteCode = useCallback(async () => {
    setInviteLoading(true);
    setInviteError("");
    try {
      // Try to load existing code
      const res = await api.getUserInviteCode(userName);
      let code = res?.invite_code || null;
      // If none exists yet, create one so it's always visible
      if (!code) {
        const created = await api.createOrRotateInviteCode(userName);
        code = created?.invite_code || null;
      }
      setInviteCode(code);
    } catch (e) {
      setInviteError("Could not load invite code. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }, [userName, generateDefaultAvatarSpec]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) {
        await loadOrCreateInviteCode();
      }
    })();
    return () => { cancelled = true; };
  }, [loadOrCreateInviteCode]);

  // Try loading server-saved profile on mount (and cache locally)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const serverProfile = await api.getUserProfile(userName);
        if (!cancelled && serverProfile) {
          console.log("📥 Loaded profile from server:", serverProfile);
          // Merge server profile with defaults to ensure all properties exist
          const mergedProfile = {
            name: userName,
            firstName: "",
            age: "",
            university: "",
            degree: "",
            major: "",
            emoji: "😊",
            country: "🇫🇷",
            homeCountries: ["France"],
            city: "Paris",
            house: "",
            desc: "Language enthusiast",
            languages: ["English", "French"],
            languageLevels: { "English": "Fluent", "French": "Native" },
            bio: "",
            interests: [],
            ...serverProfile // Server values override defaults
          };
          // If server profile doesn't include an avatar, generate a quick default and persist it
          if (!mergedProfile.avatar) {
            try {
              const defaultAvatar = generateDefaultAvatarSpec(userName);
              mergedProfile.avatar = defaultAvatar;
              // Best-effort save to server so other devices see it
              api.saveUserProfile(userName, mergedProfile).then(() => {
                console.log('💾 Default avatar saved to server');
              }).catch((e) => {
                console.warn('Could not save default avatar to server:', e?.message || e);
              });
            } catch (e) {
              // ignore
            }
          }
          setProfile(mergedProfile);
          setEditedProfile(mergedProfile);
          localStorage.setItem(`userProfile_${userName}`, JSON.stringify(mergedProfile));
        }
      } catch (e) {
        console.log("ℹ️ No server profile found, using local/default");
      }
    })();
    return () => { cancelled = true; };
  }, [userName]);

  // For multi-country input (move hooks to top level)
  const [countryInput, setCountryInput] = useState("");

  // Canonicalize country name
  const canonicalizeCountry = (val) => {
    if (!val) return "";
    const trimmed = String(val).trim();
    const match = fullCountries.find(c => c.toLowerCase() === trimmed.toLowerCase());
    return match || trimmed;
  };

  // Full language list for suggestions (broad coverage of official/common languages)
  const fullLanguages = [
    "Afrikaans","Akan","Albanian","Amharic","Arabic","Armenian","Assamese","Aymara",
    "Azerbaijani","Bambara","Basque","Belarusian","Bengali","Berber","Bosnian","Breton",
    "Bulgarian","Burmese","Catalan","Cebuano","Chichewa","Chinese","Mandarin Chinese","Cantonese",
    "Corsican","Croatian","Czech","Danish","Dari","Dhivehi","Dutch","Dzongkha","English",
    "Esperanto","Estonian","Faroese","Fijian","Filipino","Finnish","French","Galician",
    "Georgian","German","Greek","Greenlandic","Guarani","Gujarati","Haitian Creole","Hausa",
    "Hebrew","Hindi","Hiri Motu","Hungarian","Icelandic","Igbo","Ilocano","Indonesian",
    "Irish","Italian","Japanese","Javanese","Kannada","Kazakh","Khmer","Kinyarwanda",
    "Kirghiz","Kirundi","Konkani","Korean","Kurdish","Kyrgyz","Lao","Latvian","Lingala",
    "Lithuanian","Luxembourgish","Macedonian","Malagasy","Malay","Malayalam","Maltese","Maori",
    "Marathi","Marshallese","Moldovan","Mongolian","Montenegrin","Nepali","Northern Ndebele",
    "Norwegian","Nyanja","Odia","Oromo","Ossetian","Papiamento","Pashto","Persian (Farsi)",
    "Polish","Portuguese","Punjabi","Quechua","Romanian","Russian","Samoan","Sango",
    "Sanskrit","Scottish Gaelic","Serbian","Shona","Sindhi","Sinhala","Slovak","Slovenian",
    "Somali","Sotho","Spanish","Swahili","Swati","Swedish","Tagalog","Tajik","Tamil",
    "Telugu","Tetum","Thai","Tibetan","Tigrinya","Tok Pisin","Tonga","Tsonga","Tswana",
    "Turkish","Turkmen","Ukrainian","Urdu","Uzbek","Venda","Vietnamese","Wallisian",
    "Welsh","Wolof","Xhosa","Yiddish","Yoruba","Zulu"
  ];

  // Note: replaced the old fixed Countries From chips with a searchable multi-select below.

  // Full country list for searchable suggestions (ISO-like names)
  const fullCountries = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
    "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica","Côte d’Ivoire","Croatia","Cuba","Cyprus","Czechia (Czech Republic)",
    "Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini (fmr. Swaziland)","Ethiopia",
    "Fiji","Finland","France",
    "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
    "Haiti","Honduras","Hungary",
    "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
    "Jamaica","Japan","Jordan",
    "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
    "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
    "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar (Burma)",
    "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
    "Oman",
    "Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
    "Qatar",
    "Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
    "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
    "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
    "Vanuatu","Vatican City","Venezuela","Vietnam",
    "Yemen",
    "Zambia","Zimbabwe"
  ];

  // CIUP houses (47 total on campus). Curated list from official site.
  const availableHouses = [
    // Fondations & résidences
    "Fondation Deutsch de la Meurthe",
    "Fondation des États-Unis",
    "Fondation Avicenne",
    "Fondation Biermans-Lapôtre",
    "Fondation Suisse (Pavillon Le Corbusier)",
    "Fondation Rosa Abreu de Grancher",
  "Fondation Abreu de Grancher",
    "Résidence André Honnorat",
  "Fondation argentine (Maison de l'Argentine)",
  "Maison des étudiants arméniens (Fondation Marie Nubar)",
  "Maison des Élèves Ingénieurs Arts et Métiers",
    "Maison Internationale",
  "Maison internationale AgroParisTech",
  "L-OBLIQUE (ancien Fondation Avicenne / Pavillon de l'Iran)",
    // Maisons par pays / régions
    "Collège d'Espagne",
    "Collège Franco-Britannique",
    "Maison de l'Argentine",
    "Maison du Brésil",
    "Maison du Cambodge",
    "Maison du Canada",
  "Maison des étudiants canadiens",
    "Maison de la Chine",
  "Maison de Chine",
    "Maison de la Corée",
    "Maison de l'Égypte",
  "Maison d'Égypte",
    "Maison de la Grèce",
  "Fondation hellénique",
    "Maison de l'Inde",
    "Maison de l'Île-de-France",
    "Maison de l'Italie",
    "Maison du Japon",
    "Maison du Liban",
    "Maison du Maroc",
    "Maison du Mexique",
    "Maison de la Norvège",
    "Maison du Portugal – André de Gouveia",
  "Fondation de Monaco",
  "Collège néerlandais",
    "Maison de la Suède",
  "Maison des étudiants suédois",
    "Maison Heinrich Heine (Allemagne)",
    "Maison des Provinces de France",
  "Maison des étudiants de la francophonie",
  "Fondation Danoise",
  "Maison des Industries agricoles et alimentaires",
  "Maison de l'Institut national agronomique",
  "Résidence Lucien Paye",
  "Fondation Lucien Paye",
  "Résidence Lila",
  "Résidence Quai de la Loire",
  "Résidence Julie-Victoire Daubié",
  "Résidence Robert Garric",
  "Fondation Victor Lyon",
  "Fondation suisse",
  "Pavillon Habib Bourguiba (Tunisie)",
  "Maison de Tunisie",
    // Historic/region-focused (frequent on campus)
    "Maison des étudiants de l’Asie du Sud-Est",
    "Alumni",
    // Fallback
    "Other",
  ];

  const languageLevels = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"];


  const availableInterests = [
    "Sports", "Music", "Art", "Movies", "Books", "Gaming",
    "Travel", "Food", "Technology", "Fashion", "Photography", "Fitness"
  ];

  // Note: Replaced emoji grid with a country dropdown; emoji list removed.

  const handleSave = async () => {
    setProfile(editedProfile);
    localStorage.setItem(`userProfile_${userName}`, JSON.stringify(editedProfile));
    setIsEditing(false);
    setSuccessMessage("✅ Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
    // Scroll back to top after saving changes
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
      // fallback
      window.scrollTo(0, 0);
    }
    // Also save online (best-effort)
    try {
      console.log("💾 Saving profile to server:", editedProfile);
      await api.saveUserProfile(userName, editedProfile);
      console.log("✅ Profile saved to server successfully");
    } catch (e) {
      console.error("❌ Profile saved locally, but online save failed:", e?.message || e);
    }
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  // Languages: helpers for searchable multi-select + level bookkeeping
  const [languageInput, setLanguageInput] = useState("");

  const canonicalizeLanguage = (val) => {
    if (!val) return "";
    const trimmed = String(val).trim();
    const match = fullLanguages.find(l => l.toLowerCase() === trimmed.toLowerCase());
    return match || trimmed;
  };

  const addLanguage = () => {
    const canonical = canonicalizeLanguage(languageInput);
    if (!canonical) return;
    const current = editedProfile.languages || [];
    const exists = current.some(l => l.toLowerCase() === canonical.toLowerCase());
    if (!exists) {
      const updated = [...current, canonical];
      const updatedLevels = { ...(editedProfile.languageLevels || {}) };
      if (!updatedLevels[canonical]) updatedLevels[canonical] = "Beginner";
      setEditedProfile({ ...editedProfile, languages: updated, languageLevels: updatedLevels });
    }
    setLanguageInput("");
  };

  const removeLanguage = (lang) => {
    const current = editedProfile.languages || [];
    const updated = current.filter(l => l !== lang);
    const updatedLevels = { ...(editedProfile.languageLevels || {}) };
    if (updatedLevels[lang]) delete updatedLevels[lang];
    setEditedProfile({ ...editedProfile, languages: updated, languageLevels: updatedLevels });
  };

  const handleLanguageLevelChange = (lang, level) => {
    const updatedLevels = { ...(editedProfile.languageLevels || {}) };
    updatedLevels[lang] = level;
    setEditedProfile({ ...editedProfile, languageLevels: updatedLevels });
  };

  // Removed legacy handleCountryToggle; Countries From now uses add/remove helpers below.

  // Home Country uses the same country datalist as Current Country; changes sync to countriesFrom

  const handleInterestToggle = (interest) => {
    const updated = editedProfile.interests.includes(interest)
      ? editedProfile.interests.filter(i => i !== interest)
      : [...editedProfile.interests, interest];
    setEditedProfile({ ...editedProfile, interests: updated });
  };

  const isMobile = window.innerWidth <= 600;

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: theme.bg,
      padding: isMobile ? "12px" : "20px",
      fontFamily: "Inter, Roboto, sans-serif",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isMobile ? 16 : 24,
      maxWidth: 800,
      margin: isMobile ? "0 auto 16px auto" : "0 auto 24px auto",
    },
    backButton: {
      background: "transparent",
      border: "none",
      fontSize: isMobile ? 20 : 24,
      color: theme.primary,
      cursor: "pointer",
      padding: isMobile ? 6 : 8,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: isMobile ? 14 : theme.radiusLg,
      padding: isMobile ? 16 : 24,
      boxShadow: theme.shadow,
      maxWidth: 800,
      margin: isMobile ? "0 auto 12px auto" : "0 auto 20px auto",
    },
    title: {
      fontSize: isMobile ? 22 : 28,
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
      padding: isMobile ? 10 : 12,
      borderRadius: 12,
      border: `2px solid ${theme.border}`,
      fontSize: isMobile ? 14 : 15,
      fontFamily: "inherit",
      outline: "none",
      transition: "border 0.2s",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: isMobile ? 10 : 12,
      borderRadius: 12,
      border: `2px solid ${theme.border}`,
      fontSize: isMobile ? 14 : 15,
      fontFamily: "inherit",
      outline: "none",
      minHeight: isMobile ? 80 : 100,
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
      gap: isMobile ? 6 : 8,
      marginTop: 8,
    },
    chip: (isSelected) => ({
      padding: isMobile ? "5px 10px" : "6px 14px",
      borderRadius: 20,
      fontSize: isMobile ? 12 : 14,
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

  const createOrRotateInvite = async () => {
    try {
      const res = await api.createOrRotateInviteCode(userName);
      setInviteCode(res.invite_code);
      setSuccessMessage(`✅ Your invite code: ${res.invite_code}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      alert('Could not generate invite code.');
    }
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
          <label style={styles.label}>Profile Avatar</label>
          {isEditing ? (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" onClick={() => setAvatarTab('emoji')} style={{ padding: 8, borderRadius: 8, border: avatarTab==='emoji' ? '2px solid #37B300' : '1px solid #ddd' }}>Emoji</button>
                <button type="button" onClick={() => setAvatarTab('dicebear')} style={{ padding: 8, borderRadius: 8, border: avatarTab==='dicebear' ? '2px solid #37B300' : '1px solid #ddd' }}>Avatars</button>
              </div>
              {avatarTab === 'emoji' ? (
                <div style={styles.emojiPicker}>
                  {["😊", "😎", "🤓", "😃", "🥳", "🌟", "🚀", "💪"].map((emoji) => (
                    <span
                      key={emoji}
                      style={styles.emojiButton(editedProfile.emoji === emoji)}
                      onClick={() => setEditedProfile({ ...editedProfile, emoji, avatar: null })}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <div>
                  {/* Use AvatarPlayground component for a nicer quick playground (REST) */}
                  {/* eslint-disable-next-line import/first */}
                  {(() => {
                    try {
                      const AvatarPlayground = require('./components/AvatarPlayground').default;
                      return (
                        <AvatarPlayground
                          initialSpec={editedProfile.avatar || { provider: 'dicebear', style: 'bottts', seed: editedProfile.name || userName }}
                          onChange={(spec) => setEditedProfile({ ...editedProfile, avatar: spec, emoji: null })}
                        />
                      );
                    } catch (e) {
                      // Fallback inline controls if import fails for any reason
                      return (
                        <div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            {['bottts','micah','adventurer','pixel-art','avataaars'].map(style => (
                              <button key={style} type="button" onClick={() => setEditedProfile({ ...editedProfile, avatar: { provider: 'dicebear', style, seed: editedProfile.name || userName } })} style={{ border: editedProfile.avatar && editedProfile.avatar.style === style ? '2px solid #37B300' : '1px solid #ddd', padding: 6, borderRadius: 8 }}>
                                <img src={`https://api.dicebear.com/6.x/${style}/svg?seed=${encodeURIComponent(editedProfile.name || userName)}`} alt={style} style={{ width: 64, height: 64 }} />
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="text" style={{ ...styles.input, flex: 1 }} placeholder="Seed for avatar (optional)" value={(editedProfile.avatar && editedProfile.avatar.seed) || ''} onChange={(e) => setEditedProfile({ ...editedProfile, avatar: { ...(editedProfile.avatar || { provider: 'dicebear', style: 'bottts', seed: '' }), seed: e.target.value } })} />
                            <button type="button" style={{ ...styles.button, ...styles.primaryButton }} onClick={() => { if (!editedProfile.avatar) setEditedProfile({ ...editedProfile, avatar: { provider: 'dicebear', style: 'bottts', seed: editedProfile.name || userName } }); }}>Set</button>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.value}>
              {profile.avatar && profile.avatar.provider === 'dicebear' ? (
                <img src={`https://api.dicebear.com/6.x/${profile.avatar.style}/svg?seed=${encodeURIComponent(profile.avatar.seed || profile.name || userName)}`} alt="avatar" style={{ width: 36, height: 36, verticalAlign: 'middle' }} />
              ) : (
                <span style={{ fontSize: 20 }}>{profile.emoji}</span>
              )}
            </div>
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
            <select
              style={{ ...styles.input, padding: 10 }}
              value={editedProfile.degree || ""}
              onChange={(e) => setEditedProfile({ ...editedProfile, degree: e.target.value })}
            >
              <option value="">Select degree</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PHD">PHD</option>
              <option value="Researcher">Researcher</option>
            </select>
          ) : (
            <div style={styles.value}>{profile.degree || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Major</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.major || ""}
              onChange={(e) => setEditedProfile({ ...editedProfile, major: e.target.value })}
              placeholder="Enter your major"
            />
          ) : (
            <div style={styles.value}>{profile.major || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Current Country</label>
          {isEditing ? (
            <div>
              <input
                type="text"
                list="country-list"
                style={styles.input}
                value={editedProfile.country || ""}
                onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                placeholder="Start typing a country..."
                aria-label="Country"
                autoComplete="country-name"
              />
              <datalist id="country-list">
                {fullCountries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          ) : (
            <div style={styles.value}>{profile.country || "Not specified"}</div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Current City</label>
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
          <label style={styles.label}>Home Countries</label>
          {isEditing ? (
            <div>
              <input
                type="text"
                list="country-list"
                style={styles.input}
                value={countryInput || ""}
                onChange={(e) => setCountryInput(e.target.value)}
                placeholder="Type a country and press Enter"
                aria-label="Add home country"
                autoComplete="off"
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && countryInput) {
                    e.preventDefault();
                    const canonical = canonicalizeCountry(countryInput);
                    if (canonical && !editedProfile.homeCountries.includes(canonical)) {
                      setEditedProfile({
                        ...editedProfile,
                        homeCountries: [...editedProfile.homeCountries, canonical],
                      });
                    }
                    setCountryInput("");
                  }
                }}
              />
              <datalist id="country-list">
                {fullCountries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div style={styles.chipContainer}>
                {(editedProfile.homeCountries || []).map(country => (
                  <span key={country} style={styles.chip(true)}>
                    {country}
                    <button
                      type="button"
                      onClick={() => setEditedProfile({
                        ...editedProfile,
                        homeCountries: editedProfile.homeCountries.filter(c => c !== country)
                      })}
                      aria-label={`Remove ${country}`}
                      style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontWeight: 700 }}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.value}>
              {(profile.homeCountries && profile.homeCountries.length > 0)
                ? profile.homeCountries.join(", ")
                : "Not specified"}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Short Bio</label>
          {isEditing ? (
            <input
              type="text"
              style={styles.input}
              value={editedProfile.desc}
              onChange={(e) => setEditedProfile({ ...editedProfile, desc: e.target.value })}
              placeholder="Write a short bio"
            />
          ) : (
            <div style={styles.value}>{profile.desc}</div>
          )}
        </div>

        {/* Removed full Bio section as per request */}

        <div style={styles.section}>
          <label style={styles.label}>Languages You Speak</label>
          {isEditing ? (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <input
                  type="text"
                  list="language-list"
                  style={{ ...styles.input, flex: 1 }}
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Type a language and press Enter"
                  aria-label="Add language you speak"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addLanguage();
                    }
                  }}
                />
                <button
                  type="button"
                  style={{ ...styles.button, ...styles.primaryButton, padding: '10px 14px', whiteSpace: 'nowrap' }}
                  onClick={addLanguage}
                >Add</button>
              </div>
              <datalist id="language-list">
                {fullLanguages.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <div style={styles.chipContainer}>
                {(editedProfile.languages || []).map(lang => (
                  <span key={lang} style={styles.chip(true)}>
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      aria-label={`Remove ${lang}`}
                      style={{
                        marginLeft: 8,
                        background: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.chipContainer}>
              {(profile.languages || []).map(lang => (
                <span key={lang} style={styles.chip(true)}>{lang}</span>
              ))}
            </div>
          )}
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
                  style={styles.chip((editedProfile.interests || []).includes(interest))}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </span>
              ))
            ) : (
              (profile.interests || []).length > 0 ? (
                (profile.interests || []).map(interest => (
                  <span key={interest} style={styles.chip(true)}>{interest}</span>
                ))
              ) : (
                <div style={styles.value}>No interests selected</div>
              )
            )}
          </div>
        </div>

        {/* Invitations */}
        {!isEditing && (
          <div style={styles.section}>
            <label style={styles.label}>Invitations</label>
            <div style={{ display: 'grid', gap: 10 }}>
              {inviteLoading ? (
                <div style={{ fontSize: 14, color: theme.textMuted }}>Loading invite code…</div>
              ) : inviteCode ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: theme.text }}>{inviteCode}</div>
                    <div style={{ fontSize: 12.5, color: theme.textMuted }}>
                      Reusable · from you
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ ...styles.button, ...styles.secondaryButton, padding: '8px 12px' }}
                      onClick={async () => { try { await navigator.clipboard.writeText(inviteCode); alert('Copied!'); } catch {} }}
                    >Copy</button>
                    <button
                      style={{ ...styles.button, background: theme.accent, color: '#fff', padding: '8px 12px' }}
                      onClick={createOrRotateInvite}
                    >Rotate</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, color: theme.textMuted }}>{inviteError || 'Invite code unavailable.'}</span>
                  <button
                    style={{ ...styles.button, ...styles.primaryButton, padding: '8px 12px' }}
                    onClick={loadOrCreateInviteCode}
                  >Retry</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sign Out Button - Always visible when not editing */}
        {!isEditing && (
          <div style={{ marginTop: 24 }}>
            <button
              style={{
                ...styles.button,
                background: "#EA2B2B",
                color: "white",
                width: "100%",
                fontWeight: 900,
                fontSize: 16,
                padding: "14px 20px",
                border: "none",
                borderRadius: 14,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(234,43,43,0.25)",
              }}
              onClick={() => {
                if (window.confirm("Are you sure you want to sign out?")) {
                  onSignOut && onSignOut();
                }
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        )}

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
