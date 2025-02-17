import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { certificateService } from '@/api/services/certificate.service';
import { toast } from 'react-hot-toast';

export function ClaimCertificate() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = React.useState({
    eventCode: eventId ? `EVENT-${eventId.slice(-6)}` : '',
    name: '',
    phone: ''
  });

  const getInputBorderColor = (value: string) => {
    if (!value) return 'border-zinc-800';
    return 'border-green-500';
  };

  const getPhoneBorderColor = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 'border-zinc-800';
    if (digits.length === 10) return 'border-green-500';
    return 'border-red-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await certificateService.checkCertificate(eventId!, {
        phone: formData.phone.replace(/\D/g, '')
      });
      
      // Navigate to confirmation page with the search results
      navigate('/claim-certificate/confirmation', {
        state: {
          certificateData: response.data.found ? response.data.certificate : null,
          searchData: formData
        }
      });
    } catch (error) {
      toast.error('Failed to check certificate');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Claim Certificate</h1>
        <p className="text-zinc-400">
          Enter your details to claim your certificate
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Event Code
            </label>
            <Input 
              placeholder="Event code will appear here" 
              value={formData.eventCode}
              className={getInputBorderColor(formData.eventCode)}
              disabled={!!eventId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Participant's Name
            </label>
            <Input 
              placeholder="Enter your full name" 
              className={getInputBorderColor(formData.name)}
              onKeyPress={(e) => {
                if (/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const value = e.target.value.replace(/[0-9]/g, '');
                setFormData({...formData, name: value});
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Contact Number
            </label>
            <div className="flex gap-2">
              <select className="w-24 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-2 text-sm text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="+91" selected>🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+7">🇷🇺 +7</option>
                <option value="+55">🇧🇷 +55</option>
              </select>
              <Input 
                className={`flex-1 ${getPhoneBorderColor(formData.phone)}`}
                placeholder="Phone number" 
                type="text"
                maxLength={11}
                value={formData.phone}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  let formattedValue = value;
                  if (value.length > 5) {
                    formattedValue = value.slice(0,5) + ' ' + value.slice(5,10);
                  }
                  setFormData({...formData, phone: formattedValue});
                }}
              />
            </div>
          </div>
          <Button 
            type="submit"
            className="w-full bg-black hover:bg-zinc-800 text-white font-semibold transition-colors duration-200"
          >
            Claim
          </Button>
        </form>
      </div>
    </div>
  );
}