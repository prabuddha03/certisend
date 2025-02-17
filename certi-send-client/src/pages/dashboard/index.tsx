import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, Edit, QrCode, Users, Calendar, Award, 
  CheckSquare, Share2, Mail, Globe, MoreVertical, Link as LinkIcon, Eye, Trophy, Megaphone, Handshake, Plus, Clock 
} from 'lucide-react';
import { Event } from '@/types/event.types';
import { EventSidebar } from './components/event-sidebar';
import { DashboardStats } from './components/dashboard-stats';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { eventService } from '@/api/services/event.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Common button class
const actionButtonClass = `
  h-20 flex items-center p-4 gap-4
  relative overflow-hidden group w-full
  border-zinc-800 hover:border-primary
  bg-zinc-900/50 hover:bg-zinc-900
  hover:x-translate-10
  shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]
  hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.2)]
  active:scale-[0.98] transition-all duration-200
  justify-start
  after:absolute after:inset-0 after:bg-gradient-to-r 
  after:from-primary/0 after:via-primary/5 after:to-primary/0 
  after:translate-x-[-200%] after:opacity-0
  hover:after:translate-x-[200%] hover:after:opacity-100
  after:transition-all after:duration-1000
  after:ease-in-out
`;

const iconContainerClass = `
  hover:x-translate-10
  p-2 rounded-lg bg-zinc-800 
  group-hover:bg-primary/20 transition-colors
  group-hover:scale-110 duration-200
`;

