/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { InitialEventSetup } from './InitialEventsSetup';
import { EventBasicDetails } from './EventBasicDetails';
import { RegistrationSettings } from './RegistrationSettings';
import { RegistrationForm } from './RegistrationForm';
import { SubEventForm } from './SubEventForm';
import { EventCreationStepper } from './EventCreationStepper';
import { useEventCreation } from '@/contexts/EventCreationContext';
import { z } from 'zod';
import imageCompression from 'browser-image-compression';
import { useAuth } from '@/contexts/auth';

import { eventService } from '@/api/services/event.service';

export function CreateEventContainer() {
  const navigate = useNavigate();
  const { state, dispatch } = useEventCreation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, user, loading } = useAuth();

  // Use useEffect to handle auth redirects
  useEffect(() => {
    if (!loading && (!user || !token)) {
      toast.error('Please log in to create an event');
      navigate('/login');
    }
  }, [loading, user, token, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // Don't render anything if not authenticated
  if (!user || !token) {
    return null;
  }

  const handleInitialSetup = (data: { eventType: 'individual' | 'mega'; durationType: 'single' | 'multi'; isTicketed: boolean }) => {
    dispatch({ 
      type: 'SET_EVENT_TYPE', 
      payload: {
        eventType: data.eventType,
        durationType: data.durationType,
        isTicketed: data.isTicketed
      }
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBasicDetailsSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Log the user and token for debugging
      console.log('Current user:', user);
      console.log('Current token:', token);

      // Add all non-file data as JSON
      const eventData = {
        ...data,
        eventType: state.eventType,
        duration: state.durationType === 'single' ? 'single_day' : 'multi_day',
        organizerId: user._id,
        isTicketed: state.isTicketed,
      };

      formData.append('eventData', JSON.stringify(eventData));

      // Add files if they exist
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }
      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }

      // Add auth header to the request
      const response = await eventService.createEvent(formData, token);

      if (response.data.data) {
        dispatch({ type: 'SET_BASIC_DETAILS', payload: response.data.data });
        dispatch({ type: 'NEXT_STEP' });
      }
    } catch (error: any) {
      console.error('Error submitting basic details:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to save basic details');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationSettings = (data: any) => {
    dispatch({ type: 'SET_REGISTRATION_SETTINGS', payload: data });
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleRegistrationForm = async (data: any) => {
    dispatch({ type: 'SET_REGISTRATION_FORM', payload: data });
    
    // For individual events, create the event immediately
    if (state.eventType === 'individual') {
      await handleCreateEvent();
    } else {
      // For mega events, proceed to sub-events step
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handleSubEvents = (data: any[]) => {
    dispatch({ type: 'SET_SUB_EVENTS', payload: data });
    handleCreateEvent();
  };

  const handleCreateEvent = async () => {
    console.log(state);
    console.log(state.registrationSettings);
    try {
      const eventData = {
        ...state.basicDetails,
        eventType: state.eventType,
        duration: state.durationType === 'single' ? 'single_day' : 'multi_day',
        registrationForm: state.registrationForm,
        registrationSettings: {
          type: state.registrationSettings?.type || 'free',
          fee: {
            individual: state.registrationSettings?.fee?.individual || 0,
            team: state.registrationSettings?.fee?.team || 0,
          }
        },
        subEvents: state.subEvents,
        // Ensure all required fields are included
        eventMode: state.basicDetails?.eventMode,
        category: state.basicDetails?.category,
        name: state.basicDetails?.name,
        _id: state.basicDetails?._id, // Include the ID for updates
      };
      debugger;

      const response = await fetch('http://localhost:3000/api/events', {
        method: 'PATCH', // Use PATCH for updates
        headers: {
          'Content-Type': 'application/json', // Set content type to JSON
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ eventData }), // Wrap in an object
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Handle success
      toast.success('Event updated successfully');
      navigate('/dashboard');
    } catch (error) {
      debugger
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  // Helper function to compress images
  const compressImage = async (imageData: string | File): Promise<string | Blob> => {
    if (imageData instanceof File) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      return imageCompression(imageData, options);
    }
    return imageData;
  };

  const renderCurrentStep = () => {
    console.log('Rendering step:', state.currentStep);
    
    switch (state.currentStep) {
      case 0:
        return <InitialEventSetup onNext={handleInitialSetup} />;
      case 1:
        return (
          <EventBasicDetails
            onSubmit={handleBasicDetailsSubmit}
            eventType={state.eventType!}
            durationType={state.durationType!}
          />
        );
      case 2:
        return (
          <RegistrationSettings
            onSubmit={handleRegistrationSettings}
            eventType={state.eventType!}
          />
        );
      case 3:
        return (
          <RegistrationForm
            onSubmit={handleRegistrationForm}
            fields={state.registrationForm || []}
            onFieldsChange={(fields) => 
              dispatch({ type: 'SET_REGISTRATION_FORM', payload: fields })
            }
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return state.eventType === 'mega' ? (
          <SubEventForm
            onSubmit={handleSubEvents}
            eventDates={state.basicDetails.eventDates}
            mainEventPOCs={state.basicDetails.eventPOCs}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-xs text-gray-500">
        Current step: {state.currentStep}, 
        Event type: {state.eventType}, 
        Duration: {state.durationType}
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Event</h1>
        {state.currentStep > 0 && (
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="text-primary hover:underline"
          >
            ← Back
          </button>
        )}
      </div>

      <EventCreationStepper 
        currentStep={state.currentStep} 
        eventType={state.eventType || 'individual'}
      />

      <div className="bg-card rounded-lg p-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
}