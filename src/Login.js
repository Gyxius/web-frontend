import React, { useState } from "react";
import * as api from "./api";

// Avatar styles & options
const AVATAR_STYLES = [
  'bottts','micah','adventurer','pixel-art','avataaars','lorelei','notionists','personas','thumbs','fun-emoji'
];
const EMOJI_OPTIONS = ['😊','😎','🤓','😃','🥳','🌟','🚀','💪','❤️','🎉','🔥','✨'];
const INTERESTS_OPTIONS = [
  'Sports','Music','Art','Movies','Books','Gaming','Travel','Food','Technology','Fashion','Photography','Fitness'
];
const POPULAR_COUNTRIES = [
  'France','Spain','Italy','Germany','United Kingdom','United States','China','Japan','South Korea','Brazil','Mexico','Canada','India','Morocco','Algeria','Tunisia','Portugal','Netherlands','Belgium','Switzerland','Poland','Turkey','Greece','Romania'
];
const POPULAR_CITIES = [
  'Paris','Madrid','Barcelona','Rome','Milan','Berlin','Munich','London','Manchester','New York','Los Angeles','Tokyo','Seoul','Beijing','Shanghai','São Paulo','Mexico City','Toronto','Montreal','Mumbai','Delhi','Casablanca','Lisbon','Amsterdam','Brussels'
];
const LANGUAGE_OPTIONS = [
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
const FULL_LANGUAGES = [
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

function Login({ onLogin, onRegistered }) {
  // Auth basics
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Multi-step registration flow
  const [currentStep, setCurrentStep] = useState(1); // 1 Basic, 2 Academic, 3 Interests/Campus
  const [showPreview, setShowPreview] = useState(false);

  // Profile fields
  const [avatarTab, setAvatarTab] = useState("emoji");
  const [selectedEmoji, setSelectedEmoji] = useState("😊");
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState("avataaars");
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState("preview");
  const [randomAvatars, setRandomAvatars] = useState([]); // [{seed, style}]
  const [firstName, setFirstName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState(""); // optional
  const [university, setUniversity] = useState(""); // optional
  const [degree, setDegree] = useState(""); // optional
  const [major, setMajor] = useState(""); // optional
  const [currentCountry, setCurrentCountry] = useState("France");
  const [currentCity, setCurrentCity] = useState("Paris");
  const [homeCountries, setHomeCountries] = useState([]);
  const [homeCountryInput, setHomeCountryInput] = useState("");
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState("");
  const [languageLevels, setLanguageLevels] = useState({});
  const [interests, setInterests] = useState([]);
  const [citeStatus, setCiteStatus] = useState("");
  const [houseInCite, setHouseInCite] = useState("");
  const [cityReasons, setCityReasons] = useState([]);

  // Theme
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
  const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";

  // Helpers
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

  const generateRandomAvatars = () => {
    const seeds = Array.from({ length: 10 }, () => Math.random().toString(36).slice(2, 12));
    setRandomAvatars(seeds.map(seed => ({ seed, style: selectedAvatarStyle })));
  };

  const addHomeCountry = () => {
    if (homeCountryInput && !homeCountries.includes(homeCountryInput)) {
      setHomeCountries([...homeCountries, homeCountryInput]);
      setHomeCountryInput("");
    }
  };
  const removeHomeCountry = c => setHomeCountries(homeCountries.filter(x => x !== c));

  const addLanguage = () => {
    if (languageInput && !languages.includes(languageInput)) {
      setLanguages([...languages, languageInput]);
      setLanguageInput("");
    }
  };
  const removeLanguage = l => {
    const newLangs = languages.filter(x => x !== l);
    const newLevels = { ...languageLevels };
    delete newLevels[l];
    setLanguages(newLangs);
    setLanguageLevels(newLevels);
  };

  // Step validation
  const validateStep = (step) => {
    if (!isRegistering) return true;
    if (step === 1) {
      if (!userName.trim() || userName.trim().length < 3) {
        setError("Username ≥ 3 chars");
        return false;
      }
      if (!password.trim() || password.length < 3) {
        setError("Password ≥ 3 chars");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return false;
      }
      if (!firstName.trim()) {
        setError("Enter first name");
        return false;
      }
      if (!bio.trim()) {
        setError("Write a short bio");
        return false;
      }
    }
    if (step === 3) {
      if (interests.length === 0) {
        setError("Select at least one interest");
        return false;
      }
      if (languages.length === 0) {
        setError("Add at least one language");
        return false;
      }
      if (!citeStatus) {
        setError("Select campus status");
        return false;
      }
    }
    setError("");
    return true;
  };
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        setShowPreview(true);
      } else {
        setCurrentStep(s => s + 1);
      }
    }
  };
  const prevStep = () => { setError(""); setCurrentStep(s => s - 1); };

  // Submit (final confirmation from preview or direct login)
  const handleSubmit = async () => {
    if (isRegistering && !showPreview) return; // Should only submit from preview
    setLoading(true);
    setError("");
    try {
      const endpoint = isRegistering ? '/register' : '/login';
      const response = await fetch(`${API_URL}${endpoint}`,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: userName.trim(), password }) });
      if (!response.ok) {
        const data = await response.json().catch(()=>({}));
        if (response.status === 400) setError("Username exists. Log in instead.");
        else if (response.status === 404) setError(isRegistering?"Registration failed":"User not found");
        else setError(data.detail || 'Request failed');
        return;
      }
      const data = await response.json();
      if (data.username) {
        if (isRegistering) {
          let avatarSpec;
          if (avatarTab === 'emoji') {
            avatarSpec = { provider:'emoji', emoji: selectedEmoji };
          } else {
            avatarSpec = { provider:'dicebear', style: selectedAvatarStyle, seed: selectedAvatarSeed === 'preview' ? userName.trim() : selectedAvatarSeed };
          }
          const profile = {
            name: userName.trim(),
            firstName: firstName.trim(),
            bio: bio.trim(),
            age: age.trim(),
            university: university.trim(),
            degree: degree.trim(),
            major: major.trim(),
            country: currentCountry,
            city: currentCity,
            homeCountries,
            languages,
            languageLevels,
            interests,
            citeStatus,
            house: (citeStatus === 'yes' || citeStatus === 'alumni') ? houseInCite.trim() : '',
            cityReasons,
            avatar: avatarSpec
          };
          localStorage.setItem(`userProfile_${data.username}`, JSON.stringify(profile));
          try { await api.saveUserProfile(data.username, profile); } catch(e){ console.warn('Profile save failed', e); }
          if (typeof onRegistered === 'function') onRegistered(data.username);
        }
        onLogin(data.username);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // UI building blocks
  const sectionHeader = (label) => (
    <div style={{ fontSize:16, fontWeight:800, color:theme.text, margin:'24px 0 12px', paddingBottom:8, borderBottom:`2px solid ${theme.border}`}}>{label}</div>
  );
  const stepIndicator = (
    <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:24 }}>
      {[1,2,3].map(step => (
        <div key={step} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background: currentStep>=step? theme.primary: theme.border, color: currentStep>=step? 'white': theme.textMuted, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{step}</div>
          {step<3 && <div style={{ width:46, height:4, background: currentStep>step? theme.primary: theme.border, borderRadius:4 }}/>}      
        </div>
      ))}
    </div>
  );

  // Steps
  const Step1 = (
    <div>
      {sectionHeader('Basic Info')}
      <input type="text" placeholder="Username" value={userName} onChange={e=>setUserName(e.target.value)} style={inputStyle} autoComplete="off" />
      <div style={{ position:'relative' }}>
        <input type={showPassword? 'text':'password'} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
        <button type="button" onClick={()=>setShowPassword(p=>!p)} style={{ position:'absolute', right:10, top:10, background:'none', border:'none', color:theme.textMuted, cursor:'pointer', fontWeight:700 }}>{showPassword? 'Hide':'Show'}</button>
      </div>
      <div style={{ position:'relative' }}>
        <input type={showConfirmPassword? 'text':'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
        <button type="button" onClick={()=>setShowConfirmPassword(p=>!p)} style={{ position:'absolute', right:10, top:10, background:'none', border:'none', color:theme.textMuted, cursor:'pointer', fontWeight:700 }}>{showConfirmPassword? 'Hide':'Show'}</button>
      </div>
      <input type="text" placeholder="First Name" value={firstName} onChange={e=>setFirstName(e.target.value)} style={inputStyle} />
      {sectionHeader('Profile Avatar')}
      <p style={{ fontSize:13, color:theme.textMuted, marginTop:-4, marginBottom:12 }}>Choose an avatar others will see on your profile.</p>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button type="button" onClick={()=>{setAvatarTab('emoji');}} style={{ flex:1, padding:'10px 12px', border:`2px solid ${avatarTab==='emoji'? theme.primary: theme.border}`, background: avatarTab==='emoji'? theme.primary:'white', color: avatarTab==='emoji'? 'white': theme.text, borderRadius:10, fontWeight:700, cursor:'pointer' }}>Emoji</button>
        <button type="button" onClick={()=>{setAvatarTab('avatars'); generateRandomAvatars(); setSelectedAvatarSeed('preview');}} style={{ flex:1, padding:'10px 12px', border:`2px solid ${avatarTab==='avatars'? theme.primary: theme.border}`, background: avatarTab==='avatars'? theme.primary:'white', color: avatarTab==='avatars'? 'white': theme.text, borderRadius:10, fontWeight:700, cursor:'pointer' }}>Avatars</button>
      </div>
      {avatarTab==='emoji' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
          {EMOJI_OPTIONS.map(em => (
            <button key={em} type="button" onClick={()=>setSelectedEmoji(em)} style={{ padding:12, fontSize:30, border:`${selectedEmoji===em?4:3}px solid ${selectedEmoji===em? theme.primary: theme.border}`, background:'white', borderRadius:14, cursor:'pointer', boxShadow: selectedEmoji===em? '0 4px 12px rgba(88,204,2,0.35)':'none', transition:'all .2s' }}>{em}</button>
          ))}
        </div>
      )}
      {avatarTab==='avatars' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <select value={selectedAvatarStyle} onChange={e=>{ setSelectedAvatarStyle(e.target.value); generateRandomAvatars(); }} style={{ flex:1, ...inputStyle, margin:0 }}>
              {AVATAR_STYLES.map(s=> <option key={s} value={s}>{s}</option> )}
            </select>
            <button type="button" onClick={generateRandomAvatars} style={{ padding:'12px 16px', background:'white', border:`2px solid ${theme.primary}`, color:theme.primary, fontWeight:700, borderRadius:12, cursor:'pointer', fontSize:15 }}>🎲 Refresh</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
            {randomAvatars.map(av => (
              <button key={av.seed} type="button" onClick={()=>setSelectedAvatarSeed(av.seed)} style={{ padding:8, border:`${selectedAvatarSeed===av.seed?4:3}px solid ${selectedAvatarSeed===av.seed? theme.primary: theme.border}`, borderRadius:12, background:'white', cursor:'pointer', overflow:'hidden', boxShadow: selectedAvatarSeed===av.seed? '0 4px 12px rgba(88,204,2,0.35)':'none', transition:'all .2s' }}>
                <img src={`https://api.dicebear.com/6.x/${av.style}/svg?seed=${av.seed}`} alt={av.style} style={{ width:'100%', display:'block' }}/>
              </button>
            ))}
          </div>
        </>
      )}
      <textarea rows={3} placeholder="Short Bio (Ex: Erasmus student from Spain studying Computer Science. Love music & exploring Paris!)" value={bio} onChange={e=>setBio(e.target.value)} style={{ ...inputStyle, resize:'vertical', marginTop:16 }} />
    </div>
  );
  const Step2 = (
    <div>
      {sectionHeader('Academic / Background')}
      <p style={{ fontSize:13, color:theme.textMuted, margin:'-4px 0 12px' }}>Optional – you can fill or edit later.</p>
      <input type="number" placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} style={inputStyle} />
      <input type="text" placeholder="University (Ex: Sorbonne)" value={university} onChange={e=>setUniversity(e.target.value)} style={inputStyle} />
      <select value={degree} onChange={e=>setDegree(e.target.value)} style={inputStyle}>
        <option value="">Degree{}</option>
        <option value="Bachelor">Bachelor</option>
        <option value="Master">Master</option>
        <option value="PhD">PhD</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" placeholder="Major (Ex: Computer Science)" value={major} onChange={e=>setMajor(e.target.value)} style={inputStyle} />
      {sectionHeader('Current Location')}
      <select value={currentCountry} onChange={e=>setCurrentCountry(e.target.value)} style={inputStyle}>
        {POPULAR_COUNTRIES.map(c=> <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={currentCity} onChange={e=>setCurrentCity(e.target.value)} style={inputStyle}>
        {POPULAR_CITIES.map(c=> <option key={c} value={c}>{c}</option>)}
      </select>
      {sectionHeader('Home Countries (Optional)')}
      <div style={{ display:'flex', gap:8 }}>
        <select value={homeCountryInput} onChange={e=>setHomeCountryInput(e.target.value)} style={{ ...inputStyle, margin:0 }}>
          <option value="">Select a country</option>
          {POPULAR_COUNTRIES.filter(c=>!homeCountries.includes(c)).map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" onClick={addHomeCountry} style={{ padding:'12px 16px', background:theme.primary, border:'none', color:'white', fontWeight:700, borderRadius:12, cursor:'pointer' }}>Add</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
        {homeCountries.map(c => (
          <div key={c} style={{ padding:'6px 12px', background:theme.primary, color:'white', borderRadius:20, display:'flex', alignItems:'center', gap:6, fontSize:14 }}>
            {c}
            <button type="button" onClick={()=>removeHomeCountry(c)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontWeight:700, fontSize:16 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
  const Step3 = (
    <div>
      {sectionHeader('Languages')}
      <p style={{ fontSize:13, color:theme.textMuted, margin:'-4px 0 8px' }}>Add at least one language.</p>
      <div style={{ display:'flex', gap:8 }}>
        <select value={languageInput} onChange={e=>setLanguageInput(e.target.value)} style={{ ...inputStyle, margin:0 }}>
          <option value="">Select a language</option>
          {LANGUAGE_OPTIONS.filter(l => !languages.includes(l)).map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <button type="button" onClick={addLanguage} style={{ padding:'12px 16px', background:theme.primary, border:'none', color:'white', fontWeight:700, borderRadius:12, cursor:'pointer' }}>Add</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
        {languages.map(l => (
          <div key={l} style={{ padding:'6px 12px', background:theme.accent, color:'white', borderRadius:20, display:'flex', alignItems:'center', gap:6, fontSize:14 }}>
            {l}
            <button type="button" onClick={()=>removeLanguage(l)} style={{ background:'none', border:'none', color:'white', cursor:'pointer', fontWeight:700, fontSize:16 }}>×</button>
          </div>
        ))}
      </div>
      {languages.length>0 && (
        <div style={{ marginTop:12 }}>
          <label style={{ fontSize:13, fontWeight:700, color:theme.textMuted }}>Proficiency (Optional)</label>
          {languages.map(l => (
            <div key={l} style={{ marginTop:8 }}>
              <label style={{ fontSize:13, color:theme.textMuted }}>{l}</label>
              <select value={languageLevels[l]||''} onChange={e=>setLanguageLevels({...languageLevels,[l]:e.target.value})} style={{ ...inputStyle, margin:'4px 0' }}>
                <option value="">Select level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Fluent">Fluent</option>
                <option value="Native">Native</option>
              </select>
            </div>
          ))}
        </div>
      )}
      {sectionHeader('Interests')}
      <p style={{ fontSize:13, color:theme.textMuted, margin:'-4px 0 8px' }}>Select 3–7 for best matching ({interests.length} selected).</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {INTERESTS_OPTIONS.map(i => {
          const checked = interests.includes(i);
          return (
            <button key={i} type="button" onClick={()=> setInterests(checked? interests.filter(x=>x!==i): [...interests,i])} style={{ padding:'10px 12px', border:`3px solid ${checked? theme.primary: theme.border}`, borderRadius:12, background: checked? theme.primary:'white', color: checked? 'white': theme.text, fontSize:13, fontWeight: checked?700:600, cursor:'pointer', boxShadow: checked? '0 2px 8px rgba(88,204,2,0.25)':'none', transition:'all .2s' }}>{i}</button>
          );
        })}
      </div>
      {sectionHeader('Are you connected to Cité Universitaire?')}
      <p style={{ fontSize:13, color:theme.textMuted, margin:'-4px 0 8px' }}>Select your connection to Cité Internationale Universitaire de Paris.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
        {[{value:'yes',label:'🏠 Live on campus'},{value:'alumni',label:'🎓 Alumni'},{value:'visit',label:'🚶 Visit often'},{value:'no',label:'❌ No'}].map(o => (
          <button key={o.value} type="button" onClick={()=>setCiteStatus(o.value)} style={{ padding:'14px 16px', textAlign:'left', border:`3px solid ${citeStatus===o.value? theme.primary: theme.border}`, borderRadius:14, background: citeStatus===o.value? `${theme.primary}15`:'white', color:theme.text, fontWeight: citeStatus===o.value?700:600, cursor:'pointer', boxShadow: citeStatus===o.value? '0 2px 8px rgba(88,204,2,0.2)':'none', transition:'all .2s' }}>{o.label}</button>
        ))}
      </div>
      {(citeStatus==='yes' || citeStatus==='alumni') && (
        <input type="text" placeholder="House in Cité (Ex: Maison du Mexique)" value={houseInCite} onChange={e=>setHouseInCite(e.target.value)} style={inputStyle} />
      )}
      {sectionHeader('What Brings You Here? (Optional)')}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
        {["🎓 Erasmus / Exchange","📚 Degree student","💼 Working / Internship","✈️ Visiting / Short stay","🏘️ Local resident","🌍 Other"].map(r => {
          const checked = cityReasons.includes(r);
          return (
            <button key={r} type="button" onClick={()=> setCityReasons(checked? cityReasons.filter(x=>x!==r): [...cityReasons,r])} style={{ padding:'14px 16px', textAlign:'left', border:`3px solid ${checked? theme.primary: theme.border}`, borderRadius:14, background: checked? `${theme.primary}15`:'white', color:theme.text, fontWeight: checked?700:600, cursor:'pointer', boxShadow: checked? '0 2px 8px rgba(88,204,2,0.2)':'none', transition:'all .2s' }}>{r}</button>
          );
        })}
      </div>
    </div>
  );

  // Preview Screen
  const Preview = () => {
    const avatarUrl = avatarTab==='emoji' ? null : `https://api.dicebear.com/6.x/${selectedAvatarStyle}/svg?seed=${selectedAvatarSeed==='preview'? userName || 'preview': selectedAvatarSeed}`;
    return (
      <div style={{ maxWidth:600, margin:'0 auto', padding:24 }}>
        <h2 style={{ textAlign:'center', fontSize:24, fontWeight:900, marginBottom:6, color:theme.text }}>Preview Your Profile</h2>
        <p style={{ textAlign:'center', fontSize:14, color:theme.textMuted, marginBottom:24 }}>Looks good? Create your account.</p>
        <div style={{ background:theme.card, padding:32, borderRadius:theme.radius, border:`1px solid ${theme.border}`, boxShadow:theme.shadow }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
            {avatarTab==='emoji' ? <div style={{ fontSize:70 }}>{selectedEmoji}</div> : <img src={avatarUrl} alt="avatar" style={{ width:110, height:110, borderRadius:'50%', border:`5px solid ${theme.primary}` }} />}
            <h3 style={{ fontSize:22, fontWeight:900, margin:'12px 0 4px', color:theme.text }}>{firstName}</h3>
            <p style={{ fontSize:14, color:theme.textMuted }}>@{userName}</p>
          </div>
          {bio && <p style={{ fontSize:15, lineHeight:1.5, color:theme.text }}>{bio}</p>}
          {interests.length>0 && (
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:theme.textMuted, marginBottom:8 }}>INTERESTS</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {interests.map(i => <span key={i} style={{ padding:'6px 14px', background:theme.primary, color:'white', borderRadius:20, fontSize:13, fontWeight:600 }}>{i}</span>)}
              </div>
            </div>
          )}
          {languages.length>0 && (
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:theme.textMuted, marginBottom:8 }}>LANGUAGES</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {languages.map(l => <span key={l} style={{ padding:'6px 14px', background:theme.accent, color:'white', borderRadius:20, fontSize:13, fontWeight:600 }}>{l}{languageLevels[l]? ` (${languageLevels[l]})`:''}</span>)}
              </div>
            </div>
          )}
          {(university || degree || major) && (
            <div style={{ marginTop:24, padding:16, background:theme.bg, borderRadius:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:theme.textMuted, marginBottom:6 }}>ACADEMIC</div>
              <p style={{ fontSize:14, color:theme.text }}>{[university, degree, major].filter(Boolean).join(' • ')}</p>
            </div>
          )}
        </div>
        {error && <p style={{ color:theme.danger, fontWeight:700, textAlign:'center', marginTop:16 }}>{error}</p>}
      </div>
    );
  };

  // Render root container
  if (showPreview && isRegistering) {
    return (
      <div style={{ maxWidth:900, margin:'32px auto 120px', padding:24, background:theme.bg, border:`1px solid ${theme.border}`, borderRadius:theme.radius, boxShadow:theme.shadow }}>
        <Preview />
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:`2px solid ${theme.border}`, padding:'16px 24px', boxShadow:'0 -4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ maxWidth:900, margin:'0 auto', display:'flex', gap:12 }}>
            <button type="button" onClick={()=> setShowPreview(false)} style={{ flex:1, padding:'14px', border:`2px solid ${theme.border}`, background:'white', color:theme.text, fontWeight:700, borderRadius:14, cursor:'pointer' }}>← Back</button>
            <button type="button" disabled={loading} onClick={handleSubmit} style={{ flex:2, padding:'14px', border:'none', background:`linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, color:'white', fontWeight:900, borderRadius:14, cursor: loading? 'not-allowed':'pointer', boxShadow:'0 10px 22px rgba(88,204,2,0.28)', opacity: loading? .65:1 }}>{loading? 'Creating…':'🟢 Create Account'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: isRegistering? 760: 420, margin:'32px auto 120px', padding:24, background:theme.bg, border:`1px solid ${theme.border}`, borderRadius:theme.radius, boxShadow:theme.shadow, fontFamily:'Inter, Roboto, sans-serif' }}>
      <div style={{ background:theme.card, padding:22, borderRadius:theme.radius, border:`1px solid ${theme.border}`, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:8, color:theme.primary, fontWeight:900, fontSize:18 }}>
          <img src={`${API_URL}/static/assets/logo.png`} alt="Lemi Logo" style={{ width:60, height:60, objectFit:'contain' }} />
        </div>
        <h2 style={{ textAlign:'center', fontSize:22, fontWeight:900, color:theme.text, marginBottom:6 }}>{isRegistering? 'Create Your Profile':'Welcome to Lemi'}</h2>
        <p style={{ textAlign:'center', color:theme.textMuted, fontSize:14.5, marginBottom:16 }}>Lemi helps international & Erasmus students and Cité residents meet, organize hangouts, and explore the city together.</p>
        {isRegistering && stepIndicator}
        {!isRegistering && (
          <form onSubmit={e=>{ e.preventDefault(); handleSubmit(); }} autoComplete="off">
            <input type="text" placeholder="Username" value={userName} onChange={e=>setUserName(e.target.value)} style={inputStyle} autoComplete="username" />
            <div style={{ position:'relative' }}>
              <input type={showPassword? 'text':'password'} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />
              <button type="button" onClick={()=>setShowPassword(p=>!p)} style={{ position:'absolute', right:10, top:10, background:'none', border:'none', color:theme.textMuted, cursor:'pointer', fontWeight:700 }}>{showPassword? 'Hide':'Show'}</button>
            </div>
            <button type="submit" disabled={loading || !userName.trim()} style={{ width:'100%', padding:'12px 14px', borderRadius:14, border:'none', background:`linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, color:'white', fontWeight:900, fontSize:16, cursor: loading||!userName.trim()? 'not-allowed':'pointer', boxShadow:'0 10px 22px rgba(88,204,2,0.28)', opacity: loading||!userName.trim()? .6:1 }}>{loading? 'Logging in…':'🟢 Log In'}</button>
            {error && <p style={{ color:theme.danger, textAlign:'center', fontWeight:700 }}>{error}</p>}
            <div style={{ textAlign:'center', marginTop:16, fontSize:14 }}>
              <span style={{ color:theme.textMuted }}>Don't have an account? </span>
              <button type="button" onClick={()=>{ setIsRegistering(true); setError(''); setPassword(''); setConfirmPassword(''); setCurrentStep(1); }} style={{ background:'none', border:'none', color:theme.primary, fontWeight:700, cursor:'pointer', textDecoration:'underline', fontSize:14 }}>Sign Up</button>
            </div>
          </form>
        )}
        {isRegistering && (
          <div>
            {currentStep===1 && Step1}
            {currentStep===2 && Step2}
            {currentStep===3 && Step3}
            {error && <p style={{ color:theme.danger, textAlign:'center', fontWeight:700, marginTop:12 }}>{error}</p>}
          </div>
        )}
      </div>
      {isRegistering && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:`2px solid ${theme.border}`, padding:'16px 24px', boxShadow:'0 -4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ maxWidth:760, margin:'0 auto', display:'flex', gap:12 }}>
            {currentStep>1 && <button type="button" onClick={prevStep} style={{ flex:1, padding:'14px', border:`2px solid ${theme.border}`, background:'white', color:theme.text, fontWeight:700, borderRadius:14, cursor:'pointer' }}>← Back</button>}
            <button type="button" onClick={nextStep} style={{ flex: currentStep===1?2:2, padding:'14px', border:'none', background:`linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, color:'white', fontWeight:900, borderRadius:14, cursor:'pointer', boxShadow:'0 10px 22px rgba(88,204,2,0.28)' }}>{currentStep===3? 'Preview Profile →':'Next Step →'}</button>
            {currentStep===1 && <button type="button" onClick={()=>{ setIsRegistering(false); setError(''); }} style={{ flex:1, padding:'14px', border:`2px solid ${theme.border}`, background:'white', color:theme.text, fontWeight:700, borderRadius:14, cursor:'pointer' }}>Have an account? Log In</button>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;