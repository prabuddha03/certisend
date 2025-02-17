import { useParams } from 'react-router-dom';

export function EventCheckIn() {
  const { id } = useParams();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Event Check-in</h1>
      <p>Check-in page for event {id}</p>
    </div>
  );
}