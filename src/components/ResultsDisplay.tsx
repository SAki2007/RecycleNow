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
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6" style={{ boxShadow: "var(--shadow-elevated)" }}>
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Analyzed item"
            className="w-full max-h-64 object-contain rounded-lg mb-6"
            style={{ boxShadow: "var(--shadow-medium)" }}
          />
        )}

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-card-foreground">
            {result.totalItems === 1 
              ? "Material Identified" 
              : `${result.totalItems} Materials Identified`}
          </h2>
        </div>

        <div className="space-y-6">
          {result.materials.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border"
              style={{ 
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--accent))"
              }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge
                      className="text-base px-3 py-1 capitalize mb-2"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Recycle className="w-4 h-4 mr-2" />
                      {item.material}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {item.confidence}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-background/50">
                  <h3 className="font-semibold flex items-center text-sm mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    Recycling Bin
                  </h3>
                  <p className="text-sm font-medium">{item.binType}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-1">Instructions</h3>
                  <p className="text-sm text-muted-foreground">{item.instructions}</p>
                </div>

                {item.specialNotes && (
                  <div
                    className="p-3 rounded-lg border-l-4"
                    style={{
                      backgroundColor: "hsl(var(--muted))",
                      borderColor: "hsl(var(--primary))",
                    }}
                  >
                    <h3 className="font-semibold text-sm mb-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Special Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.specialNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Button
        onClick={onReset}
        className="w-full"
        style={{ background: "var(--gradient-secondary)" }}
      >
        Scan Another Item
      </Button>
    </div>
  );
};

export default ResultsDisplay;