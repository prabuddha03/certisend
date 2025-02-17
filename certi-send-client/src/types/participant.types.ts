export interface Participant {
    _id: string;
    eventId: string;
    name: string;
    email: string;
    phone?: string;
    status: 'registered' | 'approved' | 'attended' | 'certificate_generated' | 'certificate_claimed';
    registrationNumber: string;
    qrCode?: {
      code: string;
      scannedAt?: Date;
    };
    checkInTime?: Date;
    formData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ParticipantFilters {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }