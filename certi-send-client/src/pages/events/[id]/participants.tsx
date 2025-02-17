import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Download, Info, MoreHorizontal, Search, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { participantService } from '@/api/services/participant.service';
import { Event } from '@/types/event.types';
import { eventService } from '@/api/services/event.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface Participant {
  _id: string;
  name: string;
  email: string;
  registrationNumber: string;
  status: 'registered' | 'approved' | 'attended' | 'certificate_generated' | 'certificate_claimed';
  checkInTime?: Date;
}

interface ParticipantDetails {
  registrationData: Record<string, string>;
}

export function ParticipantsList() {
  const { id } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadEventAndParticipants();
    }
  }, [id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
      loadEventAndParticipants();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    loadEventAndParticipants();
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadEventAndParticipants = async () => {
    try {
      const [eventData, participantsData] = await Promise.all([
        eventService.getEventById(id!),
        participantService.getParticipants(id!, {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: searchQuery
        })
      ]);
      
      setEvent(eventData.data.data);
      setParticipants(participantsData.data.data.participants);
      setTotalPages(Math.ceil(participantsData.data.data.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (participantId: string, attended: boolean) => {
    try {
      setUpdating(participantId);
      if (attended) {
        await participantService.updateStatus(participantId, 'attended');
        toast.success('Attendance marked successfully');
      } else {
        // When unchecking, revert to registered status
        await participantService.updateStatus(participantId, 'registered');
        toast.success('Attendance status reverted');
      }
      loadEventAndParticipants(); // Reload the list
    } catch (error) {
      toast.error('Failed to update attendance');
    } finally {
      setUpdating(null);
    }
  };

  const handleSendCertificate = async (participantId: string) => {
    try {
      setUpdating(participantId);
      await participantService.sendCertificate(participantId);
      toast.success('Certificate sent successfully');
      loadEventAndParticipants(); // Reload the list
    } catch (error) {
      toast.error('Failed to send certificate');
    } finally {
      setUpdating(null);
    }
  };

  const handleSendRegistrationMail = async (participantId: string) => {
    try {
      setUpdating(participantId);
      await participantService.sendRegistrationMail(participantId);
      toast.success('Registration mail sent successfully');
      loadEventAndParticipants();
    } catch (error) {
      toast.error('Failed to send registration mail');
    } finally {
      setUpdating(null);
    }
  };

  const handleViewDetails = (participant: ParticipantDetails) => {
    setSelectedParticipant(participant);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to={`/events/${id}`} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Participants</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/events/${id}/qr-attendance`}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Based Attendance
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export List
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Registration No.</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Attended</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {participants.map((participant) => (
                <tr key={participant._id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4 text-sm">{participant.registrationNumber}</td>
                  <td className="px-6 py-4">{participant.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{participant.email}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{participant.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(participant.status)
                    }`}>
                      {participant.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={participant.status === 'attended'}
                      onCheckedChange={(checked) => 
                        handleAttendanceChange(participant._id, checked as boolean)
                      }
                      disabled={
                        updating === participant._id || 
                        participant.status === 'certificate_generated' || 
                        participant.status === 'certificate_claimed'
                      }
                    />
                  </td>
                  <td className="px-6 py-4">
                    {participant.status === 'registered' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendRegistrationMail(participant._id)}
                        disabled={updating === participant._id}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Registration
                      </Button>
                    ) : participant.status === 'attended' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendCertificate(participant._id)}
                        disabled={updating === participant._id}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Certificate
                      </Button>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(participant)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {/* Add edit handler */}}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => {/* Add delete handler */}}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedParticipant && Object.entries(selectedParticipant.registrationData)
              .filter(([key]) => !['name', 'email', 'phone'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span className="text-zinc-400">{value}</span>
                </div>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'registered':
      return 'bg-blue-500/10 text-blue-500';
    case 'approved':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'attended':
      return 'bg-green-500/10 text-green-500';
    case 'certificate_generated':
      return 'bg-purple-500/10 text-purple-500';
    case 'certificate_claimed':
      return 'bg-teal-500/10 text-teal-500';
    default:
      return 'bg-zinc-500/10 text-zinc-500';
  }
}