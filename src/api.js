// API utility functions for communicating with FastAPI backend

const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";

// ===== EVENT ENDPOINTS =====

export const getAllEvents = async () => {
  const response = await fetch(`${API_URL}/api/events`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
};

export const getEventById = async (eventId) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}`);
  if (!response.ok) throw new Error("Failed to fetch event");
  return response.json();
};

export const createEvent = async (event) => {
  // Retry logic for Render cold starts
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`API attempt ${attempt}/3...`);
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) throw new Error("Failed to create event");
      console.log(`API attempt ${attempt} succeeded!`);
      return response.json();
    } catch (error) {
      console.error(`API attempt ${attempt} failed:`, error.message);
      lastError = error;
      if (attempt < 3) {
        const delay = attempt * 2000; // 2s, 4s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

export const joinEvent = async (eventId, username) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) throw new Error("Failed to join event");
  return response.json();
};

export const leaveEvent = async (eventId, username) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) throw new Error("Failed to leave event");
  return response.json();
};

export const updateEvent = async (eventId, event) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update event");
  }
  return response.json();
};

export const deleteEvent = async (eventId, username) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}?username=${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete event");
  }
  return response.json();
};

export const getUserEvents = async (username) => {
  const response = await fetch(`${API_URL}/api/users/${username}/events`);
  if (!response.ok) throw new Error("Failed to fetch user events");
  return response.json();
};

// ===== FRIENDS ENDPOINTS =====

export const getFriends = async (username) => {
  const response = await fetch(`${API_URL}/api/friends/${username}`);
  if (!response.ok) throw new Error("Failed to fetch friends");
  return response.json();
};

export const addFriend = async (user1, user2) => {
  const response = await fetch(`${API_URL}/api/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1, user2 }),
  });
  if (!response.ok) throw new Error("Failed to add friend");
  return response.json();
};

// ===== CHAT ENDPOINTS =====

export const getChatMessages = async (eventId) => {
  const response = await fetch(`${API_URL}/api/chat/${eventId}`);
  if (!response.ok) throw new Error("Failed to fetch chat messages");
  return response.json();
};

export const sendChatMessage = async (eventId, username, message) => {
  const response = await fetch(`${API_URL}/api/chat/${eventId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, message }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
};

// ===== USER ENDPOINTS =====

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }
  return response.json();
};

export const registerUser = async (username, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }
  return response.json();
};

// ===== ADMIN ENDPOINTS =====

export const getPendingRequests = async () => {
  const response = await fetch(`${API_URL}/api/admin/pending-requests`);
  if (!response.ok) throw new Error("Failed to fetch pending requests");
  return response.json();
};
