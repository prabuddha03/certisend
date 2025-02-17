import { Card } from '@/components/ui/card';
import { FileSpreadsheet, Calendar, Award } from 'lucide-react';

interface Props {
  onSelect: (type: 'scratch' | 'post-registration' | 'certification') => void;
}

export function EventTypeSelector({ onSelect }: Props) {
  const types = [
    {
      id: 'scratch',
      title: 'From Scratch',
      description: 'Create an event from start to finish with registration form',
      icon: Calendar,
    },
    {
      id: 'post-registration',
      title: 'After Registration',
      description: 'Create certificates for an event that already happened',
      icon: FileSpreadsheet,
    },
    {
      id: 'certification',
      title: 'Certification Only',
      description: 'Generate and manage certificates without registration',
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {types.map((type) => (
        <Card
          key={type.id}
          className="p-6 cursor-pointer hover:border-primary transition-colors"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={() => onSelect(type.id as any)}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <type.icon className="h-12 w-12 text-primary" />
            <h3 className="text-lg font-semibold">{type.title}</h3>
            <p className="text-sm text-gray-500">{type.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}