import { useState, useRef } from "react";
import { Camera, Upload, Loader2, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const IDScanner = ({ onScanComplete, onCancel }) => {
  const [mode, setMode] = useState(null); // 'camera' | 'upload' | null
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      setMode('camera');
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setMode(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    // Compress camera captures too
    const compressed = await compressImage(imageData);
    setImagePreview(compressed);
    stopCamera();
    setMode('preview');
  };

  const compressImage = (dataUrl, maxWidth = 1280) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const compressed = await compressImage(e.target.result);
      setImagePreview(compressed);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) return;

    setIsScanning(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: imagePreview }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scan ID');
      }

      if (result.success && result.data) {
        onScanComplete({
          ...result.data,
          imageBase64: imagePreview
        });
      } else {
        throw new Error('No data extracted from ID');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Failed to scan ID. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setMode(null);
    stopCamera();
  };

  // Initial selection screen
  if (!mode) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground">Scan Ontario ID</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Take a photo or upload an image of an Ontario Driver's License or Photo ID Card
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={startCamera}
          >
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-primary/10">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Take Photo</p>
                <p className="text-xs text-muted-foreground">Use camera</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-emerald-500/10">
                <Upload className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Upload Photo</p>
                <p className="text-xs text-muted-foreground">From library</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <Button variant="outline" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  // Camera mode
  if (mode === 'camera') {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* ID frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] h-[60%] border-2 border-white/50 rounded-lg border-dashed" />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={stopCamera}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button className="flex-1" onClick={capturePhoto}>
            <Camera className="w-4 h-4 mr-2" />
            Capture
          </Button>
        </div>
      </div>
    );
  }

  // Preview mode
  if (mode === 'preview' && imagePreview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={imagePreview}
            alt="ID Preview"
            className="w-full h-auto max-h-[400px] object-contain"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={resetScanner}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              'Scan ID'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default IDScanner;
