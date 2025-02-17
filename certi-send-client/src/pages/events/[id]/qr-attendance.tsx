import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { participantService } from '@/api/services/participant.service';

export function QrAttendance() {
  const { id } = useParams<{ id: string }>();
  const [scanning, setScanning] = useState(false);
  const [html5Qrcode, setHtml5Qrcode] = useState<Html5Qrcode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const qrScanner = new Html5Qrcode("reader");
    setHtml5Qrcode(qrScanner);

    return () => {
      if (qrScanner.isScanning) {
        qrScanner.stop().then(() => {
          qrScanner.clear();
        }).catch(err => {
          console.error("Failed to stop scanner:", err);
        });
      }
    };
  }, []);

  const processQRCode = async (decodedText: string) => {
    if (isProcessing) {
      toast('Please wait a moment...', {
        icon: '⏳',
        duration: 2000,
        style: {
          background: '#F5F5F5',
          color: '#333',
          fontSize: '16px',
          padding: '16px',
        },
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await participantService.attendWithQR(decodedText, 'attended');
      
      // Show success toast with participant name
      toast.success(`${response.data.name} marked present! ✅`, {
        duration: 3000,
        style: {
          background: '#059669',
          color: '#FFFFFF',
          fontSize: '18px',
          padding: '16px 24px',
          minWidth: '300px',
        },
      });
      
      // Force a cooldown period
      await html5Qrcode?.pause();
      
      setTimeout(async () => {
        setIsProcessing(false);
        await html5Qrcode?.resume();
      }, 3000);

    } catch (error) {
      console.error("Failed to mark attendance:", error);
      toast('Please try scanning again', {
        icon: '🔄',
        style: {
          background: '#F5F5F5',
          color: '#333',
          fontSize: '16px',
          padding: '16px',
        },
      });
      setIsProcessing(false);
    }
  };

  const startScanning = async () => {
    if (!html5Qrcode) {
      toast.error('Scanner not initialized');
      return;
    }

    try {
      setScanning(true);
      const cameraConfig = { facingMode: "environment" };
      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5Qrcode.start(
        cameraConfig,
        qrConfig,
        processQRCode,
        (errorMessage) => {
          console.debug("QR Scan error:", errorMessage);
        }
      );
      
    } catch (err) {
      console.error("Failed to start camera:", err);
      toast.error('Failed to start camera. Please ensure camera permissions are granted.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    console.log("Stopping scanner...");
    if (!html5Qrcode) {
      toast.error('Scanner not initialized');
      return;
    }

    try {
      await html5Qrcode.stop();
      console.log("Scanner stopped successfully");
      setScanning(false);
    } catch (err) {
      console.error("Failed to stop scanner:", err);
      toast.error('Failed to stop scanner');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to={`/events/${id}/participants`} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Participants
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">QR Based Attendance</h1>
        </div>
        <Button 
          variant="outline"
          onClick={scanning ? stopScanning : startScanning}
        >
          {scanning ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Start Scanner
            </>
          )}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-4 rounded-lg shadow-md">
        <div 
          id="reader" 
          style={{
            width: '100%',
            minHeight: '500px'
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto mt-4 text-center text-gray-600">
        <p>Click "Start Scanner" and position the QR code within the scanner frame to mark attendance.</p>
        {!scanning && <p className="mt-2 text-sm">Make sure to allow camera access when prompted.</p>}
      </div>
    </div>
  );
}