export function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copying, setCopying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault(); // Prevent browser's default find behavior
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getOrganizerEvents();
      if (response.success) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedEvent) return;
    const eventLink = `${window.location.origin}/events/${selectedEvent._id}`;
    try {
      setIsSharing(true);
      await navigator.clipboard.writeText(eventLink);
      toast.success('Event link copied');
    } catch (error) {
      toast.error('Failed to copy link');
    } finally {
      setTimeout(() => setIsSharing(false), 200); // Add delay for button animation
    }
  };

  const handlePublishEvent = async () => {
    if (!selectedEvent) return;
    try {
      setIsUpdating(true);
      await eventService.publishEvent(selectedEvent._id);
      
      // Update local state immediately
      const updatedEvent = { ...selectedEvent, status: 'registration_closed' as const };
      setSelectedEvent(updatedEvent);
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === selectedEvent._id ? updatedEvent : event
        )
      );
      
      toast.success('Event published successfully!');
    } catch (error) {
      toast.error('Failed to publish event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegistrationToggle = async () => {
    if (!selectedEvent) return;
    try {
      setIsUpdating(true);
      const isCurrentlyOpen = selectedEvent.status === 'registration_open';
      await eventService.toggleRegistration(selectedEvent._id, !isCurrentlyOpen);
      
      // Update local state immediately
      const newStatus = isCurrentlyOpen ? 'registration_closed' : 'registration_open';
      setSelectedEvent(prev => prev ? { ...prev, status: newStatus } : null);
      setEvents(prev => prev.map(event => 
        event._id === selectedEvent._id 
          ? { ...event, status: newStatus }
          : event
      ));
      
      toast.success(`Registration ${isCurrentlyOpen ? 'closed' : 'opened'} successfully!`);
    } catch (error) {
      toast.error('Failed to toggle registration');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (!selectedEvent) return;
    try {
      setIsUpdating(true);
      await eventService.togglePrivacy(selectedEvent._id, !selectedEvent.isPublic);
      
      // Update local state immediately
      const updatedEvent = { ...selectedEvent, isPublic: !selectedEvent.isPublic };
      setSelectedEvent(updatedEvent);
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === selectedEvent._id ? updatedEvent : event
        )
      );
      
      toast.success(`Event is now ${updatedEvent.isPublic ? 'public' : 'private'}`);
    } catch (error) {
      toast.error('Failed to update event privacy');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await eventService.deleteEvent(eventId);
      setSelectedEvent(null);
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-zinc-500/10 text-zinc-500';
      case 'registration_open':
        return 'bg-green-500/10 text-green-500';
      case 'registration_closed':
        return 'bg-red-500/10 text-red-500';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-zinc-500/10 text-zinc-500';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isEventPassed = selectedEvent ? new Date(selectedEvent.eventDate) < new Date() : false;

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r border-zinc-800 flex flex-col h-screen">
        {selectedEvent ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex-shrink-0">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search events... (⌘/Ctrl + F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-md 
                  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary 
                  focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <EventSidebar
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onEventSelect={setSelectedEvent}
                onCreateNew={() => navigate('/events/create')}
                loading={loading}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <EventSidebar
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onEventSelect={setSelectedEvent}
              onCreateNew={() => navigate('/events/create')}
              loading={loading}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className={`transition-opacity duration-200 ${selectedEvent ? 'opacity-20' : 'opacity-100'}`}>
            <DashboardStats />
          </div>

          {!selectedEvent ? (
            <div className="mt-8">
              <div className="flex justify-end mb-8">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search events... (⌘/Ctrl + F)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-96 px-4 py-3 text-lg bg-zinc-900 border border-zinc-800 rounded-lg
                    placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary 
                    focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <Link 
                to="/events/create"
                className="block h-[calc(100vh-24rem)] border-2 border-dashed border-zinc-800 
                  rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200
                  flex flex-col items-center justify-center group"
              >
                <Plus className="h-24 w-24 text-zinc-600 group-hover:text-primary mb-6 transition-colors" />
                <span className="text-xl font-medium text-zinc-400 group-hover:text-primary transition-colors">
                  Create New Event
                </span>
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-white tracking-tight">{selectedEvent.name}</h1>
                    {selectedEvent.isPublic && <Globe className="h-5 w-5 text-blue-400" />}
                  </div>

                  <div className="mt-3">
                    <Badge 
                      variant="outline" 
                      className={getStatusBadgeVariant(selectedEvent.status)}
                    >
                      {formatStatus(selectedEvent.status)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <time className="text-sm font-medium">
                      {new Date(selectedEvent.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>

                  <p className="mt-3 text-base text-zinc-400 leading-relaxed">{selectedEvent.description}</p>
                </div>
                
                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-4">
                    {selectedEvent.status !== 'draft' && !isEventPassed && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-400">Privacy</span>
                          <button
                            onClick={handlePrivacyToggle}
                            disabled={isUpdating}
                            className={`relative inline-flex h-8 items-center px-4 py-2 rounded-full transition-colors duration-200
                              ${selectedEvent.isPublic 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className={`absolute inset-y-1 left-1 flex items-center justify-center w-6 h-6 
                              rounded-full bg-white transition-transform duration-200 transform
                              ${selectedEvent.isPublic ? 'translate-x-14' : 'translate-x-0'}`}
                            />
                            <span className={`ml-4 text-xs font-medium transition-colors duration-200
                              ${selectedEvent.isPublic ? 'text-white -translate-x-5' : 'text-zinc-300'}`}>
                              {selectedEvent.isPublic ? 'PUBLIC' : 'PRIVATE'}
                            </span>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-400">Registration</span>
                          <button
                            onClick={handleRegistrationToggle}
                            disabled={isUpdating || isEventPassed}
                            className={`relative inline-flex h-8 items-center px-4 py-2 rounded-full transition-colors duration-200
                              ${selectedEvent.status === 'registration_open' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-zinc-700 hover:bg-zinc-600'
                              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className={`absolute inset-y-1 left-1 flex items-center justify-center w-6 h-6 
                              rounded-full bg-white transition-transform duration-200 transform
                              ${selectedEvent.status === 'registration_open' ? 'translate-x-8' : 'translate-x-0'}`}
                            />
                            <span className={`ml-4 text-xs font-medium transition-colors duration-200
                              ${selectedEvent.status === 'registration_open' ? 'text-white -translate-x-5' : 'text-zinc-300'}`}>
                              {selectedEvent.status === 'registration_open' ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      disabled={isSharing}
                      className={`flex items-center gap-2 transition-all duration-200 
                        ${isSharing ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}
                        hover:bg-primary hover:text-white`}
                    >
                      <LinkIcon className="h-4 w-4" />
                      Share
                    </Button>
                    {selectedEvent.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handlePublishEvent}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 transition-all duration-200 
                          ${isUpdating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}
                          hover:bg-primary hover:text-white`}
                      >
                        <Globe className="h-4 w-4" />
                        Publish Event
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/events/${selectedEvent._id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleDeleteEvent(selectedEvent._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedEvent.totalRegistrations || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedEvent.pageViews || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedEvent.certificatesIssued || 0}</div>
                  </CardContent>
                </Card>

                {selectedEvent.isApprovalRequired && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approved Participants</CardTitle>
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedEvent.approvedParticipants || 0}</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {selectedEvent.status !== 'draft' && (
                  <>
                    <Button 
                      variant="outline"
                      className={actionButtonClass}
                      onClick={() => navigate(`/events/${selectedEvent._id}/certificates`)}
                    >
                      <div className={iconContainerClass}>
                        <Award className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">Manage Certificates</span>
                        <span className="text-sm text-zinc-400 group-hover:text-primary/60">Generate & manage awards</span>
                      </div>
                    </Button>

                    {isEventPassed && (
                      <Button 
                        variant="default"
                        className={actionButtonClass}
                        onClick={() => navigate(`/events/${selectedEvent._id}/winners`)}
                      >
                        <div className={iconContainerClass}>
                          <Trophy className="h-8 w-8 text-primary group-hover:text-primary transition-all" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="font-semibold text-primary text-lg">Announce Winners</span>
                          <span className="text-sm text-primary/60">Celebrate top performers</span>
                        </div>
                      </Button>
                    )}

                    {selectedEvent.isApprovalRequired && (
                      <Button 
                        variant="outline"
                        className={actionButtonClass}
                        onClick={() => navigate(`/events/${selectedEvent._id}/approvals`)}
                      >
                        <div className={iconContainerClass}>
                          <CheckSquare className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">Manage Approvals</span>
                          <span className="text-sm text-zinc-400 group-hover:text-primary/60">Review participant requests</span>
                        </div>
                      </Button>
                    )}

                    <Button 
                      variant="outline"
                      className={actionButtonClass}
                      onClick={() => navigate(`/events/${selectedEvent._id}/qr-attendance`)}
                    >
                      <div className={iconContainerClass}>
                        <QrCode className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">QR Attendance</span>
                        <span className="text-sm text-zinc-400 group-hover:text-primary/60">Track event check-ins</span>
                      </div>
                    </Button>

                    <Button 
                      variant="outline"
                      className={actionButtonClass}
                      onClick={() => navigate(`/events/${selectedEvent._id}/updates`)}
                    >
                      <div className={iconContainerClass}>
                        <Clock className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">Timeline Updates</span>
                        <span className="text-sm text-zinc-400 group-hover:text-primary/60">Manage event announcements</span>
                      </div>
                    </Button>

                    <Button 
                      variant="outline"
                      className={actionButtonClass}
                      onClick={() => navigate(`/events/${selectedEvent._id}/participants`)}
                    >
                      <div className={iconContainerClass}>
                        <Users className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">Manage Participants</span>
                        <span className="text-sm text-zinc-400 group-hover:text-primary/60">Track event attendance</span>
                      </div>
                    </Button>

                    <Button 
                      variant="outline"
                      className={actionButtonClass}
                      onClick={() => navigate(`/events/${selectedEvent._id}/marketing`)}
                    >
                      <div className={iconContainerClass}>
                        <Megaphone className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">Manage Marketing</span>
                        <span className="text-sm text-zinc-400 group-hover:text-primary/60">Promote your event</span>
                      </div>
                    </Button>

                    <Button 
                      variant="outline"
                      className={actionButtonClass}
                      onClick={() => navigate(`/events/${selectedEvent._id}/social`)}
                    >
                      <div className={iconContainerClass}>
                        <Share2 className="h-8 w-8 text-zinc-400 group-hover:text-primary transition-all" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="font-semibold text-zinc-200 group-hover:text-primary text-lg">Social Sharing</span>
                        <span className="text-sm text-zinc-400 group-hover:text-primary/60">Spread the word</span>
                      </div>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}