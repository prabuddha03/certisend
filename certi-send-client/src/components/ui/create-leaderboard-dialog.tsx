import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Pencil, Search, Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { participantService } from '@/api/services/participant.service';
import { toast } from 'react-hot-toast';

interface Participant {
  _id: string;
  name: string;
}

interface CreateLeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    participants: Array<{
      participantId: string;
      name: string;
      points: number;
      metrics?: Record<string, number | string>;
    }>;
    settings: {
      sortBy: 'points' | 'time' | 'custom';
      orderBy: 'asc' | 'desc';
      displayFields: string[];
    };
  }) => void;
  attendedParticipants: Participant[];
  initialData?: Leaderboard | null;
  mode: 'create' | 'edit';
  eventId: string;
}

export function CreateLeaderboardDialog({
  open,
  onOpenChange,
  onSubmit,
  attendedParticipants = [],
  initialData,
  mode = 'create',
  eventId
}: CreateLeaderboardDialogProps) {
  const [participants, setParticipants] = useState<Array<{
    participantId: string;
    name: string;
    points: number;
    metrics: Record<string, number | string>;
  }>>([]);
  const [sortBy, setSortBy] = useState<'points' | 'time' | 'custom'>('points');
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [allParticipants, setAllParticipants] = useState<Array<{
    participantId: string;
    name: string;
    points: number;
    metrics: Record<string, number | string>;
  }>>([]);

  const loadParticipants = async (reset = false) => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const response = await participantService.getParticipants(eventId, {
        status: 'attended'
      });

      if (response.data?.data?.participants) {
        const newParticipants = response.data.data.participants.map(p => ({
          participantId: p._id,
          name: p.name,
          points: 0,
          metrics: {}
        }));

        setAllParticipants(newParticipants);
        setParticipants(newParticipants);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setParticipants(initialData.participants);
        setAllParticipants(initialData.participants);
        setSortBy(initialData.settings.sortBy);
        setOrderBy(initialData.settings.orderBy);
        setTotal(initialData.participants.length);
      } else {
        loadParticipants();
      }
    }
  }, [open, mode, initialData]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setParticipants(allParticipants);
      return;
    }

    const filtered = allParticipants.filter(participant =>
      participant.name.toLowerCase().includes(query.toLowerCase())
    );
    setParticipants(filtered);
    setTotal(filtered.length);
  };

  const handleSubmit = () => {
    onSubmit({
      participants,
      settings: {
        sortBy,
        orderBy,
        displayFields: ['points']
      }
    });
  };

  const handlePointsChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index].points = Number(value) || 0;
    setParticipants(newParticipants);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background border-zinc-800">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {mode === 'edit' ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit Leaderboard
              </>
            ) : (
              <>
                <Trophy className="h-5 w-5" />
                Create Leaderboard
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-6">
            <div className="flex items-center justify-between gap-6">
              <div className="grid gap-2 flex-1">
                <Label className="text-sm font-medium">Sort By</Label>
                <Select value={sortBy} onValueChange={(value: 'points' | 'time' | 'custom') => setSortBy(value)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-700">
                    <SelectItem className="hover:bg-zinc-800 focus:bg-zinc-800" value="points">Points</SelectItem>
                    <SelectItem className="hover:bg-zinc-800 focus:bg-zinc-800" value="time">Time</SelectItem>
                    <SelectItem className="hover:bg-zinc-800 focus:bg-zinc-800" value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2 flex-1">
                <Label className="text-sm font-medium">Order</Label>
                <Select value={orderBy} onValueChange={(value: 'asc' | 'desc') => setOrderBy(value)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-700">
                    <SelectItem className="hover:bg-zinc-800 focus:bg-zinc-800" value="desc">Highest First</SelectItem>
                    <SelectItem className="hover:bg-zinc-800 focus:bg-zinc-800" value="asc">Lowest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border rounded-lg border-zinc-700">
            <div className="p-4 border-b border-zinc-700 bg-muted/30">
              <h3 className="font-semibold mb-1">
                {mode === 'edit' ? 'Edit Points' : 'Assign Points'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mode === 'edit' 
                  ? 'Update points for each participant'
                  : 'Enter points for each participant to create the leaderboard'
                } ({total} participants)
              </p>
            </div>

            <div className="p-4 border-b border-zinc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search participants by name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-700"
                />
              </div>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="p-4 space-y-4">
                {participants.map((participant, index) => (
                  <div 
                    key={participant.participantId} 
                    className="flex items-center gap-4 p-3 rounded-md border border-zinc-800 bg-background/50"
                  >
                    <span className="text-sm text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{participant.name}</p>
                    </div>
                    <Input
                      type="number"
                      placeholder="Points"
                      className="w-24 bg-zinc-950 border-zinc-700"
                      value={participant.points}
                      onChange={(e) => handlePointsChange(index, e.target.value)}
                    />
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-700">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'edit' ? 'Save Changes' : 'Create Leaderboard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}