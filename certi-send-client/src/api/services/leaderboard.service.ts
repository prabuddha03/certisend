import api from '../axios';

export interface LeaderboardParticipant {
  participantId: string;
  name: string;
  points: number;
  metrics: Record<string, any>;
  _id: string;
  id: string;
}

export interface Leaderboard {
  settings: {
    sortBy: 'points' | 'time' | 'custom';
    orderBy: 'asc' | 'desc';
    displayFields: string[];
  };
  _id: string;
  eventId: string;
  participants: LeaderboardParticipant[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface LeaderboardResponse {
  status: string;
  data: {
    data: Leaderboard;
  };
}

export const leaderboardService = {
  getLeaderboard: async (eventId: string) => {
    return api.get<LeaderboardResponse>(`/api/events/${eventId}/leaderboard`);
  },

  createLeaderboard: async (eventId: string, data: {
    participants: Array<{
      participantId: string;
      rank: number;
      points: number;
      metrics?: Record<string, number | string>;
    }>;
    settings: {
      sortBy: 'points' | 'time' | 'custom';
      orderBy: 'asc' | 'desc';
      displayFields: string[];
    };
  }) => {
    return api.post<{ data: Leaderboard }>(`/api/events/${eventId}/leaderboard`, data);
  },

  updateLeaderboard: async (eventId: string, data: Partial<{
    participants: LeaderboardParticipant[];
    settings: {
      sortBy: 'points' | 'time' | 'custom';
      orderBy: 'asc' | 'desc';
      displayFields: string[];
    };
  }>) => {
    return api.patch<{ data: Leaderboard }>(`/api/events/${eventId}/leaderboard`, data);
  },

  publishLeaderboard: async (eventId: string) => {
    return api.post<{ success: boolean }>(`/api/events/${eventId}/leaderboard/publish`);
  },

  exportLeaderboard: async (eventId: string) => {
    return api.get(`/api/events/${eventId}/leaderboard/export`, {
      responseType: 'blob'
    });
  }
};