// public-event.js
// Dynamically fetch and render event data based on event id in URL

// Helper to get query param
function getEventIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchEventData(eventId) {
  // TODO: Replace with your backend API endpoint
  try {
    const response = await fetch(`/api/events/${eventId}`);
    if (!response.ok) throw new Error('Event not found');
    return await response.json();
  } catch (e) {
    // Fallback mock data for local development
    return {
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Example: real event image URL
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
        { emoji: '🙂', name: 'james', meta: '' },
        { emoji: '😺', name: 'Kat 🇵🇱', meta: 'SGH' }
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
  // Map placeholder if no map data
  const mapDiv = document.getElementById('style-Qg8iX');
  if (mapDiv && !event.venueLatLng) {
    mapDiv.innerHTML = '<div style="width:100%;height:100px;display:flex;align-items:center;justify-content:center;color:#888;">Map unavailable</div>';
  }
  setText('#style-AUnJo + span', event.dateTime);
  setText('#style-m5hUl', '🗣️ Languages');
  // Languages badges
  const langs = event.languages || [];
  const langsContainer = document.getElementById('style-i5pDl');
  if (langsContainer) {
    langsContainer.innerHTML = langs.map(lang => `<div class="style-OBskZ"><span class="style-9m9Oq">${lang.emoji}</span><span>${lang.name}</span></div>`).join('');
  }
  setText('#style-e4TOB', event.mainEventTitle || 'Event Title');
  setText('#style-wJgk8 > span:last-child', event.venueShort || 'Venue');
  setText('#style-1Ci39 > span:last-child', event.mainEventDate || 'Date');
  setText('#style-ONmlH > span:last-child', event.category || 'Category');
  setText('#style-18KL6 > span:last-child', `${(event.attendees && event.attendees.length) ? event.attendees.length : 0} attendees`);
  setText('#style-nEg6y', event.description || 'No description');
  setText('#style-yeQbe', event.hostName || 'Host');
  setText('#style-RGVi8 > div:first-child', event.hostAffiliation || '');
  setText('#style-9hJaP', event.hostLanguages || '');
  // Attendees
  const attendeesContainer = document.getElementById('style-3beqi');
  if (attendeesContainer) {
    if (event.attendees && event.attendees.length) {
      attendeesContainer.innerHTML = event.attendees.map(att => `
        <div class="style-rbjVo">
          <div class="style-YsFbi">${att.emoji || ''}</div>
          <div class="style-U3Bwv">
            <div class="style-ttDWg">${att.name}</div>
            <div class="style-lpVfd">${att.meta || ''}</div>
          </div>
        </div>
      `).join('');
    } else {
      attendeesContainer.innerHTML = '<div style="color:#888;padding:12px;">No attendees yet</div>';
    }
  }
}

async function main() {
  const eventId = getEventIdFromUrl();
  let event;
  if (!eventId) {
    // Use fallback mock data if no id
    event = await fetchEventData('mock');
  } else {
    try {
      event = await fetchEventData(eventId);
    } catch (e) {
      event = await fetchEventData('mock');
    }
  }
  renderEvent(event);
}

document.addEventListener('DOMContentLoaded', main);
