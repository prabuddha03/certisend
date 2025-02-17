import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const registrationSchema = z.object({
  registrationType: z.enum(['free', 'paid']),
  registrationFee: z.number().optional(),
  prizeMoney: z.number().optional(),
  participationType: z.enum(['solo', 'team', 'both']),
  teamSettings: z.object({
    enabled: z.boolean(),
    size: z.object({
      min: z.number().min(2).optional(),
      max: z.number().min(2).optional(),
    }).optional(),
  }).optional(),
});

interface Props {
  onSubmit: (data: z.infer<typeof registrationSchema>) => void;
  initialData?: z.infer<typeof registrationSchema>;
  eventType: 'individual' | 'mega';
}

export function RegistrationSettings({ onSubmit, initialData, eventType }: Props) {
  const { register, handleSubmit, watch, setValue } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: initialData || {
      registrationType: 'free',
      participationType: 'solo',
      teamSettings: {
        enabled: false,
      },
    },
  });

  const registrationType = watch('registrationType');
  const participationType = watch('participationType');
  const teamEnabled = watch('teamSettings.enabled');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Registration Settings</h3>
        
        <div className="space-y-2">
          <Label className="text-base">Registration Type</Label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                value="free"
                {...register('registrationType')}
                id="free"
              />
              <Label htmlFor="free">Free</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                value="paid"
                {...register('registrationType')}
                id="paid"
              />
              <Label htmlFor="paid">Paid</Label>
            </div>
          </div>
        </div>

        {registrationType === 'paid' && (
          <div className="space-y-2">
            <Label className="text-base">Registration Fee</Label>
            <Input
              type="number"
              placeholder="Enter amount in ₹"
              {...register('registrationFee', { valueAsNumber: true })}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-base">Prize Money</Label>
          <Input
            type="number"
            placeholder="Enter amount in ₹"
            {...register('prizeMoney', { valueAsNumber: true })}
          />
        </div>

        {eventType === 'individual' && (
          <>
            <div className="space-y-2">
              <Label className="text-base">Participation Type</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="solo"
                    {...register('participationType')}
                    id="solo"
                  />
                  <Label htmlFor="solo">Solo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="team"
                    {...register('participationType')}
                    id="team"
                  />
                  <Label htmlFor="team">Team</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="both"
                    {...register('participationType')}
                    id="both"
                  />
                  <Label htmlFor="both">Both</Label>
                </div>
              </div>
            </div>

            {(participationType === 'team' || participationType === 'both') && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={teamEnabled}
                    onCheckedChange={(checked) =>
                      setValue('teamSettings.enabled', checked)
                    }
                    id="team-enabled"
                  />
                  <Label htmlFor="team-enabled">Enable Team Registration</Label>
                </div>

                {teamEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base">Minimum Team Size</Label>
                      <Input
                        type="number"
                        placeholder="Min. members"
                        {...register('teamSettings.size.min', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">Maximum Team Size</Label>
                      <Input
                        type="number"
                        placeholder="Max. members"
                        {...register('teamSettings.size.max', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit">
          Continue to Registration Form
        </Button>
      </div>
    </form>
  );
}