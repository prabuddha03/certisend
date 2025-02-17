export interface Event {
    _id: string;
    name: string;
    description: string;
    eventDate: Date;
    venue: string;
    status: 'draft' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed';
    registrationForm: {
      fields: FormField[];
    };
    organizerId: string;
    isAppreciationTemplate: boolean;
    isParticipationTemplate: boolean;
    isCertificatesIssued: boolean;
    isApprovalRequired: boolean;
    isPublic: boolean;
    settings: {
      registrationDeadline: Date;
      maxParticipants: number;
      allowWaitlist: boolean;
      requireVerification: boolean;
    };
    // Additional fields for statistics
    totalRegistrations?: number;
    approvedParticipants?: number;
    pendingApprovals?: number;
    rejectedParticipants?: number;
    pageViews?: number;
    certificatesIssued?: number;
  }

  // src/types/event.types.ts

export interface EventSettings {
  eventType: 'individual' | 'mega';
  durationType: 'single' | 'multi';
  eventDates: Date[];
  registrationDeadline: Date;
  approvalType: 'manual' | 'automatic';
  eventCategory: string;
  domain: string;
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
  organizationType: 'corporate' | 'school' | 'college' | 'other';
  eventPOC: {
    name: string;
    contact: string;
    email: string;
  }[];
}

export interface EventPOC {
  name: string;
  contact: string;
  email: string;
}

export interface SubEventSettings {
  name: string;
  approximateParticipants: number;
  startTime: Date;
  endTime: Date;
  prizeMoney?: number;
  prizes?: string[];
  registrationType: 'free' | 'paid';
  registrationFee?: number;
  participationType: 'solo' | 'team';
  eventPOCs: EventPOC[];
  rules: string[];
  judges?: string[];
  speakers?: string[];
  guests?: string[];
  categories: string[];
  description: string;
  specificVenue: string;
  customFields: FormField[];
}
  
  export type FormField = {
    fieldName: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'radio' | 'checkbox';
    required: boolean;
    isDefault?: boolean;
    options?: string[];
  };
  
  export interface CreateEventDTO {
    name: string;
    description: string;
    eventDate: Date;
    venue: string;
    organizerId: string;
    settings: {
      registrationDeadline: Date;
      maxParticipants: number;
      allowWaitlist: boolean;
      requireVerification: boolean;
    };
    registrationForm?: {
      fields: FormField[];
    };
  }