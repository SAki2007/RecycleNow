import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recycle, MapPin, AlertCircle } from "lucide-react";

interface Material {
  material: string;
  binType: string;
  instructions: string;
  specialNotes?: string;
  confidence: string;
  description: string;
  plasticType?: string;
  plasticCategory?: string;
}

interface ResultsDisplayProps {
  result: {
    materials: Material[];
    totalItems: number;
  };
  imagePreview: string | null;
  onReset: () => void;
}

const ResultsDisplay = ({ result, imagePreview, onReset }: ResultsDisplayProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 bg-card">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Analyzed item"
            className="w-full max-h-80 object-contain rounded-lg mb-6"
          />
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-card-foreground mb-2">
            {result.totalItems === 1 
              ? "Material Identified" 
              : `${result.totalItems} Materials Identified`}
          </h2>
        </div>

        <div className="space-y-6">
          {result.materials.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border border-border bg-card"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <Badge
                      className="text-base px-4 py-1.5 capitalize mb-3 bg-primary text-primary-foreground"
                    >
                      <Recycle className="w-4 h-4 mr-2" />
                      {item.material}
                    </Badge>
                    {item.plasticType && (
                      <Badge variant="outline" className="ml-2 mb-3">
                        {item.plasticType}
                      </Badge>
                    )}
                    {item.plasticCategory && (
                      <Badge variant="outline" className="ml-2 mb-3 capitalize">
                        {item.plasticCategory}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-sm">
                    {item.confidence} confidence
                  </Badge>
                </div>

                <div className="p-4 rounded-lg bg-accent">
                  <h3 className="font-semibold flex items-center text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    Recycling Bin
                  </h3>
                  <p className="text-sm font-medium">{item.binType}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Recycling Instructions</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.instructions}</p>
                </div>

                {item.specialNotes && (
                  <div
                    className="p-4 rounded-lg bg-accent border-l-4 border-primary"
                  >
                    <h3 className="font-semibold text-sm mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                      Special Notes
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.specialNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={onReset}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          Scan Another Item
        </Button>
      </div>
    </div>
  );
};

export default ResultsDisplay;