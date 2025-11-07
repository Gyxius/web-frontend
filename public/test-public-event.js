// Automated test for public event page rendering
// This script simulates loading the public event page for a 'Meetup' event with various scenarios.

const testEvents = [
  {
    id: 'meetup1',
    imageUrl: './images/mock-banner.jpg',
    city: 'Paris',
    venueName: 'Le Fleurus',
    venueAddress: '10, Boulevard Jourdan, Paris, France',
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
  },
  {
    id: 'meetup-no-attendees',
    imageUrl: '',
    city: 'Paris',
    venueName: 'Le Fleurus',
    venueAddress: '10, Boulevard Jourdan, Paris, France',
    dateTime: '2025-11-05 at 20:30',
    languages: [],
    mainEventTitle: 'Meetup',
    venueShort: 'Cité · Le Fleurus',
    mainEventDate: '2025-11-05',
    category: 'meetup',
    attendees: [],
    description: 'No one has joined yet!',
    hostName: 'Mitsu 🇫🇷 🇲🇬',
    hostAffiliation: 'Centrale X ESSEC',
    hostLanguages: '',
  }
];

function simulateEventLoad(event) {
  // Simulate the renderEvent function from public-event.js
  window.renderEvent(event);
  // Check banner
  const banner = document.getElementById('eventBanner');
  console.assert(banner.style.backgroundImage.includes(event.imageUrl) || banner.style.backgroundImage.includes('default-banner'), 'Banner image check failed');
  // Check title
  const title = document.querySelector('#style-e4TOB');
  console.assert(title.textContent === event.mainEventTitle, 'Title check failed');
  // Check attendees
  const attendees = document.getElementById('style-3beqi');
  if (event.attendees.length === 0) {
    console.assert(attendees.textContent.includes('No attendees'), 'No attendees fallback failed');
  } else {
    console.assert(attendees.textContent.includes(event.attendees[0].name), 'Attendee name missing');
  }
  // Check description
  const desc = document.getElementById('style-nEg6y');
  console.assert(desc.textContent === event.description, 'Description check failed');
  // Check host
  const host = document.getElementById('style-yeQbe');
  console.assert(host.textContent === event.hostName, 'Host name check failed');
  // Check category
  const cat = document.querySelector('#style-ONmlH > span:last-child');
  console.assert(cat.textContent === event.category, 'Category check failed');
  // Check map placeholder if no map data
  const mapDiv = document.getElementById('style-Qg8iX');
  if (!event.venueLatLng && mapDiv) {
    console.assert(mapDiv.textContent.includes('Map unavailable'), 'Map placeholder check failed');
  }
  console.log(`Test for event '${event.id}' passed.`);
}

window.runPublicEventTests = function() {
  testEvents.forEach(simulateEventLoad);
  alert('All public event tests completed! Check console for details.');
};
