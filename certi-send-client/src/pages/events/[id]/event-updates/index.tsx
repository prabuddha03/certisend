import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Pin, Trash2, Edit } from 'lucide-react';
import { eventUpdateService } from '@/api/services/eventUpdate.service';
import { formatDistanceToNow, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { CreateUpdateDialog } from '@/components/ui/create-update-dialog';
import { UpdateDialog } from '@/components/ui/update-dialog';
import type { EventUpdate } from '@/api/services/eventUpdate.service';

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(parseISO(dateString)) + ' ago';
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '';
  }
};

export function EventUpdatesPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<EventUpdate[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<EventUpdate | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    
    const cleanup = eventUpdateService.getEventUpdatesWithPolling(
      eventId,
      setUpdates
    );

    return cleanup;
  }, [eventId]);

  const handleCreateUpdate = async (data: {
    title: string;
    content: string;
    type: 'announcement' | 'update' | 'reminder' | 'result';
  }) => {
    if (!eventId) {
      toast.error('Event ID is missing');
      return;
    }

    try {
      const response = await eventUpdateService.createUpdate(eventId, data);
      setUpdates(prevUpdates => [response.data.data, ...prevUpdates]);
      setIsCreateDialogOpen(false);
      toast.success('Update created successfully');
    } catch (error) {
      console.error('Failed to create update:', error);
      toast.error('Failed to create update');
    }
  };

  const handleUpdateUpdate = async (data: {
    title: string;
    content: string;
    type: 'announcement' | 'update' | 'reminder' | 'result';
  }) => {
    if (!selectedUpdate) return;
    
    try {
      const response = await eventUpdateService.updateUpdate(selectedUpdate._id, data);
      
      // Immediately update the specific update in the list
      setUpdates(prevUpdates => 
        prevUpdates.map(update => 
          update._id === selectedUpdate._id 
            ? { ...update, ...data, updatedAt: new Date().toISOString() }
            : update
        )
      );
      
      setIsUpdateDialogOpen(false);
      setSelectedUpdate(null);
      toast.success('Update modified successfully');
    } catch (error) {
      console.error('Failed to modify update:', error);
      toast.error('Failed to modify update');
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      // Immediately remove the update from UI
      setUpdates(prevUpdates => prevUpdates.filter(update => update._id !== updateId));
      
      // Then make the API call
      await eventUpdateService.deleteUpdate(updateId);
      toast.success('Update deleted successfully');
    } catch (error) {
      // If API call fails, revert the UI change
      const response = await eventUpdateService.getEventUpdates(eventId!);
      if (response.data?.data) {
        setUpdates(response.data.data);
      }
      console.error('Failed to delete update:', error);
      toast.error('Failed to delete update');
    }
  };

  const handleTogglePin = async (updateId: string) => {
    try {
      await eventUpdateService.togglePin(updateId);
      toast.success('Pin status updated');
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

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
          <h1 className="text-2xl font-bold">Timeline Updates</h1>
        </div>
        
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Update
        </Button>
      </div>

      <div className="space-y-4">
        {updates.map((update) => {
          // Validate update object
          if (!update || !update._id) return null;

          return (
            <div
              key={update._id}
              className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{update.title}</h3>
                    {update.pinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {formatDate(update.createdAt)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePin(update._id)}
                  >
                    <Pin className={`h-4 w-4 ${update.pinned ? 'text-primary' : 'text-zinc-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedUpdate(update);
                      setIsUpdateDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteUpdate(update._id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <p className="mt-4 text-zinc-300">{update.content}</p>
            </div>
          );
        })}
      </div>

      <CreateUpdateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUpdate}
      />

      <UpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        onSubmit={handleUpdateUpdate}
        defaultValues={selectedUpdate}
      />
    </div>
  );
}