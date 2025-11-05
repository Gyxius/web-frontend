// Example users.js for AdminAssign
const users = [
  {
    id: "u1",
    name: "Lucas",
    emoji: "🕺",
    country: "🇧🇷",
    desc: "Always down for a dance & deep talk after.",
    languages: ["portuguese", "english"],
    languageLevels: {
      portuguese: "native",
      english: "fluent"
    },
    isBot: true,
    points: 0,
    residence: "cite",
    building: "Maison du Brésil",
  },
  {
    id: "u2",
    name: "Ana",
    emoji: "🍕",
    country: "🇮🇹",
    desc: "Chill foodie who loves spontaneous nights.",
    languages: ["italian", "english"],
    languageLevels: {
      italian: "native",
      english: "intermediate"
    },
    isBot: true,
    points: 0,
    residence: "cite",
    building: "Fondation Biermans-Lapôtre",
  },
  {
    id: "u3",
    name: "Max",
    emoji: "🎤",
    country: "🇩🇪",
    desc: "Here for Erasmus — got the playlist 🔥.",
    languages: ["german", "english"],
    languageLevels: {
      german: "native",
      english: "fluent",
      french: "intermediate"
    },
    isBot: true,
    points: 0,
    residence: "cite",
    building: "Maison Heinrich Heine",
  },
  {
    id: "u4",
    name: "Mitsu",
    username: "Mitsu",
    emoji: "🗼",
    country: "🇫🇷",
    desc: "French from Marseille. Speaks French, Spanish, and English.",
    city: "Marseille",
    languages: ["french", "spanish", "english"],
    languageLevels: {
      french: "native",
      spanish: "fluent",
      english: "intermediate"
    },
    isReal: true,
    points: 0,
    residence: "cite",
    building: "Fondation Deutsch de la Meurthe",
  },
  {
    id: "u5",
    name: "Zine",
    username: "Zine",
    emoji: "🕌",
    country: "🇹🇳",
    desc: "Tunisian. Speaks Arabic, French, and English.",
    city: "Tunis",
    languages: ["arabic", "french", "english"],
    languageLevels: {
      arabic: "native",
      french: "fluent",
      english: "fluent"
    },
    isReal: true,
    points: 0,
    residence: "cite",
    building: "Fondation Avicenne",
  },
  {
    id: "admin",
    name: "Admin",
    username: "admin",
    emoji: "🛠️",
    country: "🌍",
    desc: "System administrator",
    languages: ["english", "french"],
    languageLevels: {
      english: "native",
      french: "native"
    },
    isReal: true,
    points: 0,
    residence: "cite",
    building: "Administration",
  },
];

export default users;
