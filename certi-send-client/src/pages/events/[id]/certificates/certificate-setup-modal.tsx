import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Plus, X, Crop as CropIcon, RotateCcw } from 'lucide-react';
import Draggable from 'react-draggable';
import { toast } from 'react-hot-toast';
import { eventService } from '@/api/services/event.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  certificateType: 'appreciation' | 'participation' | null;
  eventId: string;
  onSuccess: () => void;
}

const CERTIFICATE_SIZES = {
  'landscape-a4': { width: 1920, height: 1357, aspect: 1920/1357 }, // 297mm × 210mm (A4)
  'portrait-a4': { width: 1357, height: 1920, aspect: 1357/1920 }, // 210mm × 297mm (A4)
};

export function CertificateSetupModal({ isOpen, onClose, certificateType, eventId, onSuccess }: Props) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [certificateSize, setCertificateSize] = useState<keyof typeof CERTIFICATE_SIZES>('landscape-a4');
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [placeholders, setPlaceholders] = useState<Array<{
    type: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setImage(compressedImage);
        setImagePreview(URL.createObjectURL(compressedImage));
        setShowCropModal(true); // Show crop modal immediately after upload
      } catch (error) {
        toast.error('Error processing image');
        console.error('Image processing error:', error);
      }
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions while maintaining aspect ratio
          const maxWidth = 1920;
          const maxHeight = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCropComplete = (crop: Crop) => {
    if (!imageRef.current || !crop.width || !crop.height) return;

    const canvas = document.createElement('canvas');
    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const { width, height } = CERTIFICATE_SIZES[certificateSize];
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
          setImage(croppedFile);
          setImagePreview(URL.createObjectURL(croppedFile));
          setShowCropModal(false);
        }
      },
      'image/jpeg',
      0.8
    );
  };

  const addPlaceholder = (type: string) => {
    setPlaceholders([
      ...placeholders,
      { type, x: 0, y: 0, fontSize: 24, color: '#000000' }
    ]);
  };

  const handlePlaceholderDrag = (index: number, data: { x: number; y: number }) => {
    const newPlaceholders = [...placeholders];
    newPlaceholders[index] = {
      ...newPlaceholders[index],
      x: data.x,
      y: data.y
    };
    setPlaceholders(newPlaceholders);
  };

  const resetImage = () => {
    setImage(null);
    setImagePreview('');
    setPlaceholders([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!image || !placeholders.length) {
      toast.error('Please upload an image and add placeholders');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', image);
      formData.append('type', certificateType!);
      formData.append('config', JSON.stringify({
        dimensions: CERTIFICATE_SIZES[certificateSize],
        format: 'A4',
        orientation: certificateSize.includes('landscape') ? 'landscape' : 'portrait'
      }));
      formData.append('placeholders', JSON.stringify(placeholders));
      formData.append('metadata', JSON.stringify({
        eventName: 'Your Event Name',
        eventDate: new Date().toISOString(),
        organizerName: 'Organizer Name'
      }));

      await eventService.uploadCertificateTemplate(eventId, formData);
      toast.success('Certificate template saved successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save certificate template');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`max-w-4xl ${certificateSize === 'portrait-a4' ? 'h-[90vh]' : ''}`}>
          <DialogHeader>
            <DialogTitle>
              Setup {certificateType?.charAt(0).toUpperCase()}{certificateType?.slice(1)} Certificate
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Select 
                value={certificateSize} 
                onValueChange={(value: keyof typeof CERTIFICATE_SIZES) => {
                  setCertificateSize(value);
                  if (imagePreview) {
                    setShowCropModal(true); // Re-crop when size changes
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select certificate size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape-a4">A4 Landscape</SelectItem>
                  <SelectItem value="portrait-a4">A4 Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!imagePreview ? (
              <div 
                className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-zinc-400" />
                <p className="text-sm text-zinc-400">
                  Click to upload certificate template
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Certificate Preview"
                  className="w-full rounded-lg"
                />
                {/* Placeholders */}
                {placeholders.map((placeholder, index) => (
                  <Draggable
                    key={index}
                    defaultPosition={{ x: placeholder.x, y: placeholder.y }}
                    onDrag={(_, data) => handlePlaceholderDrag(index, data)}
                  >
                    <div className="absolute cursor-move bg-blue-500/20 p-2 rounded">
                      {placeholder.type}
                    </div>
                  </Draggable>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {imagePreview && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => addPlaceholder('name')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Name
                  </Button>
                  <Button onClick={() => addPlaceholder('position')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </Button>
                  <Button onClick={() => addPlaceholder('date')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Date
                  </Button>
                  <Button variant="destructive" onClick={resetImage}>
                    <X className="h-4 w-4 mr-2" />
                    Delete Image
                  </Button>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={uploading}>
                    Save Template
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={() => setShowCropModal(false)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={handleCropComplete}
              aspect={CERTIFICATE_SIZES[certificateSize].aspect}
              className="max-h-[60vh] overflow-auto"
            >
              <img
                ref={imageRef}
                src={imagePreview}
                alt="Certificate Preview"
                className="max-w-full"
              />
            </ReactCrop>
            <p className="text-sm text-zinc-400 mt-2 text-center">
              Drag corners to adjust the crop area. Click outside when done.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}