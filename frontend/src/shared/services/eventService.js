/*
 * eventService: wrapper for API calls related to events
 * Each method returns JSON data or throws with an appropriate message.
 */
const API_URL = "http://localhost:5000/api/events";

const eventService = {
  /* Get backend dashboard statistics for events */
  getDashboardStats: async () => {
    const response = await fetch(`${API_URL}/dashboard/stats`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch dashboard statistics");
    }

    return data;
  },

  /* Create a new event (organizer endpoint) */
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

  /* Retrieve all events, accepts optional filters */
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

  /* Get events for the currently authenticated organizer */
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

  /* Get single event (public) */
  getEvent: async (eventId) => {
    const response = await fetch(`${API_URL}/${eventId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch event");
    }

    return data;
  },

  /* Get event by ID with authentication header */
  getEventById: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch event");
    }

    return data;
  },

  /* Update existing event (organizer only) */
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

  /* Cancel an event (organizer action) */
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

  /* Delete event permanently (organizer) */
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

  /* Check whether a donor is eligible to register for an event */
  checkEligibility: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}/check-eligibility`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "Failed to check eligibility");
      error.response = { data };
      throw error;
    }

    return data;
  },

  /* Register the current donor for an event */
  registerForEvent: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "Failed to register for event");
      error.response = { data };
      throw error;
    }

    return data;
  },

  /* Cancel existing donor registration for an event */
  cancelRegistration: async (eventId, token) => {
    const response = await fetch(`${API_URL}/${eventId}/cancel-registration`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "Failed to cancel registration");
      error.response = { data };
      throw error;
    }

    return data;
  },
};

export default eventService;
