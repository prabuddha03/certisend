import { useEffect, useRef, useState } from 'react';
import { Input } from './input';
import { Command, CommandGroup, CommandItem } from './command';

interface Place {
  description: string;
  place_id: string;
}

interface PlacesAutocompleteProps {
  onSelect: (place: { address: string; location: { lat: number; lng: number } }) => void;
  defaultValue?: string;
  className?: string;
}

export function PlacesAutocomplete({ onSelect, defaultValue = '', className }: PlacesAutocompleteProps) {
  const [input, setInput] = useState(defaultValue);
  const [predictions, setPredictions] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required)
      const dummyElement = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(dummyElement);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const getPlacePredictions = (input: string) => {
    if (!input || !autocompleteService.current) return;

    autocompleteService.current.getPlacePredictions(
      {
        input,
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'IN' },
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 5));
          setIsOpen(true);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  };

  const handleSelect = (place: Place) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: place.place_id,
        fields: ['formatted_address', 'geometry'],
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          setInput(result.formatted_address || '');
          setIsOpen(false);
          onSelect({
            address: result.formatted_address || '',
            location: {
              lat: result.geometry?.location?.lat() || 0,
              lng: result.geometry?.location?.lng() || 0,
            },
          });
        }
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          getPlacePredictions(e.target.value);
        }}
        placeholder="Search for a location..."
        onFocus={() => input && getPlacePredictions(input)}
      />
      
      {isOpen && predictions.length > 0 && (
        <Command className="absolute w-full top-full mt-1 z-[100]">
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {predictions.map((place) => (
              <CommandItem
                key={place.place_id}
                onSelect={() => handleSelect(place)}
                className="cursor-pointer hover:bg-accent"
                value={place.description}
              >
                {place.description}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      )}
    </div>
  );
}
