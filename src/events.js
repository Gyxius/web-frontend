// Auto-generated seed events for the app (50 entries)
// Fields used across the app: id, name, time, date, budget, type, category, language, location, description

const TYPES = [
  { id: "student", label: "🎓 Student" },
  { id: "cite", label: "🏠 Cité" },
  { id: "touristic", label: "🗼 Touristic" },
  { id: "popular", label: "🔥 Popular" },
  { id: "local", label: "🧃 Local" },
];

const CATEGORIES = [
  { id: "music", label: "🎶 Music" },
  { id: "outdoor", label: "🌳 Outdoor" },
  { id: "games", label: "🎳 Games" },
  { id: "food", label: "🍽️ Food" },
  { id: "random", label: "🎲 Random" },
];

const LANGUAGES = [
  { id: "Spanish", label: "🇪🇸 Spanish" },
  { id: "French", label: "🇫🇷 French" },
  { id: "English", label: "🇬🇧 English" },
  { id: "Italian", label: "🇮🇹 Italian" },
  { id: "Japanese", label: "🇯🇵 Japanese" },
];

// Fixed date/time/budget from the request
const DEFAULT_DATE = "27/10/2025";
const DEFAULT_START = "19:00";
const DEFAULT_END = "22:00";
const DEFAULT_BUDGET = 10;

const titles = {
  music: ["Karaoke on the Rooftop", "Acoustic Jam Night", "Open Mic Vibes", "Vinyl Listening Party"],
  outdoor: ["Picnic @ Montsouris", "Sunset Walk by the Seine", "Park Frisbee Meetup", "Street Photography Tour"],
  games: ["Board Games Evening", "Switch Party", "Trivia Night", "Chess & Chill"],
  food: ["Pho and Friends", "Taco Tuesday", "Crêpes & Conversation", "Pasta Potluck"],
  random: ["Mystery Meetup", "Art Jam", "Language Speed Dating", "DIY Workshop"],
};

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function buildName(categoryId, languageId, index) {
  const base = pick(titles[categoryId] || ["Community Hangout"], index);
  const lang = LANGUAGES.find(l => l.id === languageId)?.label || languageId;
  return `${base} – Practice ${lang.split(" ")[1] || lang}`;
}

const events = Array.from({ length: 50 }).map((_, i) => {
  const type = TYPES[i % TYPES.length];
  const category = CATEGORIES[i % CATEGORIES.length];
  const language = LANGUAGES[i % LANGUAGES.length];
  const id = `ev-${i + 1}`;
  const name = buildName(category.id, language.id, i);
  return {
    id,
    name,
    date: DEFAULT_DATE,
    time: DEFAULT_START,
    endTime: DEFAULT_END,
    budget: DEFAULT_BUDGET,
    type: type.id,
    typeLabel: type.label,
    category: category.id,
    categoryLabel: category.label,
    language: language.id,
    languageLabel: language.label,
    location: "Paris",
    description: `Type ${type.label} · ${category.label} · ${language.label} · Budget €${DEFAULT_BUDGET}`,
  };
});

export default events;
