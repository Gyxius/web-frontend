// public-event.js
// Dynamically fetch and render event data based on event id in URL

// Helper to get query param
function getEventIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  // Support both ?id= and ?event= for event id
  return params.get('id') || params.get('event');
}

// Format date to human-friendly format
function formatHumanDate(dateStr, timeStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    
    // Format time if provided (convert 24h to 12h format)
    let timeFormatted = '';
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      timeFormatted = ` · ${hour12}:${minutes} ${ampm}`;
    }
    
    return `${dayName}, ${dayNum} ${monthName}${timeFormatted}`;
  } catch (e) {
    return dateStr + (timeStr ? ` at ${timeStr}` : '');
  }
}

const API_BASE = "https://fast-api-backend-qlyb.onrender.com";

function getLanguageEmoji(langName) {
  const langFlag = {
    'French': '🇫🇷',
    'English': '🇬🇧',
    'Polish': '🇵🇱',
    'Spanish': '🇪🇸',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Portuguese': '🇵🇹',
    'Chinese': '🇨🇳',
    'Japanese': '🇯🇵',
    'Korean': '🇰🇷',
    'Arabic': '🇸🇦',
  };
  return langFlag[langName] || '🗣️';
}

function getCountryEmoji(countryName) {
  const countryFlag = {
    'France': '🇫🇷',
    'Madagascar': '🇲🇬',
    'Poland': '🇵🇱',
    'Spain': '🇪🇸',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
    'Portugal': '🇵🇹',
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'Korea': '🇰🇷',
    'Saudi Arabia': '🇸🇦',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
  };
  return countryFlag[countryName] || '🌍';
}

