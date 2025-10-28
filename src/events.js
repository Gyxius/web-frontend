// Auto-generated seed events for the app (50 entries)
// Fields used across the app: id, name, time, date, type, category, languages, location, description

const TYPES = [
  { id: "student", label: "🎓 Student" },
  { id: "cite", label: "🏠 Cité" },
  { id: "touristic", label: "🗼 Touristic" },
  { id: "popular", label: "🔥 Popular" },
  { id: "local", label: "🧃 Local" },
];

const CATEGORIES = [
  { id: "food", label: "�️ Food" },
  { id: "drinks", label: "� Drinks" },
  { id: "party", label: "� Party" },
  { id: "random", label: "� Random" },
  { id: "walk", label: "🚶 A Walk" },
];

const LANGUAGES = [
  { id: "Spanish", label: "🇪🇸 Spanish" },
  { id: "French", label: "🇫🇷 French" },
  { id: "English", label: "🇬🇧 English" },
  { id: "Italian", label: "🇮🇹 Italian" },
  { id: "Japanese", label: "🇯🇵 Japanese" },
];

// Language exchange pairs - people practicing each other's languages
const LANGUAGE_PAIRS = [
  ["French", "English"],
  ["Spanish", "English"],
  ["French", "Spanish"],
  ["Italian", "English"],
  ["Japanese", "English"],
  ["French", "Italian"],
  ["Spanish", "Italian"],
  ["Japanese", "French"],
];

// Fixed date/time from the request
const DEFAULT_DATE = "27/10/2025";
const DEFAULT_START = "19:00";
const DEFAULT_END = "22:00";


const titles = {
  food: ["Pho and Friends", "Taco Tuesday", "Crêpes & Conversation", "Pasta Potluck"],
  drinks: ["Karaoke on the Rooftop", "Wine & Chat", "Craft Beers Meetup", "Mocktails & Music"],
  party: ["Board Games Evening", "Switch Party", "Trivia Night", "Dance Social"],
  random: ["Mystery Meetup", "Art Jam", "Language Speed Dating", "DIY Workshop"],
  walk: ["Sunset Walk by the Seine", "Luxembourg Garden Stroll", "Quai de Seine Walk", "Montmartre Stairs Walk"],
};

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function buildName(categoryId, languagePair, index) {
  const base = pick(titles[categoryId] || ["Community Hangout"], index);
  const lang1 = LANGUAGES.find(l => l.id === languagePair[0])?.label.split(" ")[1] || languagePair[0];
  const lang2 = LANGUAGES.find(l => l.id === languagePair[1])?.label.split(" ")[1] || languagePair[1];
  return `${base} – ${lang1}↔${lang2} Exchange`;
}

const events = Array.from({ length: 50 }).map((_, i) => {
  const type = TYPES[i % TYPES.length];
  const category = CATEGORIES[i % CATEGORIES.length];
  const languagePair = LANGUAGE_PAIRS[i % LANGUAGE_PAIRS.length];
  const id = `ev-${i + 1}`;
  const name = buildName(category.id, languagePair, i);
  return {
    id,
    name,
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: type.id,
    typeLabel: type.label,
    category: category.id,
    categoryLabel: category.label,
    languages: languagePair, // Array of languages for exchange
    languageLabels: languagePair.map(lang => LANGUAGES.find(l => l.id === lang)?.label || lang).join(" & "),
    location: type.id === "cite" ? "Cité" : "Paris",
    description: `Type ${type.label} · ${category.label} · ${languagePair.join("↔")} Exchange`,
  };
});

