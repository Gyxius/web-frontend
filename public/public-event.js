// public-event.js
// Dynamically fetch and render event data based on event id in URL

// Helper to get query param
function getEventIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchEventData(eventId) {
  // TODO: Replace with your backend API endpoint
  const response = await fetch(`/api/events/${eventId}`);
  if (!response.ok) throw new Error('Event not found');
  return response.json();
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
  setText('#style-d6n8e', event.city);
  setText('#style-bhvn2 > div:first-child', event.venueName);
  setText('#style-bhvn2 > div:last-child', event.venueAddress);
  setText('#style-AUnJo + span', event.dateTime);
  setText('#style-m5hUl', '🗣️ Languages');
  // Languages badges
  const langs = event.languages || [];
  const langsContainer = document.getElementById('style-i5pDl');
  if (langsContainer) {
    langsContainer.innerHTML = langs.map(lang => `<div class="style-OBskZ"><span class="style-9m9Oq">${lang.emoji}</span><span>${lang.name}</span></div>`).join('');
  }
  setText('#style-e4TOB', event.mainEventTitle);
  setText('#style-wJgk8 > span:last-child', event.venueShort);
  setText('#style-1Ci39 > span:last-child', event.mainEventDate);
  setText('#style-ONmlH > span:last-child', event.category);
  setText('#style-18KL6 > span:last-child', `${event.attendees.length} attendees`);
  setText('#style-nEg6y', event.description);
  setText('#style-yeQbe', event.hostName);
  setText('#style-RGVi8 > div:first-child', event.hostAffiliation);
  setText('#style-9hJaP', event.hostLanguages);
  // Attendees
  const attendeesContainer = document.getElementById('style-3beqi');
  if (attendeesContainer) {
    attendeesContainer.innerHTML = event.attendees.map(att => `
      <div class="style-rbjVo">
        <div class="style-YsFbi">${att.emoji || ''}</div>
        <div class="style-U3Bwv">
          <div class="style-ttDWg">${att.name}</div>
          <div class="style-lpVfd">${att.meta || ''}</div>
        </div>
      </div>
    `).join('');
  }
}

async function main() {
  const eventId = getEventIdFromUrl();
  if (!eventId) return;
  try {
    const event = await fetchEventData(eventId);
    renderEvent(event);
  } catch (e) {
    document.body.innerHTML = '<h2>Event not found</h2>';
  }
}

document.addEventListener('DOMContentLoaded', main);
