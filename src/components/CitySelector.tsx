import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

const CANADIAN_CITIES = [
  "Vancouver",
  "Toronto",
  "Montreal",
  "Calgary",
  "Ottawa",
  "Edmonton",
  "Winnipeg",
  "Quebec City",
  "Hamilton",
  "Victoria",
];

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const CitySelector = ({ selectedCity, onCityChange }: CitySelectorProps) => {
  return (
    <Select value={selectedCity} onValueChange={onCityChange}>
      <SelectTrigger className="w-[180px]">
        <MapPin className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Select city" />
      </SelectTrigger>
      <SelectContent>
        {CANADIAN_CITIES.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CitySelector;