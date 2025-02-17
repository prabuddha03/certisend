export const steps = [
  'Event Type',
  'Basic Details',
  'Registration Form',
  'Sub Events',
  'Review',
];

interface Props {
  currentStep: number;
  eventType: 'individual' | 'mega';
}

export function EventCreationStepper({ currentStep, eventType }: Props) {
  const filteredSteps = eventType === 'individual' 
    ? steps.filter(step => step !== 'Sub Events')
    : steps;

  return (
    <div className="w-full">
      <div className="flex justify-between">
        {filteredSteps.map((step, index) => (
          <div
            key={step}
            className={`flex items-center ${
              index < currentStep
                ? 'text-primary'
                : index === currentStep
                ? 'text-white'
                : 'text-zinc-500'
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index <= currentStep ? 'border-primary' : 'border-zinc-500'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm mt-1">{step}</span>
            </div>
            {index < filteredSteps.length - 1 && (
              <div
                className={`w-full h-0.5 mt-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-zinc-500'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
