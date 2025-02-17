import { Event } from '@/types/event.types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';

interface Props {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

const getStatusLine = (status: string) => {
  switch (status) {
    case 'registration_open':
      return "absolute left-0 top-0 bottom-0 w-1 bg-green-500 hover:opacity-60 rounded-l-lg";
    case 'registration_closed':
      return "absolute left-0 top-0 bottom-0 w-1 bg-red-500 hover:opacity-60 rounded-l-lg";
    case 'draft':
      return "absolute left-0 top-0 bottom-0 w-1 bg-zinc-500 hover:opacity-60 rounded-l-lg";
    default:
      return "hidden"; // For completed events
  }
};

export function EventSidebar({ 
  events = [],
  selectedEvent, 
  onEventSelect, 
  onCreateNew,
  loading 
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Your Events</h2>
          <Link to="/events/create" className="w-full">
            <Button 
              onClick={onCreateNew}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="w-full p-3 rounded-lg border border-zinc-800">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : events.length === 0 ? (
            <div className="text-center text-zinc-400 py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events created yet</p>
              <p className="text-sm">Create your first event to get started</p>
            </div>
          ) : (
            events.map((event) => (
              <button
                key={event._id}
                onClick={() => onEventSelect(event)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 relative
                  ${selectedEvent?._id === event._id
                    ? 'bg-primary/10 border-2 border-primary shadow-[0_0_10px_rgba(0,0,0,0.1)]'
                    : 'border border-zinc-800 hover:border-zinc-700 hover:scale-105 hover:opacity-65 hover:bg-zinc-800/50'
                  } ${selectedEvent && selectedEvent._id !== event._id ? 'opacity-40' : 'opacity-100'}
                `}
              >
                <div className={getStatusLine(event.status)} />
                <div className="flex flex-col">
                  <h3 className="font-medium text-base truncate">{event.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}