async function fetchUserProfile(username) {
  try {
    const response = await fetch(`${API_BASE}/api/users/${username}/profile`);
    if (!response.ok) {
      console.log(`Profile not found for ${username}, using defaults`);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.log(`Error fetching profile for ${username}:`, e.message);
    return null;
  }
}

async function fetchEventData(eventId) {
  try {
    const response = await fetch(`${API_BASE}/api/events/${eventId}`);
    if (!response.ok) throw new Error('Event not found');
    const data = await response.json();
    
    // Fetch template event if this is based on a template
    let templateEvent = null;
    if (data.templateEventId) {
      try {
        const templateResponse = await fetch(`${API_BASE}/api/events/${data.templateEventId}`);
        if (templateResponse.ok) {
          templateEvent = await templateResponse.json();
        }
      } catch (e) {
        console.log('Could not fetch template event');
      }
    }
    
    // Fetch host profile
    const hostUsername = data.host?.name || data.createdBy;
    const hostProfile = hostUsername ? await fetchUserProfile(hostUsername) : null;
    
    // Fetch participant profiles
    const participantProfiles = await Promise.all(
      (data.participants || []).map(p => fetchUserProfile(p))
    );
    
    // Fetch chat messages
    let chatMessages = [];
    let messageUserProfiles = {};
    try {
      const chatResponse = await fetch(`${API_BASE}/api/chat/${eventId}`);
      if (chatResponse.ok) {
        chatMessages = await chatResponse.json();
        
        // Fetch profiles for all message senders
        const senderUsernames = [...new Set(chatMessages.map(m => m.username))];
        const senderProfiles = await Promise.all(
          senderUsernames.map(username => fetchUserProfile(username))
        );
        
        // Create a map of username to profile
        senderUsernames.forEach((username, idx) => {
          const profile = senderProfiles[idx];
          if (profile) {
            messageUserProfiles[username] = profile;
          }
        });
      }
    } catch (e) {
      console.error('Failed to fetch chat:', e);
    }
    
    // Build host display name with country flags
    let hostName = hostUsername || 'Host';
    if (hostProfile) {
      const countries = hostProfile.homeCountries || hostProfile.countriesFrom || [];
      const flags = countries.map(c => getCountryEmoji(c)).join(' ');
      hostName = `${hostProfile.name || hostUsername} ${flags}`;
    }
    
    // Build host languages string (without emoji flags, just text)
    let hostLanguages = '';
    if (hostProfile && hostProfile.languageLevels) {
      hostLanguages = Object.entries(hostProfile.languageLevels)
        .map(([lang, level]) => `${level} ${lang}`)
        .join(', ');
    }
    
    // Build attendees array with profile data
    const attendees = (data.participants || []).map((username, idx) => {
      const profile = participantProfiles[idx];
      if (!profile) {
        // Default emoji for users without profiles
        const defaultEmoji = username.toLowerCase() === 'james' ? '🙂' : '👤';
        return { emoji: defaultEmoji, name: username, meta: '', languageLevels: '', avatar: null };
      }
      
      // Get avatar URL from profile
      let avatar = null;
      if (profile.avatar) {
        if (profile.avatar.provider === 'dicebear') {
          avatar = `https://api.dicebear.com/7.x/${profile.avatar.style}/svg?seed=${profile.avatar.seed}`;
        } else if (profile.avatar.provider === 'custom' && profile.avatar.url) {
          avatar = profile.avatar.url;
        }
      }
      
      // Get emoji from profile avatar or use default
      let emoji = '😺';
      if (profile.avatar && profile.avatar.seed) {
        // Use first character or a default based on name
        emoji = username.toLowerCase() === 'james' ? '🙂' : '😺';
      }
      
      // Build attendee name with country flags
      const countries = profile.homeCountries || profile.countriesFrom || [];
      const flags = countries.map(c => getCountryEmoji(c)).join(' ');
      const displayName = `${profile.name || username} ${flags}`;
      
      // Build attendee meta (affiliation OR languages, not both displayed at same time)
      let meta = profile.university || '';
      // Store language levels for rendering
      let languageLevels = '';
      if (profile.languageLevels) {
        languageLevels = Object.entries(profile.languageLevels)
          .map(([lang, level]) => `${level} ${lang}`)
          .join(', ');
      }
      
      return { emoji, name: displayName, meta, languageLevels, avatar };
    });
    
    // Capitalize city name
    const city = data.location ? data.location.charAt(0).toUpperCase() + data.location.slice(1) : 'Paris';
    
    // Build venue short name with location prefix
    let venueShort = data.venue || 'Venue';
    if (templateEvent && templateEvent.location) {
      venueShort = `${templateEvent.location} · ${data.venue}`;
    }
    
    // Use template event name as main event title, current event name as title
    const mainEventTitle = templateEvent?.name || data.name || 'Event';
    const eventTitle = data.name || 'Event';
    
    // Use template category if available
    const category = templateEvent?.category || data.category || 'event';
    
    // Get host avatar URL
    let hostAvatar = null;
    if (hostProfile && hostProfile.avatar) {
      if (hostProfile.avatar.provider === 'dicebear') {
        hostAvatar = `https://api.dicebear.com/7.x/${hostProfile.avatar.style}/svg?seed=${hostProfile.avatar.seed}`;
      } else if (hostProfile.avatar.provider === 'custom' && hostProfile.avatar.url) {
        hostAvatar = hostProfile.avatar.url;
      }
    }
    
    // Transform backend data to match the expected format
    return {
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      city: city,
      venueName: data.venue || 'Venue',
      venueAddress: data.address || '',
      dateTime: `${data.date || ''} at ${data.time || ''}`,
      languages: (data.languages || []).map(lang => ({ emoji: getLanguageEmoji(lang), name: lang })),
      mainEventTitle: mainEventTitle,
      eventTitle: eventTitle,
      venueShort: venueShort,
      mainEventDate: data.date || '',
      category: category,
      attendees: attendees,
      description: data.description || 'No description',
      hostName: hostName,
      hostAffiliation: hostProfile?.university || '',
      hostLanguages: hostLanguages,
      hostAvatar: hostAvatar,
      coordinates: data.coordinates || null,
      chatMessages: chatMessages,
      messageUserProfiles: messageUserProfiles,
      eventId: eventId,
      hasTemplateEvent: !!data.templateEventId,
    };
  } catch (e) {
    console.error('Failed to fetch event:', e);
    // Fallback mock data for local development
    return {
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      city: 'Paris',
      venueName: 'Le Fleurus',
      venueAddress: '10, Boulevard Jourdan, Quartier du Parc-de-Montsouris, Paris 14e Arrondissement, Paris, Île-de-France, France métropolitaine, 75014, France',
      dateTime: '2025-11-05 at 20:30',
      languages: [
        { emoji: '🇫🇷', name: 'French' },
        { emoji: '🇬🇧', name: 'English' }
      ],
      mainEventTitle: 'Meetup',
      venueShort: 'Cité · Le Fleurus',
      mainEventDate: '2025-11-05',
      category: 'meetup',
      attendees: [
        { emoji: '🙂', name: 'james', meta: '', languageLevels: '' },
        { emoji: '😺', name: 'Kat 🇵🇱', meta: 'SGH', languageLevels: 'Fluent English, Native Polish, Beginner French' }
      ],
      description: 'A little meetup',
      hostName: 'Mitsu 🇫🇷 🇲🇬',
      hostAffiliation: 'Centrale X ESSEC',
      hostLanguages: 'Fluent English, Native French',
    };
  }
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text || '';
}

function setImage(selector, src) {
  const el = document.querySelector(selector);
  if (el) el.src = src;
}

function renderEvent(event) {
  // Extract date and time from dateTime string
  const dateTimeParts = (event.dateTime || '').split(' at ');
  const dateStr = dateTimeParts[0];
  const timeStr = dateTimeParts[1];
  
  // Set page title with human-friendly format
  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = event.eventTitle || event.mainEventTitle || 'Event';
  
  // Set human-friendly date and time
  const dateTimeEl = document.getElementById('eventDateTime');
  if (dateTimeEl) {
    dateTimeEl.textContent = formatHumanDate(dateStr, timeStr);
  }
  
  // Set location with city and venue
  const locationEl = document.getElementById('eventLocation');
  if (locationEl) {
    locationEl.textContent = `${event.city}${event.venueName ? ' · ' + event.venueName : ''}`;
  }
  
  // Set banner background
  const banner = document.getElementById('eventBanner');
  if (banner) {
    if (event.imageUrl) {
      banner.style.backgroundImage = `url('${event.imageUrl}')`;
    } else {
      banner.style.backgroundImage = "url('./images/default-banner.jpg')";
    }
  }
  setText('#style-d6n8e', event.city);
  setText('#style-bhvn2 > div:first-child', event.venueName);
  setText('#style-bhvn2 > div:last-child', event.venueAddress);
  // Map display if coordinates are present
  const mapDiv = document.getElementById('style-Qg8iX');
  if (mapDiv) {
    if (event.coordinates && event.coordinates.lat && event.coordinates.lng) {
      // Use Leaflet or static map image
      mapDiv.innerHTML = `<iframe width="100%" height="180" frameborder="0" style="border-radius:12px" src="https://www.openstreetmap.org/export/embed.html?bbox=${event.coordinates.lng-0.01}%2C${event.coordinates.lat-0.01}%2C${event.coordinates.lng+0.01}%2C${event.coordinates.lat+0.01}&amp;layer=mapnik&amp;marker=${event.coordinates.lat}%2C${event.coordinates.lng}" allowfullscreen></iframe>`;
    } else {
      mapDiv.innerHTML = '<div style="width:100%;height:100px;display:flex;align-items:center;justify-content:center;color:#888;">Map unavailable</div>';
    }
  }
  setText('#style-AUnJo + span', event.dateTime);
  setText('#style-m5hUl', '🗣️ Languages');
  // Languages badges
  const langs = event.languages || [];
  const langsContainer = document.getElementById('style-i5pDl');
  if (langsContainer) {
    langsContainer.innerHTML = langs.map(lang => `<div class="style-OBskZ"><span class="style-9m9Oq">${lang.emoji}</span><span>${lang.name}</span></div>`).join('');
  }
  
  // Show/Hide "Based on Main Event" section
  const basedOnSection = document.getElementById('style-mJ8XD');
  if (basedOnSection) {
    if (event.hasTemplateEvent) {
      basedOnSection.style.display = 'block';
      setText('#style-e4TOB', event.mainEventTitle || 'Event Title');
      setText('#style-wJgk8 > span:last-child', event.venueShort || 'Venue');
      setText('#style-1Ci39 > span:last-child', event.mainEventDate || 'Date');
      setText('#style-ONmlH > span:last-child', event.category || 'Category');
      setText('#style-18KL6 > span:last-child', `${(event.attendees && event.attendees.length) ? event.attendees.length : 0} attendees`);
    } else {
      basedOnSection.style.display = 'none';
    }
  }
  
  setText('#style-nEg6y', event.description || 'No description');
  setText('#style-yeQbe', event.hostName || 'Host');
  setText('#style-RGVi8 > div:first-child', event.hostAffiliation || '');
  
  // Update host avatar
  if (event.hostAvatar) {
    const hostAvatarImg = document.getElementById('style-mZ3Tj');
    if (hostAvatarImg) {
      hostAvatarImg.src = event.hostAvatar;
    }
  }
  
  // Render hostLanguages as plain text (no emoji badges)
  const hostLangsContainer = document.getElementById('style-9hJaP');
  if (hostLangsContainer) {
    hostLangsContainer.textContent = event.hostLanguages || '';
  }
  // Attendees
  const attendeesContainer = document.getElementById('style-3beqi');
  const attendeeCount = document.getElementById('style-Ccfcf');
  if (attendeesContainer) {
    const count = event.attendees ? event.attendees.length : 0;
    if (attendeeCount) {
      attendeeCount.textContent = `🧃 Attendees (${count})`;
    }
    
    if (event.attendees && event.attendees.length) {
      attendeesContainer.innerHTML = event.attendees.map(att => {
        // Different structure for avatar vs emoji
        if (att.avatar) {
          // Has avatar - use style-Ton9s wrapper with style-NRy22 for avatar
          return `
            <div class="style-Ton9s">
              <div class="style-NRy22"><img alt="avatar" src="${att.avatar}" class="style-w4eFL"></div>
              <div class="style-yRx2V">
                <div class="style-DvGnR">${att.name}</div>
                <div class="style-nWhD4">
                  ${att.meta ? `<div>${att.meta}</div>` : ''}
                  ${att.languageLevels ? `<div class="style-Zm9pG">${att.languageLevels}</div>` : ''}
                </div>
              </div>
            </div>
          `;
        } else {
          // No avatar - use style-rbjVo wrapper with style-YsFbi for emoji
          return `
            <div class="style-rbjVo">
              <div class="style-YsFbi">${att.emoji || '🙂'}</div>
              <div class="style-U3Bwv">
                <div class="style-ttDWg">${att.name}</div>
                <div class="style-lpVfd">${att.meta || ''}</div>
              </div>
            </div>
          `;
        }
      }).join('');
    } else {
      attendeesContainer.innerHTML = '<div style="color:#888;padding:12px;">No attendees yet</div>';
    }
    
    // Add click handlers to attendees after rendering
    setTimeout(() => addAttendeeClickHandlers(), 100);
  }
  
  // Chat messages
  const chatContainer = document.getElementById('style-MWXHT');
  if (chatContainer && event.chatMessages) {
    // Get current logged-in user from localStorage
    let currentUsername = null;
    try {
      const sessionUser = localStorage.getItem('sessionUser');
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        currentUsername = user.username || user.name || user;
      }
    } catch (e) {
      console.log('Could not parse session user');
    }
    
    if (event.chatMessages.length > 0) {
      chatContainer.innerHTML = event.chatMessages.map(msg => {
        // Determine if message is from current logged-in user
        const isCurrentUser = currentUsername && msg.username === currentUsername;
        
        // Get avatar for message sender
        let avatarUrl = null;
        const userProfile = event.messageUserProfiles && event.messageUserProfiles[msg.username];
        if (userProfile && userProfile.avatar) {
          if (userProfile.avatar.provider === 'dicebear') {
            avatarUrl = `https://api.dicebear.com/7.x/${userProfile.avatar.style}/svg?seed=${userProfile.avatar.seed}`;
          } else if (userProfile.avatar.provider === 'custom' && userProfile.avatar.url) {
            avatarUrl = userProfile.avatar.url;
          }
        }
        // Fallback to default avatar if none found
        if (!avatarUrl) {
          avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`;
        }
        
        if (isCurrentUser) {
          // Right-aligned message with user's avatar
          return `
            <div style="display:flex;justify-content:flex-end;margin-bottom:12px;gap:8px;">
              <div style="background:#58CC02;color:white;padding:12px 16px;border-radius:18px 18px 4px 18px;max-width:70%;">
                <span style="font-weight:600;margin-right:8px;">You</span>${msg.message}
              </div>
              <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;">
                <img alt="avatar" src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;">
              </div>
            </div>
          `;
        } else {
          // Left-aligned message with sender's avatar
          return `
            <div style="display:flex;margin-bottom:12px;gap:8px;">
              <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;">
                <img alt="avatar" src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;">
              </div>
              <div style="background:#f5f5f5;padding:12px 16px;border-radius:18px 18px 18px 4px;max-width:70%;">
                <span style="font-weight:600;margin-right:8px;">${msg.username}</span>${msg.message}
              </div>
            </div>
          `;
        }
      }).join('');
    } else {
      chatContainer.innerHTML = '<div style="color:#888;padding:12px;text-align:center;">No messages yet</div>';
    }
  }
}

async function main() {
  // Show loading state
  const loadingState = document.getElementById('loadingState');
  const contentDiv = document.getElementById('style-Zwicg');
  
  if (loadingState) loadingState.style.display = 'block';
  if (contentDiv) contentDiv.style.display = 'none';
  
  // Check if user is logged in - if so, redirect to main app
  try {
    const sessionUser = localStorage.getItem('sessionUser');
    if (sessionUser) {
      const user = JSON.parse(sessionUser);
      // User is logged in, redirect to main app with event ID
      const eventId = getEventIdFromUrl();
      if (eventId) {
        window.location.href = `/?event=${eventId}`;
        return;
      } else {
        window.location.href = '/';
        return;
      }
    }
  } catch (e) {
    console.log('Error checking session user:', e);
  }
  
  const eventId = getEventIdFromUrl();
  console.log('Event ID from URL:', eventId);
  let event;
  if (!eventId) {
    console.log('No event ID, using mock data');
    // Use fallback mock data if no id
    event = await fetchEventData('mock');
  } else {
    try {
      console.log('Fetching event:', eventId);
      event = await fetchEventData(eventId);
      console.log('Event data:', event);
    } catch (e) {
      console.error('Error fetching event:', e);
      event = await fetchEventData('mock');
    }
  }
  renderEvent(event);
  
  // Hide loading state and show content
  if (loadingState) loadingState.style.display = 'none';
  if (contentDiv) contentDiv.style.display = 'block';
  
  // Setup registration modal handlers
  setupRegistrationHandlers();
}

// Show registration modal
function showRegistrationModal() {
  const modal = document.getElementById('registrationModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Hide registration modal
function hideRegistrationModal() {
  const modal = document.getElementById('registrationModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Setup all registration-related click handlers
function setupRegistrationHandlers() {
  // Close modal button
  const closeBtn = document.getElementById('closeModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideRegistrationModal);
  }
  
  // Go to login button
  const loginBtn = document.getElementById('goToLogin');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      // Redirect to main app login page
      window.location.href = '/';
    });
  }
  
  // Share button
  const shareBtn = document.getElementById('shareButton');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const eventId = getEventIdFromUrl();
      const shareUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.querySelector('h1')?.textContent || 'Event',
            text: 'Check out this event!',
            url: shareUrl
          });
        } catch (err) {
          console.log('Share cancelled or failed:', err);
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
          const originalText = shareBtn.textContent;
          shareBtn.textContent = '✓ Link Copied!';
          setTimeout(() => {
            shareBtn.textContent = originalText;
          }, 2000);
        });
      }
    });
  }
  
  // Send message button
  const sendBtn = document.getElementById('style-PSWPF');
  if (sendBtn) {
    sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showRegistrationModal();
    });
  }
  
  // Message input field
  const messageInput = document.getElementById('style-TNmnM');
  if (messageInput) {
    messageInput.addEventListener('focus', () => {
      showRegistrationModal();
      messageInput.blur();
    });
  }
  
  // Host profile click
  const hostProfile = document.getElementById('style-eJxvq');
  if (hostProfile) {
    hostProfile.style.cursor = 'pointer';
    hostProfile.addEventListener('click', showRegistrationModal);
  }
  
  // Close modal when clicking outside
  const modal = document.getElementById('registrationModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideRegistrationModal();
      }
    });
  }
}

// Add click handlers to attendees (called after rendering)
function addAttendeeClickHandlers() {
  const attendees = document.querySelectorAll('.style-Ton9s, .style-rbjVo');
  attendees.forEach(attendee => {
    attendee.style.cursor = 'pointer';
    attendee.addEventListener('click', showRegistrationModal);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  main();
});
