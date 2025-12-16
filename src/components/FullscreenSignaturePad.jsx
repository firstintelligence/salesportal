import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";

const FullscreenSignaturePad = ({ isOpen, onClose, onSave, initialSignature }) => {
  const signatureRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Force landscape orientation hint
      if (screen.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // Silently fail if not supported
        });
      }

      // Calculate canvas size
      const updateSize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // Leave space for buttons and guidelines
          setCanvasSize({
            width: rect.width - 48, // 24px padding each side
            height: rect.height - 120 // Space for buttons and guidelines
          });
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);

      return () => {
        window.removeEventListener('resize', updateSize);
      };
    } else {
      document.body.style.overflow = '';
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // Load initial signature if exists
    if (isOpen && initialSignature && signatureRef.current && canvasSize.width > 0) {
      setTimeout(() => {
        if (signatureRef.current) {
          signatureRef.current.fromDataURL(initialSignature, {
            width: canvasSize.width,
            height: canvasSize.height
          });
        }
      }, 100);
    }
  }, [isOpen, initialSignature, canvasSize]);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleFinish = () => {
    if (signatureRef.current) {
      const isEmpty = signatureRef.current.isEmpty();
      if (isEmpty) {
        onSave(null);
      } else {
        // Get the canvas and process it to make white pixels transparent
        const canvas = signatureRef.current.getCanvas();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert white/near-white pixels to transparent
        // Use a lower threshold to catch all white and off-white pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If pixel is white or near-white (threshold 200), make it transparent
          if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }
        
        // Create a new canvas for the transparent signature
        const transparentCanvas = document.createElement('canvas');
        transparentCanvas.width = canvas.width;
        transparentCanvas.height = canvas.height;
        const transparentCtx = transparentCanvas.getContext('2d');
        transparentCtx.putImageData(imageData, 0, 0);
        
        const dataUrl = transparentCanvas.toDataURL('image/png');
        onSave(dataUrl);
      }
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground"
        >
          <X className="h-5 w-5 mr-1" />
          Cancel
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Sign Here</h2>
        <Button
          variant="default"
          size="sm"
          onClick={handleFinish}
          className="bg-primary text-primary-foreground"
        >
          <Check className="h-5 w-5 mr-1" />
          Finish
        </Button>
      </div>

      {/* Signature Area */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden"
      >
        {/* Signature box with guidelines */}
        <div className="relative w-full max-w-4xl">
          {/* Guidelines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Baseline guide */}
            <div 
              className="absolute left-4 right-4 border-b-2 border-dashed border-muted-foreground/30"
              style={{ bottom: '25%' }}
            />
            {/* Left margin guide */}
            <div 
              className="absolute top-4 bottom-4 border-l-2 border-dashed border-muted-foreground/20"
              style={{ left: '5%' }}
            />
            {/* Right margin guide */}
            <div 
              className="absolute top-4 bottom-4 border-r-2 border-dashed border-muted-foreground/20"
              style={{ right: '5%' }}
            />
          </div>

          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary/50" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary/50" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary/50" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary/50" />

          {/* Canvas container - white bg on container only, not canvas */}
          <div className="border-2 border-border rounded-lg bg-white overflow-hidden shadow-inner flex justify-center">
            {canvasSize.width > 0 && (
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: canvasSize.width,
                  height: Math.min(canvasSize.height, 300),
                  className: 'touch-none',
                  style: { 
                    width: canvasSize.width,
                    height: Math.min(canvasSize.height, 300),
                    touchAction: 'none'
                  }
                }}
                backgroundColor="white"
                penColor="black"
                minWidth={1.5}
                maxWidth={3}
              />
            )}
          </div>

          {/* Instruction text */}
          <p className="text-center text-sm text-muted-foreground mt-3">
            Sign within the box above using your finger or stylus
          </p>
        </div>
      </div>

      {/* Footer with Clear button */}
      <div className="p-4 border-t border-border bg-muted/30 flex justify-center">
        <Button
          variant="outline"
          onClick={handleClear}
          className="px-8"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Signature
        </Button>
      </div>
    </div>
  );
};

export default FullscreenSignaturePad;
