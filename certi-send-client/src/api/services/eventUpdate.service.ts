import  api  from '../axios';

export interface EventUpdate {
  _id: string;
  title: string;
  content: string;
  type: 'announcement' | 'update' | 'reminder' | 'result';
  pinned: boolean;
  eventId: string;
  createdBy: {
    _id: string;
    name: string;
    photo?: string;
  };
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
  }>;
}

export const eventUpdateService = {
  // Get all updates for an event
  getEventUpdates: async (eventId: string) => {
    const response = await api.get(`/api/events/${eventId}/updates`);
    return response.data;
  },
  
  // Get all updates for an event with polling
  getEventUpdatesWithPolling: (
    eventId: string,
    onUpdate: (updates: EventUpdate[]) => void,
    interval = 30000 // 30 seconds default
  ) => {
    const fetchUpdates = async () => {
      try {
        const response = await api.get(`/api/events/${eventId}/updates`);
        if (response.data?.data?.data) {
          onUpdate(response.data.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch event updates:', error);
      }
    };

    // Initial fetch
    fetchUpdates();

    // Set up polling
    const pollInterval = setInterval(fetchUpdates, interval);

    // Return cleanup function
    return () => clearInterval(pollInterval);
  },

  // Create a new update
  createUpdate: async (eventId: string, updateData: {
    title: string;
    content: string;
    type: 'announcement' | 'update' | 'reminder' | 'result';
    attachments?: Array<{
      url: string;
      type: string;
      name: string;
    }>;
  }) => {
    const response = await api.post(`/api/events/${eventId}/updates`, updateData);
    return response.data;
  },

  // Update an existing update
  updateUpdate: async (updateId: string, updateData: Partial<{
    title: string;
    content: string;
    type: string;
    attachments: Array<{
      url: string;
      type: string;
      name: string;
    }>;
  }>) => {
    return api.patch(`/api/updates/${updateId}`, updateData);
  },

  // Delete an update
  deleteUpdate: async (updateId: string) => {
    return api.delete(`/api/updates/${updateId}`);
  },

  // Toggle pin status
  togglePin: async (updateId: string) => {
    return api.patch(`/api/updates/${updateId}/toggle-pin`);
  },
};