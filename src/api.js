// API utility functions for communicating with FastAPI backend

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8003";

// ===== EVENT ENDPOINTS =====

export const getAllEvents = async () => {
  const response = await fetch(`${API_URL}/api/events`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
};

export const createEvent = async (event) => {
  const response = await fetch(`${API_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error("Failed to create event");
  return response.json();
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
