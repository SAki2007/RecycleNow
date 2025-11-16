import { useState, useRef } from "react";
import { Camera, Upload, History as HistoryIcon, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      data.materials.forEach((item: any) => {
        history.push({
          material: item.material,
          timestamp: new Date().toISOString(),
        });
      });
      localStorage.setItem("recycling-history", JSON.stringify(history));

      toast({
        title: "Analysis Complete",
        description: `Identified ${data.totalItems} item${data.totalItems > 1 ? 's' : ''}`,
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

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-8">
          <ResultsDisplay
            result={result}
            imagePreview={imagePreview}
            onReset={resetAnalysis}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex justify-end mb-6">
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

        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge 
            variant="secondary" 
            className="mb-4 px-4 py-1.5 bg-accent text-accent-foreground"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Recycling Assistant
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Recycle<span className="text-primary">Now</span>
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Take a photo of any item and instantly discover how to recycle it properly.
            Join the mission to reduce waste and protect our planet.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="p-8 md:p-12 mb-12 border-2 border-dashed border-border bg-card">
          {!imagePreview && !stream && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-2">Upload or Capture an Image</h2>
                <p className="text-muted-foreground">
                  Take a photo or upload an image of recyclable materials
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>

                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
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
                  className="flex-1 bg-primary hover:bg-primary/90"
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
                className="w-full rounded-lg max-h-96 object-contain"
              />
              {isAnalyzing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Analyzing your item...</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center bg-card">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Capture</h3>
            <p className="text-sm text-muted-foreground">
              Take a photo of any recyclable/non-recyclable material
            </p>
          </Card>

          <Card className="p-6 text-center bg-card">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Identify</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes the materials and identifies recycling potential
            </p>
          </Card>

          <Card className="p-6 text-center bg-card">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Recycle</h3>
            <p className="text-sm text-muted-foreground">
              Get detailed instructions on where and how to recycle properly
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;