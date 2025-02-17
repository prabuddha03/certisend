import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Info, Clock } from 'lucide-react';
import { Event } from '@/types/event.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  event: Event;
}

export function PublicEventCard({ event }: Props) {
  const isRegistrationOpen = event.status === 'registration_open';
  const registrationDeadline = new Date(event.settings.registrationDeadline);
  const isDeadlinePassed = registrationDeadline < new Date();

  const getRegistrationStatus = () => {
    if (!isRegistrationOpen) return 'Registration Closed';
    if (isDeadlinePassed) return 'Registration Ended';
    if (event.stats?.registeredCount >= event.settings.maxParticipants) {
      return event.settings.allowWaitlist ? 'Waitlist Available' : 'Fully Booked';
    }
    return 'Registration Open';
  };

  const getStatusColor = () => {
    if (!isRegistrationOpen || isDeadlinePassed) return 'bg-red-500/10 text-red-500';
    if (event.stats?.registeredCount >= event.settings.maxParticipants) {
      return event.settings.allowWaitlist ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500';
    }
    return 'bg-green-500/10 text-green-500';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg hover:border-primary transition-colors">
      <div className="p-6 flex flex-col h-[280px]">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 line-clamp-1">{event.name}</h3>
            <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
              {event.description}
            </p>
          </div>
          <Badge variant="outline" className={`ml-4 ${getStatusColor()}`}>
            {getRegistrationStatus()}
          </Badge>
        </div>

        {/* Event Details */}
        <div className="flex flex-col space-y-3 flex-1">
          <div className="flex items-center text-zinc-400">
            <Calendar className="h-4 w-4 mr-3" />
            <span className="text-sm">
              {new Date(event.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          <div className="flex items-center text-zinc-400">
            <MapPin className="h-4 w-4 mr-3" />
            <span className="text-sm line-clamp-1">{event.venue}</span>
          </div>
          
          <div className="flex items-center text-zinc-400">
            <Users className="h-4 w-4 mr-3" />
            <span className="text-sm">
              {event.stats?.registeredCount || 0} / {event.settings.maxParticipants} participants
            </span>
          </div>

          <div className="flex items-center text-zinc-400">
            <Clock className="h-4 w-4 mr-3" />
            <span className="text-sm">
              Registration ends: {new Date(event.settings.registrationDeadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-zinc-800">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/events/${event._id}`} className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>

          <Button 
            size="sm"
            asChild
            disabled={!isRegistrationOpen || isDeadlinePassed || (event.stats?.registeredCount >= event.settings.maxParticipants && !event.settings.allowWaitlist)}
          >
            <Link to={`/events/${event._id}/register`}>
              Register Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}