// Utility to remove specific event from localStorage
// Run this in browser console: clearSpecificEvent("Language Exchange", "2025-11-02")

window.clearSpecificEvent = (eventName, eventDate) => {
  // Clear from adminEvents
  const adminEvents = localStorage.getItem("adminEvents");
  if (adminEvents) {
    const events = JSON.parse(adminEvents);
    const filtered = events.filter(e => !(e.name === eventName && e.date === eventDate));
    localStorage.setItem("adminEvents", JSON.stringify(filtered));
    console.log(`Removed ${events.length - filtered.length} event(s) from adminEvents`);
  }

  // Clear from all user's joinedEvents
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("joinedEvents_")) {
      const userEvents = JSON.parse(localStorage.getItem(key));
      const filtered = userEvents.filter(e => !(e.name === eventName && e.date === eventDate));
      if (filtered.length !== userEvents.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        console.log(`Removed from ${key}`);
      }
    }
  });

  // Clear from userEvents
  const userEvents = localStorage.getItem("userEvents");
  if (userEvents) {
    const events = JSON.parse(userEvents);
    Object.keys(events).forEach(username => {
      events[username] = events[username].filter(e => !(e.name === eventName && e.date === eventDate));
    });
    localStorage.setItem("userEvents", JSON.stringify(events));
  }

  // Clear chat history for this event
  const chatHistory = localStorage.getItem("chatHistory");
  if (chatHistory) {
    const chats = JSON.parse(chatHistory);
    Object.keys(chats).forEach(eventId => {
      const event = JSON.parse(localStorage.getItem("adminEvents") || "[]").find(e => e.id == eventId);
      if (event && event.name === eventName && event.date === eventDate) {
        delete chats[eventId];
      }
    });
    localStorage.setItem("chatHistory", JSON.stringify(chats));
  }

  console.log("✅ Event removed! Refresh the page.");
  window.location.reload();
};

// Auto-run to remove Language Exchange event
if (typeof window !== 'undefined') {
  console.log("To remove Language Exchange event, run: clearSpecificEvent('Language Exchange', '2025-11-02')");
}
