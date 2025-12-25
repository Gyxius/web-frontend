// API utility functions for communicating with FastAPI backend

const API_URL = process.env.REACT_APP_API_URL || "https://fast-api-backend-qlyb.onrender.com";

// ===== EVENT ENDPOINTS =====

export const getAllEvents = async (includeArchived = false) => {
  const url = includeArchived 
    ? `${API_URL}/api/events?include_archived=true`
    : `${API_URL}/api/events`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
};

export const getEventById = async (eventId) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}`);
  if (!response.ok) throw new Error("Failed to fetch event");
  return response.json();
};

export const createEvent = async (event) => {
  // Retry logic for Render cold starts (free tier spins down after 15min inactivity)
  let lastError;
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`API attempt ${attempt}/${maxAttempts}... (Render cold start may take up to 60 seconds)`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout per attempt
      
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${response.status} ${errorText}`);
      }
      console.log(`API attempt ${attempt} succeeded!`);
      return response.json();
    } catch (error) {
      console.error(`API attempt ${attempt} failed:`, error.message);
      lastError = error;
      if (attempt < maxAttempts) {
        // Exponential backoff: 5s, 10s, 15s, 20s
        const delay = attempt * 5000;
        console.log(`Waiting ${delay/1000}s before retry... (Backend may be waking up)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  // Provide more helpful error message with original error details
  const errorMsg = lastError?.message || "Unknown error";
  if (errorMsg.toLowerCase().includes("fetch") || errorMsg.toLowerCase().includes("network")) {
    throw new Error("Unable to connect to server. The backend may be starting up (Render free tier cold start). Please wait a minute and try again.");
  }
  throw lastError || new Error("Failed to create event after multiple attempts");
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

export const archiveEvent = async (eventId, username) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}/archive?username=${encodeURIComponent(username)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to archive event");
  }
  return response.json();
};

export const unarchiveEvent = async (eventId, username) => {
  const response = await fetch(`${API_URL}/api/events/${eventId}/unarchive?username=${encodeURIComponent(username)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to unarchive event");
  }
  return response.json();
};

export const getUserEvents = async (username) => {
  const response = await fetch(`${API_URL}/api/users/${username}/events`);
  if (!response.ok) throw new Error("Failed to fetch user events");
  return response.json();
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_URL}/api/upload-image`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to upload image");
  }
  
  const data = await response.json();
  return data.url;
};

// ===== FOLLOWS ENDPOINTS =====

export const getFollows = async (username) => {
  const response = await fetch(`${API_URL}/api/follows/${username}`);
  if (!response.ok) throw new Error("Failed to fetch follows");
  return response.json();
};

export const getFollowers = async (username) => {
  const response = await fetch(`${API_URL}/api/followers/${username}`);
  if (!response.ok) throw new Error("Failed to fetch followers");
  return response.json();
};

export const addFollow = async (user1, user2) => {
  const response = await fetch(`${API_URL}/api/follows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1, user2 }),
  });
  if (!response.ok) throw new Error("Failed to add follow");
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

export const deleteChatMessage = async (eventId, messageId, username) => {
  const response = await fetch(`${API_URL}/api/chat/${eventId}/messages/${messageId}?username=${encodeURIComponent(username)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    let errorMsg = "Failed to delete message";
    try {
      const error = await response.json();
      errorMsg = error.detail || error.error || errorMsg;
    } catch (e) {
      // If can't parse JSON, use status text
      errorMsg = `${errorMsg} (${response.status} ${response.statusText})`;
    }
    throw new Error(errorMsg);
  }
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

// ===== INVITE ENDPOINTS =====

export const getUserInviteCode = async (username) => {
  const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}/invite-code`);
  if (!res.ok) throw new Error("Failed to get invite code");
  return res.json(); // { invite_code }
};

export const createOrRotateInviteCode = async (username) => {
  const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}/invite-code`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create invite code");
  return res.json(); // { invite_code }
};

export const validateInviteCode = async (code) => {
  const res = await fetch(`${API_URL}/api/invites/validate?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error("Failed to validate invite code");
  return res.json(); // { valid, inviter }
};

// ===== USER PROFILE ENDPOINTS =====

export const getUserProfile = async (username) => {
  const url = `${API_URL}/api/users/${encodeURIComponent(username)}/profile`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
};

export const saveUserProfile = async (username, profile) => {
  const url = `${API_URL}/api/users/${encodeURIComponent(username)}/profile`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: profile }),
  });
  if (!res.ok) {
    let msg = "Failed to save profile";
    try { const e = await res.json(); msg = e.detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json(); // { ok: true }
};

// ===== NOTIFICATION ENDPOINTS =====

export const getNotifications = async (username) => {
  const response = await fetch(`${API_URL}/api/notifications/${username}`);
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
};

export const markNotificationsRead = async (username, eventId = null) => {
  const response = await fetch(`${API_URL}/api/notifications/${username}/mark-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId }),
  });
  if (!response.ok) throw new Error("Failed to mark notifications as read");
  return response.json();
};

// ===== ADMIN ENDPOINTS =====

export const getPendingRequests = async () => {
  const response = await fetch(`${API_URL}/api/admin/pending-requests`);
  if (!response.ok) throw new Error("Failed to fetch pending requests");
  return response.json();
};
