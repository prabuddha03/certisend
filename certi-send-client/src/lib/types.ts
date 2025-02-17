export interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  participantCount: number;
  certificatesGenerated: number;
}

export interface Participant {
  id: string;
  name: string;
  contactNumber: string;
  eventId: string;
  certificateHash?: string;
}

export interface Certificate {
  id: string;
  eventId: string;
  participantId: string;
  hash: string;
  designUrl: string;
  generatedAt: string;
}