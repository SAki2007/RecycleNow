import { useState, useRef } from "react";
import { Camera, Upload, History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CitySelector from "@/components/CitySelector";
import ResultsDisplay from "@/components/ResultsDisplay";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState("Vancouver");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const base64 = canvas.toDataURL("image/jpeg");
    setImagePreview(base64);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    analyzeImage(base64);
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("identify-recyclable", {
        body: { image: base64Image, city: selectedCity },
      });

      if (error) throw error;

      setResult(data);

      // Save to history
      const history = JSON.parse(localStorage.getItem("recycling-history") || "[]");
      history.push({
        material: data.material,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("recycling-history", JSON.stringify(history));

      toast({
        title: "Analysis Complete",
        description: `Identified: ${data.material}`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setImagePreview(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            EcoScan
          </h1>
          <div className="flex gap-2 items-center">
            <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/history")}
            >
              <HistoryIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {!result ? (
          <Card className="p-6 md:p-8 max-w-2xl mx-auto" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <h2 className="text-2xl font-semibold mb-6 text-card-foreground text-center">
              Scan Your Recyclables
            </h2>

            {!imagePreview && !stream && (
              <div className="space-y-4">
                <Button
                  onClick={startCamera}
                  className="w-full h-32 text-lg"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Camera className="w-8 h-8 mr-3" />
                  Take Photo
                </Button>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-32 text-lg"
                >
                  <Upload className="w-8 h-8 mr-3" />
                  Upload Photo
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {stream && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={capturePhoto}
                    className="flex-1"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    Capture
                  </Button>
                  <Button
                    onClick={() => {
                      stream.getTracks().forEach(track => track.stop());
                      setStream(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {imagePreview && !stream && (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg"
                  style={{ boxShadow: "var(--shadow-medium)" }}
                />
                {isAnalyzing && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Analyzing your item...</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (
          <ResultsDisplay
            result={result}
            imagePreview={imagePreview}
            onReset={resetAnalysis}
          />
        )}
      </div>
    </div>
  );
};

export default Index;