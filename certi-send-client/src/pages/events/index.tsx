import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Event } from '@/types/event.types';
import { eventService } from '@/api/services/event.service';
import { Input } from '@/components/ui/input';
import { PublicEventCard } from '@/components/events/event-card/PublicEventCard';
import { toast } from 'react-hot-toast';

export function ExploreEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getPublicEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events?.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event._id.includes(searchQuery)
  ) || [];

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Discover Events</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search events by name, description, or ID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <PublicEventCard key={event._id} event={event} />
        ))}

        {filteredEvents.length === 0 && (
          <div className="col-span-full text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
            <p className="text-zinc-400">No events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExploreEvents;