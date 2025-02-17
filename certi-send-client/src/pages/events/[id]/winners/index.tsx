import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal, Download, Eye, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateLeaderboardDialog } from '@/components/ui/create-leaderboard-dialog';
import { leaderboardService } from '@/api/services/leaderboard.service';
import { participantService } from '@/api/services/participant.service';
import type { LeaderboardParticipant, Leaderboard } from '@/api/services/leaderboard.service';
import toast from 'react-hot-toast';

const sortParticipants = (
  participants: LeaderboardParticipant[],
  sortBy: 'points' | 'time' | 'custom',
  orderBy: 'asc' | 'desc'
) => {
  return [...participants].sort((a, b) => {
    const compareValue = sortBy === 'points' ? 
      a.points - b.points : 
      (a.metrics?.[sortBy] || 0) - (b.metrics?.[sortBy] || 0);
    
    return orderBy === 'asc' ? compareValue : -compareValue;
  });
};

export function WinnersPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attendedParticipants, setAttendedParticipants] = useState<Array<{ _id: string; name: string }>>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    loadAttendedParticipants();
    loadLeaderboard();
  }, [eventId]);

  const loadAttendedParticipants = async () => {
    try {
      const response = await participantService.getParticipants(eventId, { status: 'attended' });
      console.log('Raw Response:', response);
      
      if (response.data?.data?.participants) {
        console.log('Setting participants:', response.data.data.participants);
        setAttendedParticipants(response.data.data.participants);
      } else {
        console.log('Invalid data structure:', response);
        setAttendedParticipants([]);
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast.error('Failed to load participants');
      setAttendedParticipants([]);
    }
  };

  const loadLeaderboard = async () => {
    if (!eventId) return;
    try {
      const response = await leaderboardService.getLeaderboard(eventId);
      console.log('Full Leaderboard Response:', response);
      
      const leaderboardData = response.data?.data?.data;
      console.log('Extracted Leaderboard Data:', leaderboardData);

      if (leaderboardData && Array.isArray(leaderboardData.participants)) {
        console.log('Setting Leaderboard:', leaderboardData);
        setLeaderboard(leaderboardData);
        setIsPublished(leaderboardData.isPublished || false);
      } else {
        console.log('Invalid or missing leaderboard data:', response);
        setLeaderboard(null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboard(null);
    }
  };

  const handleCreateLeaderboard = async (data: {
    participants: LeaderboardParticipant[];
    settings: {
      sortBy: 'points' | 'time' | 'custom';
      orderBy: 'asc' | 'desc';
      displayFields: string[];
    };
  }) => {
    if (!eventId) return;
    try {
      await leaderboardService.createLeaderboard(eventId, data);
      toast.success('Leaderboard created successfully');
      setIsCreateDialogOpen(false);
      loadLeaderboard();
    } catch (error) {
      toast.error('Failed to create leaderboard');
    }
  };

  const handlePublishLeaderboard = async () => {
    if (!eventId) return;
    try {
      await leaderboardService.publishLeaderboard(eventId);
      setIsPublished(true);
      toast.success('Leaderboard published successfully');
    } catch (error) {
      toast.error('Failed to publish leaderboard');
    }
  };

  const handleExportLeaderboard = async () => {
    if (!eventId) return;
    try {
      const response = await leaderboardService.exportLeaderboard(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leaderboard.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export leaderboard');
    }
  };

  const handleEditLeaderboard = async (data: {
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
  }) => {
    if (!eventId) return;
    try {
      await leaderboardService.updateLeaderboard(eventId, data);
      toast.success('Leaderboard updated successfully');
      setIsEditMode(false);
      loadLeaderboard();
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      toast.error('Failed to update leaderboard');
    }
  };

  const sortedParticipants = leaderboard ? 
    sortParticipants(
      leaderboard.participants,
      leaderboard.settings.sortBy,
      leaderboard.settings.orderBy
    ) : [];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Announce Winners</h1>
        </div>

        <div className="flex items-center gap-2">
          {leaderboard && (
            <>
              <Button
                variant="outline"
                onClick={handleExportLeaderboard}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {!isPublished && (
                <Button
                  variant="default"
                  onClick={handlePublishLeaderboard}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
            </>
          )}
          {!leaderboard && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Create Leaderboard
            </Button>
          )}
        </div>
      </div>

      {leaderboard && leaderboard.participants ? (
        <Tabs defaultValue="leaderboard">
          <TabsList>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="preview">Public Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Event Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedParticipants.map((participant, index) => (
                    <div
                      key={participant.participantId}
                      className="flex items-center justify-between p-4 rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          {index < 3 ? (
                            <Medal className={`h-4 w-4 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-zinc-400' :
                              'text-amber-600'
                            }`} />
                          ) : (
                            <span className="text-sm text-zinc-400">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{participant.name}</h3>
                          <p className="text-sm text-zinc-400">Points: {participant.points}</p>
                        </div>
                      </div>
                      
                      {participant.metrics && (
                        <div className="flex gap-4">
                          {Object.entries(participant.metrics).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-zinc-400">{key}: </span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="relative">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Eye className="h-8 w-8 text-zinc-400" />
              </div>
              {/* Preview content would mirror the leaderboard content */}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Leaderboard Yet</h2>
          <p className="text-zinc-400 mb-4">
            Create a leaderboard to announce winners for this event.
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Leaderboard
          </Button>
        </div>
      )}

      <CreateLeaderboardDialog
        open={isCreateDialogOpen || isEditMode}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditMode(false);
          }
        }}
        onSubmit={isEditMode ? handleEditLeaderboard : handleCreateLeaderboard}
        attendedParticipants={attendedParticipants}
        initialData={isEditMode ? leaderboard : null}
        mode={isEditMode ? 'edit' : 'create'}
      />
    </div>
  );
}