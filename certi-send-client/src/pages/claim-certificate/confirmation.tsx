import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Download, ArrowLeft } from 'lucide-react';
import { certificateService } from '@/api/services/certificate.service';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export function CertificateConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { certificateData, searchData } = location.state || {};
  const [isGenerating, setIsGenerating] = useState(false);

  if (!searchData) {
    navigate('/claim-certificate');
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await certificateService.generateCertificate({
        certificateId: certificateData._id,
        certificateNumber: certificateData.certificateNumber,
        templateUrl: certificateData.templateId.templateUrl,
        type: certificateData.templateId.type,
        config: certificateData.templateId.config,
        placeholders: certificateData.templateId.placeholders,
        recipientData: certificateData.recipientData,
        metadata: certificateData.templateId.metadata
      });

      // Handle PDF download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateData.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Certificate generated successfully!');
    } catch (error) {
      toast.error('Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col items-center gap-4">
          {certificateData ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-xl font-semibold">Certificate Found!</h2>
              <p className="text-zinc-400">
                We found your certificate for {searchData.name}
              </p>
              <Button 
                onClick={handleGenerate} 
                className="w-full mt-4"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Certificate'}
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-xl font-semibold">No Certificate Found</h2>
              <p className="text-zinc-400">
                We couldn't find a certificate for {searchData.name}
              </p>
              <p className="text-zinc-500 text-sm">
                Please check your details and try again
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}