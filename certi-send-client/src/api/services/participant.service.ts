/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import { Participant } from '@/types/participant.types';

export interface RegisterParticipantDTO {
  name: string;
  email: string;
  phone?: string;
  [key: string]: any; // For dynamic form fields
}

export interface ParticipantResponse {
  success: boolean;
  data: Participant;
  message?: string;
}

export interface ParticipantListResponse {
  success: boolean;
  data: {
    data: {
      participants: Participant[];
      total: number;
    }
  };
}

interface GetParticipantsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export const participantService = {
  // Register for an event
  register: async (eventId: string, formData: Record<string, string>) => {
    try {
      const response = await api.post(`/api/events/${eventId}/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        registrationData: formData // Include all form data
      });
      return response.data;
    } catch (error: any) {
      console.error('Error registering participant:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to register for the event'
      );
    }
  },

  // Get participant list for an event
  getParticipants: async (eventId: string, options: GetParticipantsOptions = {}): Promise<ParticipantListResponse> => {
    try {
      const { page = 1, limit = 20, search = '' } = options;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const response = await api.get<ParticipantListResponse>(
        `${ENDPOINTS.PARTICIPANTS.LIST(eventId)}?${queryParams}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch participants'
      );
    }
  },

  // Get participant details
  getParticipantDetails: async (
    eventId: string, 
    participantId: string
  ): Promise<ParticipantResponse> => {
    try {
      const response = await api.get<ParticipantResponse>(
        ENDPOINTS.PARTICIPANTS.DETAILS(eventId, participantId)
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch participant details'
      );
    }
  },

  // Check in participant
  checkIn: async (
    eventId: string, 
    participantId: string
  ): Promise<ParticipantResponse> => {
    try {
      const response = await api.post<ParticipantResponse>(
        ENDPOINTS.PARTICIPANTS.CHECK_IN(eventId, participantId)
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to check in participant'
      );
    }
  },

  // Verify QR code
  verifyQR: async (
    eventId: string, 
    qrCode: string
  ): Promise<ParticipantResponse> => {
    try {
      const response = await api.post<ParticipantResponse>(
        ENDPOINTS.PARTICIPANTS.VERIFY_QR(eventId),
        { qrCode }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to verify QR code'
      );
    }
  },

  // Update participant status
  updateStatus: async (participantId: string, status: string): Promise<ParticipantResponse> => {
    try {
      const response = await api.patch<ParticipantResponse>(
        `/api/participants/${participantId}/mark-attended`,
        { status }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to update participant status'
      );
    }
  },

  attendWithQR: async (qrCode: string, status: string): Promise<ParticipantResponse> => {
    try {
      const response = await api.post<ParticipantResponse>(
        `/api/participants/attend-with-qr`,
        { qrCode, status }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to update participant status'
      );
    }
  },


  sendCertificate: async (participantId: string) => {
    try {
      const response = await api.post(`/api/participants/${participantId}/certificate`);
      return response.data;
    } catch (error) {
      console.error('Error sending certificate:', error);
      throw error;
    }
  }
};
