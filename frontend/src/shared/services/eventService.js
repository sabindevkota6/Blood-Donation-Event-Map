const API_URL = "http://localhost:5000/api/events";

const eventService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch dashboard statistics");
    }

    return data;
  },

  // Create new event
  createEvent: async (eventData, token) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create event");
    }

    return data;
  },

  // Get all events
  getAllEvents: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${API_URL}?${queryParams}` : API_URL;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch events");
    }

    return data;
  },

  // Get organizer's events
  getMyEvents: async (token) => {
    const response = await fetch(`${API_URL}/organizer/my-events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch your events");
    }

    return data;
  },

  // Get single event
  getEvent: async (eventId) => {
    const response = await fetch(`${API_URL}/${eventId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch event");
    }

    return data;
  },

  // Update event
  updateEvent: async (eventId, eventData, token) => {
    const response = await fetch(`${API_URL}/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update event");
    }

    return data;
  },

  // Cancel event (organizers)
  cancelEvent: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to cancel event");
    }

    return data;
  },

  // Delete event
  deleteEvent: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete event");
    }

    return data;
  },

  // Register for event (donors)
  registerForEvent: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to register for event");
    }

    return data;
  },

  // Cancel registration
  cancelRegistration: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}/cancel-registration`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to cancel registration");
    }

    return data;
  },
};

export default eventService;
