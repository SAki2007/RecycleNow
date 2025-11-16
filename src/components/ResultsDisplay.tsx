import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recycle, MapPin, AlertCircle } from "lucide-react";

interface ResultsDisplayProps {
  result: {
    material: string;
    binType: string;
    instructions: string;
    specialNotes?: string;
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

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              Material Identified
            </h2>
            <Badge
              className="text-lg px-4 py-2 capitalize"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Recycle className="w-5 h-5 mr-2" />
              {result.material}
            </Badge>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: "hsl(var(--accent))" }}>
            <h3 className="font-semibold text-lg mb-2 flex items-center text-accent-foreground">
              <MapPin className="w-5 h-5 mr-2" />
              Recycling Bin
            </h3>
            <p className="text-accent-foreground font-medium">{result.binType}</p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: "hsl(var(--muted))" }}>
            <h3 className="font-semibold text-lg mb-2 text-muted-foreground">
              Recycling Instructions
            </h3>
            <p className="text-muted-foreground">{result.instructions}</p>
          </div>

          {result.specialNotes && (
            <div
              className="p-4 rounded-lg border-l-4"
              style={{
                backgroundColor: "hsl(var(--accent))",
                borderColor: "hsl(var(--primary))",
              }}
            >
              <h3 className="font-semibold text-lg mb-2 flex items-center text-accent-foreground">
                <AlertCircle className="w-5 h-5 mr-2" />
                Special Notes
              </h3>
              <p className="text-accent-foreground">{result.specialNotes}</p>
            </div>
          )}
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