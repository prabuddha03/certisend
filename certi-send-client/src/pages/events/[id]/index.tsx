import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Share2, ArrowLeft } from 'lucide-react';
import { Event } from '@/types/event.types';
import { eventService } from '@/api/services/event.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      const response = await eventService.getEventById(eventId);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Event link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center">Event not found</div>
      </div>
    );
  }

  const isRegistrationOpen = event.status === 'registration_open';
  const registrationDeadline = event.settings?.registrationDeadline 
    ? new Date(event.settings.registrationDeadline) 
    : null;
  const isDeadlinePassed = registrationDeadline ? registrationDeadline < new Date() : false;
  const isFull = (event.stats?.registeredCount || 0) >= (event.settings?.maxParticipants || 0);

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/events" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-3">{event.name}</h1>
              <Badge
                variant="outline"
                className={
                  !isRegistrationOpen || isDeadlinePassed
                    ? 'bg-red-500/10 text-red-500'
                    : isFull
                    ? event.settings?.allowWaitlist
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-red-500/10 text-red-500'
                    : 'bg-green-500/10 text-green-500'
                }
              >
                {!isRegistrationOpen
                  ? 'Registration Closed'
                  : isDeadlinePassed
                  ? 'Registration Ended'
                  : isFull
                  ? event.settings?.allowWaitlist
                    ? 'Waitlist Available'
                    : 'Fully Booked'
                  : 'Registration Open'}
              </Badge>
            </div>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-zinc-400">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="grid gap-6 mb-8">
            <div className="flex items-center text-zinc-400">
              <Calendar className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium text-white">Date & Time</p>
                <p>{new Date(event.eventDate).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center text-zinc-400">
              <MapPin className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium text-white">Venue</p>
                <p>{event.venue}</p>
              </div>
            </div>

            <div className="flex items-center text-zinc-400">
              <Users className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium text-white">Participants</p>
                <p>
                  {event.stats?.registeredCount || 0} / {event.settings?.maxParticipants || 0} registered
                </p>
              </div>
            </div>

            {registrationDeadline && (
              <div className="flex items-center text-zinc-400">
                <Clock className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium text-white">Registration Deadline</p>
                  <p>{registrationDeadline.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!isRegistrationOpen || isDeadlinePassed || (isFull && !event.settings?.allowWaitlist)}
              asChild
            >
              <Link to={`/events/${event._id}/register`}>
                {isFull && event.settings?.allowWaitlist ? 'Join Waitlist' : 'Register Now'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}