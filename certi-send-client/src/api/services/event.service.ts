/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import { Event, CreateEventDTO, FormField } from '@/types/event.types';
import { AxiosResponse } from 'axios';

interface ApiResponse<T> {
  status: string;
  success: boolean;
  data: {
    data: T;
  };
}

interface CreateEventPayload {
  eventType: 'individual' | 'mega';
  durationType: 'single' | 'multi';
  basicDetails: {
    name: string;
    description: string;
    logo?: string;
    banner?: string;
    approximateParticipants: number;
    eventDates: Date[];
    registrationDeadline: Date;
    approvalType: 'manual' | 'automatic';
    category: string;
    domain: string[];
    targetGroup: string[];
    eventMode: 'online' | 'offline' | 'hybrid';
    venue?: {
      address: string;
      location: {
        lat: number;
        lng: number;
      };
    };
    hasTickets: boolean;
    eventPOCs: Array<{
      name: string;
      contact: string;
      email: string;
    }>;
  };
  registrationSettings: {
    registrationType: 'free' | 'paid';
    registrationFee?: number;
    prizeMoney?: number;
    participationType: 'solo' | 'team' | 'both';
    teamSettings?: {
      enabled: boolean;
      size?: {
        min: number;
        max: number;
      };
    };
  };
  registrationForm: FormField[];
  subEvents?: Array<{
    name: string;
    approximateParticipants: number;
    startTime: Date;
    endTime: Date;
    prizeMoney?: number;
    prizes: string[];
    registrationType: 'free' | 'paid';
    registrationFee?: number;
    participationType: 'solo' | 'team';
    teamSize?: {
      min: number;
      max: number;
    };
    eventPOCs: Array<{
      name: string;
      contact: string;
      email: string;
    }>;
    rules: string[];
    judges?: string[];
    speakers?: string[];
    guests?: string[];
    categories: string[];
    description: string;
    specificVenue: string;
    customFields: FormField[];
  }>;
}
const API_BASE_URL = import.meta.env.VITE_API_URL
export const eventService = {
  createEvent: async (formData: FormData, token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create event');
      }

      return await response.json();
    } catch (error) {
      console.error('Event service error:', error);
      throw error;
    }
  },

  getOrganizerEvents: async () => {
    try {
      const response = await api.get<{ data: Event[] }>(
        ENDPOINTS.EVENTS.ORGANIZER
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      throw error;
    }
  },

  updateEvent: async (eventId: string, data: Partial<CreateEventDTO>) => {
    const response = await api.patch<{ data: Event }>(
      ENDPOINTS.EVENTS.DETAILS(eventId),
      data
    );
    return response.data;
  },

  getEventDetails: async (eventId: string) => {
    const response = await api.get<{ data: Event }>(
      ENDPOINTS.EVENTS.DETAILS(eventId)
    );
    return response.data;
  },

  getPublicEvents: async () => {
    try {
      const response = await api.get(ENDPOINTS.EVENTS.PUBLIC);
      return response.data.data.data;
    } catch (error) {
      console.error('Error fetching public events:', error);
      throw error;
    }
  },

  getEventById: async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: Event }>(
        ENDPOINTS.EVENTS.DETAILS(id)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
  },

  publishEvent: async (eventId: string) => {
    try {
      const response = await api.patch<{ data: Event }>(
        ENDPOINTS.EVENTS.STATUS(eventId),
        { 
          isPublic: true,
          status: 'registration_open'
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  },

  toggleRegistration: async (eventId: string, isOpen: boolean) => {
    try {
      const response = await api.patch<{ data: Event }>(
        ENDPOINTS.EVENTS.STATUS(eventId),
        { 
          status: isOpen ? 'registration_open' : 'registration_closed' 
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error toggling registration:', error);
      throw error;
    }
  },

  updateEventStatus: async (eventId: string, status: string) => {
    try {
      const response = await api.patch<{ data: Event }>(
        ENDPOINTS.EVENTS.STATUS(eventId),
        { status }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  },

  uploadCertificateTemplate: async (eventId: string, formData: FormData) => {
    try {
      const response = await api.post(
        `/api/events/${eventId}/certificates/templates`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading certificate template:', error);
      throw error;
    }
  },

  saveCertificateTemplate: async (eventId: string, templateData: any) => {
    try {
      const response = await api.post(`/api/events/${eventId}/certificates/template`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error saving certificate template:', error);
      throw error;
    }
  },

  deleteTemplate: async (eventId: string, type: string) => {
    try {
      const response = await api.delete(
        `/api/events/${eventId}/certificates/templates/${type}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  updateTemplate: async (eventId: string, type: string, formData: FormData) => {
    try {
      const response = await api.patch(
        `/api/events/${eventId}/certificates/templates/${type}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  getTemplate: async (eventId: string, type: string) => {
    try {
      const response = await api.get(
        `/api/events/${eventId}/certificates/templates/${type}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  issueCertificatesForAll: (eventId: string) => {
    return api.post(`/api/events/${eventId}/certificates/issue-all`);
  },

  getAttendedParticipantsCount: (eventId: string) => {
    return api.get(`/api/events/${eventId}/participants/attended/count`);
  },

  issueCertificatesInBatch: (eventId: string, params: { skip: number; limit: number }) => {
    return api.post(`/api/events/${eventId}/certificates/issue-batch`, params);
  },

  getOrganizerStats(): Promise<AxiosResponse<any>> {
    return api.get('/api/events/organizer/stats');
  },

  getEventMetrics(eventId: string): Promise<AxiosResponse<any>> {
    return api.get(`/api/events/${eventId}/metrics`);
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      await api.delete(`/api/events/${eventId}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  getOrganizerEventDetails: (eventId: string) => {
    return api.get(`/api/events/${eventId}`);
  },

  togglePrivacy: async (eventId: string, isPublic: boolean) => {
    return api.patch(`/api/events/${eventId}/toggle-privacy`, { isPublic });
  },
};
