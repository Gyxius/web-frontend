// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id') || urlParams.get('event');

// Country code to flag emoji mapping
const countryFlags = {
  'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺', 'NZ': '🇳🇿',
  'IE': '🇮🇪', 'ZA': '🇿🇦', 'IN': '🇮🇳', 'SG': '🇸🇬', 'MY': '🇲🇾',
  'PH': '🇵🇭', 'HK': '🇭🇰', 'PK': '🇵🇰', 'NG': '🇳🇬', 'KE': '🇰🇪',
  'GH': '🇬🇭', 'UG': '🇺🇬', 'TZ': '🇹🇿', 'ZW': '🇿🇼', 'JM': '🇯🇲',
  'TT': '🇹🇹', 'BB': '🇧🇧', 'GY': '🇬🇾', 'BS': '🇧🇸', 'BZ': '🇧🇿',
  'ES': '🇪🇸', 'MX': '🇲🇽', 'AR': '🇦🇷', 'CO': '🇨🇴', 'PE': '🇵🇪',
  'VE': '🇻🇪', 'CL': '🇨🇱', 'EC': '🇪🇨', 'GT': '🇬🇹', 'CU': '🇨🇺',
  'BO': '🇧🇴', 'DO': '🇩🇴', 'HN': '🇭🇳', 'PY': '🇵🇾', 'SV': '🇸🇻',
  'NI': '🇳🇮', 'CR': '🇨🇷', 'PA': '🇵🇦', 'UY': '🇺🇾', 'PR': '🇵🇷',
  'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭', 'LU': '🇱🇺', 'MC': '🇲🇨',
  'CI': '🇨🇮', 'SN': '🇸🇳', 'ML': '🇲🇱', 'BF': '🇧🇫', 'NE': '🇳🇪',
  'TD': '🇹🇩', 'MG': '🇲🇬', 'CM': '🇨🇲', 'CG': '🇨🇬', 'GA': '🇬🇦',
  'DJ': '🇩🇯', 'GN': '🇬🇳', 'RW': '🇷🇼', 'BI': '🇧🇮', 'HT': '🇭🇹',
  'PT': '🇵🇹', 'BR': '🇧🇷', 'AO': '🇦🇴', 'MZ': '🇲🇿', 'GW': '🇬🇼',
  'TL': '🇹🇱', 'GQ': '🇬🇶', 'ST': '🇸🇹', 'CV': '🇨🇻', 'MO': '🇲🇴',
  'CN': '🇨🇳', 'TW': '🇹🇼', 'DE': '🇩🇪', 'AT': '🇦🇹', 'LI': '🇱🇮',
  'IT': '🇮🇹', 'SM': '🇸🇲', 'VA': '🇻🇦', 'NL': '🇳🇱', 'SR': '🇸🇷',
  'AW': '🇦🇼', 'CW': '🇨🇼', 'SX': '🇸🇽', 'RU': '🇷🇺', 'BY': '🇧🇾',
  'KZ': '🇰🇿', 'KG': '🇰🇬', 'JP': '🇯🇵', 'KR': '🇰🇷', 'KP': '🇰🇵',
  'SA': '🇸🇦', 'AE': '🇦🇪', 'IQ': '🇮🇶', 'IL': '🇮🇱', 'PS': '🇵🇸',
  'TR': '🇹🇷', 'GR': '🇬🇷', 'CY': '🇨🇾', 'PL': '🇵🇱', 'UA': '🇺🇦',
  'CZ': '🇨🇿', 'SK': '🇸🇰', 'HU': '🇭🇺', 'RO': '🇷🇴', 'BG': '🇧🇬',
  'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'IS': '🇮🇸',
  'IR': '🇮🇷', 'AF': '🇦🇫', 'TJ': '🇹🇯', 'TH': '🇹🇭', 'VN': '🇻🇳',
  'LA': '🇱🇦', 'KH': '🇰🇭', 'MM': '🇲🇲', 'ID': '🇮🇩', 'BN': '🇧🇳',
};

