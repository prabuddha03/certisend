/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface EventCreationState {
  eventType: 'individual' | 'mega' | null;
  durationType: 'single' | 'multi' | null;
  isTicketed: boolean;
  basicDetails: {
    name: string;
    description: string;
    eventMode: 'online' | 'offline' | 'hybrid';
    category: string;
    // ... other fields
  } | null;
  registrationSettings: any | null;
  registrationForm: any[] | null;
  subEvents: any[] | null;
  currentStep: number;
}

type Action =
  | { type: 'SET_EVENT_TYPE'; payload: { eventType: 'individual' | 'mega'; durationType: 'single' | 'multi'; isTicketed: boolean } }
  | { type: 'SET_BASIC_DETAILS'; payload: any }
  | { type: 'SET_REGISTRATION_SETTINGS'; payload: any }
  | { type: 'SET_REGISTRATION_FORM'; payload: any[] }
  | { type: 'SET_SUB_EVENTS'; payload: any[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

const initialState: EventCreationState = {
  eventType: null,
  durationType: null,
  isTicketed: false,
  basicDetails: null,
  registrationForm: null,
  subEvents: null,
  currentStep: 0,
  registrationSettings: {
    type: 'free',
    fee: {
      individual: 0,
      team: 0,
    },
    prizeMoney: 0,
    participationType: 'solo',
    teamSettings: {
      enabled: false,
      size: {
        min: 1,
        max: 1,
      },
    },
  },
};

const EventCreationContext = createContext<{
  state: EventCreationState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function eventCreationReducer(state: EventCreationState, action: Action): EventCreationState {
  switch (action.type) {
    case 'SET_EVENT_TYPE':
      return {
        ...state,
        eventType: action.payload.eventType,
        durationType: action.payload.durationType,
        isTicketed: action.payload.isTicketed,
      };
    case 'SET_BASIC_DETAILS':
      return {
        ...state,
        basicDetails: action.payload,
      };
    case 'SET_REGISTRATION_SETTINGS':
      return {
        ...state,
        registrationSettings: {
          ...state.registrationSettings,
          ...action.payload,
        },
      };
    case 'SET_REGISTRATION_FORM':
      return {
        ...state,
        registrationForm: action.payload,
      };
    case 'SET_SUB_EVENTS':
      return {
        ...state,
        subEvents: action.payload,
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: state.currentStep + 1,
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function EventCreationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventCreationReducer, initialState);

  return (
    <EventCreationContext.Provider value={{ state, dispatch }}>
      {children}
    </EventCreationContext.Provider>
  );
}

export function useEventCreation() {
  const context = useContext(EventCreationContext);
  if (!context) {
    throw new Error('useEventCreation must be used within an EventCreationProvider');
  }
  return context;
}