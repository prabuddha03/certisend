import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Share2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Link as LinkIcon,
  Globe,
  Mail,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Event } from '@/types/event.types';
import { Button } from '@/components/ui/button';
import { eventService } from '@/api/services/event.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface Props {
  event: Event;
  onDelete?: (eventId: string) => void;
  onEventUpdate?: () => void;
}

export function EventCard({ event, onDelete, onEventUpdate }: Props) {
  const [copying, setCopying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  // Check if event date has passed
  const isEventPassed = new Date(event.eventDate) < new Date();

  // Automatically mark event as completed if date has passed
  useEffect(() => {
    if (isEventPassed && event.status !== 'completed') {
      handleMarkAsCompleted();
    }
  }, [event.eventDate]);

  const handleMarkAsCompleted = async () => {
    try {
      setIsUpdating(true);
      await eventService.updateEventStatus(event._id, 'completed');
      onEventUpdate?.();
    } catch (error) {
      console.error('Error marking event as completed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-500/10 text-green-500';
      case 'registration_closed':
        return 'bg-red-500/10 text-red-500';
      case 'ongoing':
        return 'bg-blue-500/10 text-blue-500';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-zinc-500/10 text-zinc-500';
    }
  };

  const handleShare = async () => {
    const eventLink = `${window.location.origin}/events/${event._id}`;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(eventLink);
      toast.success('Event link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    } finally {
      setCopying(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsUpdating(true);
      await eventService.publishEvent(event._id);
      toast.success('Event published successfully!');
      onEventUpdate?.();
    } catch (error) {
      toast.error('Failed to publish event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegistrationToggle = async () => {
    try {
      setIsUpdating(true);
      const isCurrentlyOpen = event.status === 'registration_open';
      await eventService.toggleRegistration(event._id, !isCurrentlyOpen);
      toast.success(`Registration ${isCurrentlyOpen ? 'closed' : 'opened'} successfully!`);
      onEventUpdate?.();
    } catch (error) {
      toast.error('Failed to toggle registration');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEventStatusToggle = async () => {
    try {
      setIsUpdating(true);
      const isCurrentlyOngoing = event.status === 'ongoing';
      await eventService.updateEventStatus(
        event._id, 
        isCurrentlyOngoing ? 'registration_open' : 'ongoing'
      );
      toast.success(`Event ${isCurrentlyOngoing ? 'stopped' : 'started'} successfully!`);
      onEventUpdate?.();
    } catch (error) {
      toast.error('Failed to update event status');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderActionButtons = () => {
    if (event.status === 'draft') {
      return (
        <Button 
          onClick={handlePublish} 
          disabled={isUpdating}
          className="flex-1"
        >
          Publish Event
        </Button>
      );
    }

    if (event.status === 'completed') {
      return (
        <div className="flex flex-col gap-4 w-full">
          <Button 
            variant="default"
            className="flex-1"
            onClick={() => navigate(`/events/${event._id}/certificates/setup`)}
          >
            <Award className="h-4 w-4 mr-2" />
            Setup Certificates
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/events/${event._id}/certificates/issue`)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Issue Certificates
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 w-full">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate(`/events/${event._id}/participants`)}
        >
          <Users className="h-4 w-4 mr-2" />
          Manage Participants
        </Button>

        <Button
          variant={event.status === 'registration_open' ? 'destructive' : 'default'}
          className="flex items-center justify-center gap-2"
          onClick={handleRegistrationToggle}
          disabled={isUpdating || isEventPassed}
        >
          {event.status === 'registration_open' ? 'Close' : 'Open'} Registration
        </Button>

        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={handleShare}
          disabled={copying}
        >
          <Share2 className="h-4 w-4" />
          Share Event Link
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-primary transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{event.name}</h3>
            {event.isPublic && (
              <Globe className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
            {event.description}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/events/${event._id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => onDelete?.(event._id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center text-zinc-400">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {new Date(event.eventDate).toLocaleDateString()}
          </span>
        </div>
        <Badge 
          variant="outline" 
          className={getStatusColor(event.status)}
        >
          {event.status.replace('_', ' ')}
        </Badge>
        {isEventPassed && (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
            Event Ended
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {renderActionButtons()}
      </div>
    </div>
  );
}
