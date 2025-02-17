export const ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
    },
    EVENTS: {
      BASE: '/api/events',
      ORGANIZER: '/api/events/organizer/list',
      CREATE: '/api/events/organizer/create',
      PUBLIC: '/api/events',
      DETAILS: (id: string) => `/api/events/${id}`,
      STATUS: (id: string) => `/api/events/${id}/status`,
      REGISTRATION_FORM: (id: string) => `/api/events/${id}/registration-form`,
    },
    PARTICIPANTS: {
      REGISTER: (eventId: string) => `/api/events/${eventId}/register`,
      LIST: (eventId: string) => `/api/events/${eventId}/participants`,
      DETAILS: (eventId: string, participantId: string) => 
        `/api/events/${eventId}/participants/${participantId}`,
      CHECK_IN: (eventId: string, participantId: string) => 
        `/api/events/${eventId}/participants/${participantId}/check-in`,
      VERIFY_QR: (eventId: string) => `/api/events/${eventId}/verify-qr`,
      UPDATE_STATUS: (eventId: string, participantId: string) => 
        `/api/events/${eventId}/participants/${participantId}/status`,
    }
  } as const;