// Language to flag emoji mapping
const languageFlags = {
  'English': '🇬🇧', 'Spanish': '🇪🇸', 'French': '🇫🇷', 'German': '🇩🇪',
  'Italian': '🇮🇹', 'Portuguese': '🇵🇹', 'Russian': '🇷🇺', 'Chinese': '🇨🇳',
  'Japanese': '🇯🇵', 'Korean': '🇰🇷', 'Arabic': '🇸🇦', 'Hindi': '🇮🇳',
  'Bengali': '🇧🇩', 'Turkish': '🇹🇷', 'Vietnamese': '🇻🇳', 'Polish': '🇵🇱',
  'Ukrainian': '🇺🇦', 'Dutch': '🇳🇱', 'Greek': '🇬🇷', 'Swedish': '🇸🇪',
  'Czech': '🇨🇿', 'Romanian': '🇷🇴', 'Hungarian': '🇭🇺', 'Thai': '🇹🇭',
  'Hebrew': '🇮🇱', 'Indonesian': '🇮🇩', 'Malay': '🇲🇾', 'Filipino': '🇵🇭',
};

function getCountryEmoji(countryCode) {
  return countryFlags[countryCode?.toUpperCase()] || '🌍';
}

function getLanguageEmoji(language) {
  return languageFlags[language] || '🗣️';
}

function formatLanguagesForTitle(languages) {
  if (!languages || languages.length === 0) return '';
  
  const sorted = [...languages].sort((a, b) => {
    const proficiency = { Native: 3, Fluent: 2, Conversational: 1 };
    return (proficiency[b.proficiency] || 0) - (proficiency[a.proficiency] || 0);
  });
  
  return sorted.map(lang => {
    const emoji = getLanguageEmoji(lang.language);
    const proficiency = lang.proficiency;
    return `${emoji} ${lang.language} (${proficiency})`;
  }).join(' • ');
}

