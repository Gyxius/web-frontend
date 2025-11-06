// Utility to convert country names to flag emojis
// Uses Unicode regional indicator symbols (offset from ASCII by 127397)

const COUNTRY_TO_CODE = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD", "Angola": "AO",
  "Antigua and Barbuda": "AG", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT",
  "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB",
  "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bhutan": "BT",
  "Bolivia": "BO", "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR", "Brunei": "BN",
  "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI", "Cabo Verde": "CV", "Cambodia": "KH",
  "Cameroon": "CM", "Canada": "CA", "Central African Republic": "CF", "Chad": "TD", "Chile": "CL",
  "China": "CN", "Colombia": "CO", "Comoros": "KM", "Congo (Congo-Brazzaville)": "CG",
  "Costa Rica": "CR", "Côte d'Ivoire": "CI", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY",
  "Czechia (Czech Republic)": "CZ", "Czech Republic": "CZ", "Czechia": "CZ",
  "Democratic Republic of the Congo": "CD", "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM",
  "Dominican Republic": "DO", "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV",
  "Equatorial Guinea": "GQ", "Eritrea": "ER", "Estonia": "EE", "Eswatini (fmr. Swaziland)": "SZ",
  "Swaziland": "SZ", "Eswatini": "SZ", "Ethiopia": "ET", "Fiji": "FJ", "Finland": "FI",
  "France": "FR", "Gabon": "GA", "Gambia": "GM", "Georgia": "GE", "Germany": "DE",
  "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT", "Guinea": "GN",
  "Guinea-Bissau": "GW", "Guyana": "GY", "Haiti": "HT", "Honduras": "HN", "Hungary": "HU",
  "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ",
  "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Jamaica": "JM", "Japan": "JP",
  "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI", "Kuwait": "KW",
  "Kyrgyzstan": "KG", "Laos": "LA", "Latvia": "LV", "Lebanon": "LB", "Lesotho": "LS",
  "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU",
  "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV", "Mali": "ML",
  "Malta": "MT", "Marshall Islands": "MH", "Mauritania": "MR", "Mauritius": "MU", "Mexico": "MX",
  "Micronesia": "FM", "Moldova": "MD", "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME",
  "Morocco": "MA", "Mozambique": "MZ", "Myanmar (Burma)": "MM", "Myanmar": "MM", "Burma": "MM",
  "Namibia": "NA", "Nauru": "NR", "Nepal": "NP", "Netherlands": "NL", "New Zealand": "NZ",
  "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", "North Korea": "KP", "North Macedonia": "MK",
  "Norway": "NO", "Oman": "OM", "Pakistan": "PK", "Palau": "PW", "Panama": "PA",
  "Papua New Guinea": "PG", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL",
  "Portugal": "PT", "Qatar": "QA", "Romania": "RO", "Russia": "RU", "Rwanda": "RW",
  "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", "Saint Vincent and the Grenadines": "VC",
  "Samoa": "WS", "San Marino": "SM", "Sao Tome and Principe": "ST", "Saudi Arabia": "SA",
  "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL", "Singapore": "SG",
  "Slovakia": "SK", "Slovenia": "SI", "Solomon Islands": "SB", "Somalia": "SO", "South Africa": "ZA",
  "South Korea": "KR", "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD",
  "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW",
  "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Timor-Leste": "TL", "Togo": "TG",
  "Tonga": "TO", "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR", "Turkmenistan": "TM",
  "Tuvalu": "TV", "Uganda": "UG", "Ukraine": "UA", "United Arab Emirates": "AE",
  "United Kingdom": "GB", "UK": "GB", "United States": "US", "USA": "US", "Uruguay": "UY",
  "Uzbekistan": "UZ", "Vanuatu": "VU", "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN",
  "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW"
};

/**
 * Convert a country name to a flag emoji
 * @param {string} countryName - Full country name (e.g., "France", "United States")
 * @returns {string} - Flag emoji (e.g., "🇫🇷", "🇺🇸") or empty string if not found
 */
// Build a case-insensitive normalized lookup for resilience
const NORMALIZED_KEY_MAP = Object.fromEntries(
  Object.keys(COUNTRY_TO_CODE).map((k) => [
    normalizeCountryName(k),
    COUNTRY_TO_CODE[k],
  ])
);

function stripRegionalIndicators(str) {
  // Remove any Unicode Regional Indicator Symbols (used by flag emojis)
  return str.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "");
}

function normalizeCountryName(input) {
  if (!input) return "";
  let s = String(input).trim();
  // Remove flag emojis and most common surrounding symbols
  s = stripRegionalIndicators(s)
    .replace(/[\u200d\ufe0f]/g, "") // remove ZWJ/variation selectors
    .replace(/[()[\]]/g, " ") // remove brackets and parentheses
    .replace(/\s{2,}/g, " ") // collapse spaces
    .trim();
  // Lowercase for key matching; preserve base letters only for robustness
  const lower = s.toLowerCase();
  // Basic aliases cleanup
  const aliases = {
    "united states of america": "united states",
    "cote d’ivoire": "côte d'ivoire",
    "cote d'ivoire": "côte d'ivoire",
    "myanmar": "myanmar (burma)",
    "burma": "myanmar (burma)",
    "swaziland": "eswatini (fmr. swaziland)",
    "eswatini": "eswatini (fmr. swaziland)",
    "uk": "united kingdom",
    "u.k.": "united kingdom",
    "u.s.": "united states",
    "u.s.a.": "united states",
  };
  return aliases[lower] || lower;
}

export function getCountryFlag(countryName) {
  if (!countryName) return "";
  // Try exact first
  const exact = COUNTRY_TO_CODE[String(countryName).trim()];
  let code = exact;
  if (!code) {
    // Try normalized, case-insensitive
    const norm = normalizeCountryName(countryName);
    code = NORMALIZED_KEY_MAP[norm];
  }
  if (!code) return "";

  // Convert ISO code to flag emoji using regional indicator symbols
  const codePoints = [...code].map((char) => 0x1F1E6 + (char.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

/**
 * Get user display string with flag (if homeCountry available)
 * @param {object} user - User profile object with name, homeCountry, or country fields
 * @returns {string} - "Username 🇫🇷" or just "Username" if no country
 */
export function getUserDisplayName(user) {
  if (!user) return "";
  const name = user.name || user.username || "";
  
  // Show all homeCountries if array exists, else fallback
  let flags = [];
  if (Array.isArray(user.homeCountries) && user.homeCountries.length > 0) {
    flags = user.homeCountries.map(getCountryFlag).filter(Boolean);
  } else {
    const homeCountry = user.homeCountry || (user.countriesFrom && user.countriesFrom[0]) || user.country;
    const flag = getCountryFlag(homeCountry);
    if (flag) flags = [flag];
  }
  return flags.length ? `${name} ${flags.join(' ')}` : name;
}