// Extra events for specific matching scenarios
const extraEvents = [
  {
    id: "ev-tour-fr-out-1",
    name: "Sunset Walk by the Seine – French↔English Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "touristic",
    typeLabel: "🗼 Touristic",
    category: "walk",
    categoryLabel: "🚶 A Walk",
    languages: ["French", "English"],
    languageLabels: "🇫🇷 French & 🇬🇧 English",
    location: "Paris",
    description: "🗼 Touristic · 🚶 A Walk · French↔English Exchange",
  },
  {
    id: "ev-tour-fr-out-2",
    name: "Montmartre Stair Climb – French↔English Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "touristic",
    typeLabel: "🗼 Touristic",
    category: "walk",
    categoryLabel: "🚶 A Walk",
    languages: ["French", "English"],
    languageLabels: "🇫🇷 French & 🇬🇧 English",
    location: "Paris",
    description: "🗼 Touristic · 🚶 A Walk · French↔English Exchange",
  },
  {
    id: "ev-tour-fr-out-3",
    name: "Luxembourg Garden Stroll – French↔Spanish Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "touristic",
    typeLabel: "🗼 Touristic",
    category: "walk",
    categoryLabel: "🚶 A Walk",
    languages: ["French", "Spanish"],
    languageLabels: "🇫🇷 French & 🇪🇸 Spanish",
    location: "Paris",
    description: "🗼 Touristic · 🚶 A Walk · French↔Spanish Exchange",
  },
  {
    id: "ev-tour-fr-out-4",
    name: "Parc des Buttes-Chaumont Picnic – French↔Italian Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "touristic",
    typeLabel: "🗼 Touristic",
    category: "walk",
    categoryLabel: "🚶 A Walk",
    languages: ["French", "Italian"],
    languageLabels: "🇫🇷 French & 🇮🇹 Italian",
    location: "Paris",
    description: "🗼 Touristic · 🚶 A Walk · French↔Italian Exchange",
  },
  {
    id: "ev-tour-fr-out-5",
    name: "Paris Street Photography – French↔Japanese Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "touristic",
    typeLabel: "🗼 Touristic",
    category: "walk",
    categoryLabel: "🚶 A Walk",
    languages: ["French", "Japanese"],
    languageLabels: "🇫🇷 French & 🇯🇵 Japanese",
    location: "Paris",
    description: "🗼 Touristic · 🚶 A Walk · French↔Japanese Exchange",
  },
  {
    id: "ev-cite-es-out-1",
    name: "Cité Park Hangout – Spanish↔English Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "cite",
    typeLabel: "🏠 Cité",
    category: "party",
    categoryLabel: "� Party",
    languages: ["Spanish", "English"],
    languageLabels: "🇪🇸 Spanish & 🇬🇧 English",
    location: "Cité",
    description: "🏠 Cité · � Party · Spanish↔English Exchange",
  },
  {
    id: "ev-cite-es-out-2",
    name: "Campus Garden Meetup – Spanish↔French Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "cite",
    typeLabel: "🏠 Cité",
    category: "party",
    categoryLabel: "� Party",
    languages: ["Spanish", "French"],
    languageLabels: "🇪🇸 Spanish & 🇫🇷 French",
    location: "Cité",
    description: "🏠 Cité · � Party · Spanish↔French Exchange",
  },
  {
    id: "ev-cite-es-out-3",
    name: "Residence Terrace Chat – Spanish↔Italian Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "cite",
    typeLabel: "🏠 Cité",
    category: "party",
    categoryLabel: "� Party",
    languages: ["Spanish", "Italian"],
    languageLabels: "🇪🇸 Spanish & 🇮🇹 Italian",
    location: "Cité",
    description: "🏠 Cité · � Party · Spanish↔Italian Exchange",
  },
  {
    id: "ev-cite-es-out-4",
    name: "Student Village BBQ – English↔French Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "cite",
    typeLabel: "🏠 Cité",
    category: "party",
    categoryLabel: "� Party",
    languages: ["English", "French"],
    languageLabels: "�� English & 🇫🇷 French",
    location: "Cité",
    description: "🏠 Cité · � Party · English↔French Exchange",
  },
  {
    id: "ev-cite-es-out-5",
    name: "Dorm Courtyard Session – Italian↔English Exchange",
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    type: "cite",
    typeLabel: "🏠 Cité",
    category: "party",
    categoryLabel: "� Party",
    languages: ["Italian", "English"],
    languageLabels: "�� Italian & 🇬🇧 English",
    location: "Cité",
    description: "🏠 Cité · � Party · Italian↔English Exchange",
  },
];

const allEvents = [...events, ...extraEvents];
export default allEvents;
