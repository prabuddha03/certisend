import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Award, Plus, Pencil, Trash2, Check, Mail, FileCheck, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateSetupModal } from './certificate-setup-modal';
import { eventService } from '@/api/services/event.service';
import { toast } from 'react-hot-toast';
import { Progress } from "@/components/ui/progress";

export function CertificateManagement() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'appreciation' | 'participation' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuingProgress, setIssuingProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      const response = await eventService.getEventById(eventId!);
      setEvent(response.data.data);
      console.log('Event data loaded:', response.data.data);
      console.log('isCertificatesIssued status:', response.data.data.isCertificatesIssued);
    } catch (error) {
      toast.error('Failed to load event data');
      console.error('Error loading event data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificates = async () => {
    try {
      setIsIssuing(true);
      setShowProgress(true);
      setIssuingProgress(0);

      // First get the count of attended participants
      const countResponse = await eventService.getAttendedParticipantsCount(eventId!);
      const totalParticipants = countResponse.data.count;
      const batchSize = 50;
      const totalBatches = Math.ceil(totalParticipants / batchSize);
      
      let processedCount = 0;

      // Process in batches
      for (let batch = 0; batch < totalBatches; batch++) {
        const response = await eventService.issueCertificatesInBatch(eventId!, {
          skip: batch * batchSize,
          limit: batchSize
        });

        processedCount += response.data.processed;
        setIssuingProgress((processedCount / totalParticipants) * 100);
      }

      toast.success('All certificates issued successfully');
      await loadEventData();
    } catch (error) {
      toast.error('Failed to issue certificates');
    } finally {
      setIsIssuing(false);
      setTimeout(() => setShowProgress(false), 2000);
    }
  };

  const handleDelete = async (type: 'appreciation' | 'participation') => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await eventService.deleteTemplate(eventId!, type);
      toast.success('Template deleted successfully');
      loadEventData();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const hasTemplate = (type: 'appreciation' | 'participation') => {
    return type === 'appreciation' ? event?.isAppreciationTemplate : event?.isParticipationTemplate;
  };

  const handleCopyClaimLink = () => {
    const claimUrl = `${window.location.origin}/events/${eventId}/claim`;
    navigator.clipboard.writeText(claimUrl);
    toast.success('Claim link copied to clipboard!');
  };

  console.log('isCertificatesIssued:', event?.isCertificatesIssued);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Certificate Management</h1>
        <div className="flex flex-col gap-4 w-full max-w-md">
          {showProgress && (
            <div className="space-y-2">
              <Progress value={issuingProgress} />
              <p className="text-sm text-zinc-400 text-center">
                Issuing certificates... {Math.round(issuingProgress)}%
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {event?.isCertificatesIssued ? (
              <Button 
                onClick={handleCopyClaimLink}
                variant="outline"
              >
                <Link className="h-4 w-4 mr-2" />
                Share Claim Link
              </Button>
            ) : (
              <Button 
                onClick={handleIssueCertificates} 
                disabled={isIssuing || (!event?.isAppreciationTemplate && !event?.isParticipationTemplate)}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Issue All Certificates
              </Button>
            )}
            <Button variant="outline" disabled={true}>
              <Mail className="h-4 w-4 mr-2" />
              Email All Certificates
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appreciation Certificate Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Certificate of Appreciation</h2>
              {hasTemplate('appreciation') && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
            {hasTemplate('appreciation') ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedType('appreciation');
                    setIsSetupModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete('appreciation')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => {
                  setSelectedType('appreciation');
                  setIsSetupModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Setup Template
              </Button>
            )}
          </div>
        </div>

        {/* Participation Certificate Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Certificate of Participation</h2>
              {hasTemplate('participation') && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
            {hasTemplate('participation') ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedType('participation');
                    setIsSetupModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete('participation')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => {
                  setSelectedType('participation');
                  setIsSetupModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Setup Template
              </Button>
            )}
          </div>
        </div>
      </div>

      <CertificateSetupModal 
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        certificateType={selectedType}
        eventId={eventId!}
        onSuccess={loadEventData}
      />
    </div>
  );
}