async function fetchUserProfile(username) {
  if (!username || username === 'Anonymous') return null;
  
  try {
    const response = await fetch(`https://fast-api-backend-qlyb.onrender.com/api/users/${username}/profile`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile for', username, error);
    return null;
  }
}

function getAvatarUrl(username, profile) {
  if (profile?.avatar) {
    return profile.avatar;
  }
  
  // Use DiceBear API with username as seed
  const seed = encodeURIComponent(username || 'default');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

async function fetchEventData() {
  if (!eventId) {
    document.getElementById('event-title').textContent = 'Event ID not found';
    return;
  }
  
  try {
    console.log('Fetching event:', eventId);
    const response = await fetch(`https://fast-api-backend-qlyb.onrender.com/api/events/${eventId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const event = await response.json();
    console.log('Event data:', event);
    
    // Fetch template event if this is a custom event
    let mainEvent = event;
    if (event.template_event_id) {
      console.log('Fetching template event:', event.template_event_id);
      try {
        const templateResponse = await fetch(`https://fast-api-backend-qlyb.onrender.com/api/events/${event.template_event_id}`);
        if (templateResponse.ok) {
          mainEvent = await templateResponse.json();
          console.log('Template event:', mainEvent);
        }
      } catch (error) {
        console.error('Error fetching template event:', error);
      }
    }
    
    // Fetch host profile
    const hostProfile = await fetchUserProfile(event.host);
    console.log('Host profile:', hostProfile);
    
    // Fetch attendee profiles
    const attendeeProfiles = {};
    if (event.attendees && event.attendees.length > 0) {
      for (const attendee of event.attendees) {
        if (attendee !== 'Anonymous') {
          const profile = await fetchUserProfile(attendee);
          if (profile) {
            attendeeProfiles[attendee] = profile;
          }
        }
      }
    }
    console.log('Attendee profiles:', attendeeProfiles);
    
    renderEvent(event, mainEvent, hostProfile, attendeeProfiles);
    
  } catch (error) {
    console.error('Error loading event:', error);
    document.getElementById('event-title').textContent = 'Failed to load event';
  }
}

function renderEvent(event, mainEvent, hostProfile, attendeeProfiles) {
  // Set title
  document.getElementById('event-title').textContent = mainEvent.title || event.title;
  
  // Set banner image
  const banner = mainEvent.banner || event.banner;
  if (banner) {
    document.getElementById('event-image').style.backgroundImage = `url(${banner})`;
  } else {
    document.getElementById('event-image').style.display = 'none';
  }
  
  // Set languages
  if (event.languages && event.languages.length > 0) {
    document.getElementById('languages-section').style.display = 'block';
    const languagesList = document.getElementById('languages-list');
    languagesList.innerHTML = event.languages.map(lang => `
      <div class="language-badge">
        <span class="language-flag">${getLanguageEmoji(lang)}</span>
        <span class="language-name">${lang}</span>
      </div>
    `).join('');
  }
  
  // Set host info
  const hostName = event.host || 'Anonymous';
  const hostEmoji = hostProfile?.emoji || '🙂';
  const hostCountry = hostProfile?.country ? getCountryEmoji(hostProfile.country) : '';
  
  document.getElementById('host-name').textContent = `${hostEmoji} ${hostName} ${hostCountry}`;
  
  // Show bio if available
  if (hostProfile?.bio) {
    const bioElement = document.getElementById('host-bio');
    bioElement.textContent = `"${hostProfile.bio}"`;
    bioElement.style.display = 'block';
  }
  
  // Set location
  const locationPrimary = event.location || 'Location TBA';
  document.getElementById('location-primary').textContent = locationPrimary;
  
  if (event.venue_name) {
    document.getElementById('venue-name').textContent = event.venue_name;
  } else {
    document.getElementById('venue-name').style.display = 'none';
  }
  
  if (event.venue_address) {
    document.getElementById('venue-address').textContent = event.venue_address;
  } else {
    document.getElementById('venue-address').style.display = 'none';
  }
  
  // Set datetime
  const date = new Date(event.datetime);
  const dateString = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeString = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  document.getElementById('event-datetime').textContent = `${dateString} at ${timeString}`;
  
  // Set category
  const category = mainEvent.category || event.category;
  if (category) {
    document.getElementById('event-category').textContent = category;
  } else {
    document.getElementById('category-detail').style.display = 'none';
  }
  
  // Set description
  const description = event.description || mainEvent.description;
  if (description) {
    document.getElementById('event-description').textContent = description;
  } else {
    document.getElementById('description-section').style.display = 'none';
  }
  
  // Set attendees
  const attendees = event.attendees || [];
  const participantsLabel = document.getElementById('participants-label');
  participantsLabel.textContent = `👥 PARTICIPANTS (${attendees.length})`;
  
  if (attendees.length > 0) {
    const participantsList = document.getElementById('participants-list');
    participantsList.innerHTML = attendees.slice(0, 10).map(username => {
      const profile = attendeeProfiles[username];
      
      // Use emoji from profile or default
      const emoji = profile?.emoji || '🙂';
      const displayName = username;
      
      return `
        <div class="participant-badge">
          ${emoji} ${displayName}
        </div>
      `;
    }).join('');
    
    // Add "+X more" if there are more than 10
    if (attendees.length > 10) {
      participantsList.innerHTML += `
        <div class="participant-badge" style="color: #6B7280;">
          +${attendees.length - 10} more
        </div>
      `;
    }
  } else {
    document.getElementById('participants-section').style.display = 'none';
  }
  
  // Setup share button
  const shareButton = document.getElementById('share-button');
  shareButton.textContent = '📤';
  shareButton.onclick = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: mainEvent.title || event.title,
        text: `Check out this event: ${mainEvent.title || event.title}`,
        url: url
      }).catch(err => console.log('Share cancelled'));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  };
}

// Load event on page load
fetchEventData();

// Refresh every 10 seconds for real-time updates
setInterval(fetchEventData, 10000);
