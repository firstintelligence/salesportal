import { useRef, useEffect, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";

const FullscreenSignaturePad = ({ isOpen, onClose, onSave, initialSignature }) => {
  const signatureRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLandscape, setIsLandscape] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Calculate canvas size based on current window dimensions
  const calculateSize = useCallback(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const landscape = screenWidth > screenHeight;
    setIsLandscape(landscape);
    
    const headerHeight = 44;
    
    if (landscape) {
      // Landscape: buttons on right side, no footer
      const buttonColumnWidth = 72;
      const padding = 32;
      return {
        width: screenWidth - buttonColumnWidth - padding,
        height: screenHeight - headerHeight - 16
      };
    } else {
      // Portrait: buttons at bottom
      const footerHeight = 52;
      const padding = 32;
      return {
        width: screenWidth - padding,
        height: screenHeight - headerHeight - footerHeight - 16
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset ready state
      setIsReady(false);
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Force landscape orientation for mobile
      const forceLandscape = async () => {
        try {
          // First try to request fullscreen
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen();
          }
          
          // Then lock to landscape
          if (screen.orientation?.lock) {
            try {
              await screen.orientation.lock('landscape');
            } catch (orientErr) {
              // Try landscape-primary as fallback
              try {
                await screen.orientation.lock('landscape-primary');
              } catch (fallbackErr) {
                console.log('Landscape lock not supported');
              }
            }
          }
        } catch (err) {
          console.log('Fullscreen not supported:', err.message);
        }
        
        // Wait for orientation change to settle, then calculate size
        setTimeout(() => {
          const size = calculateSize();
          setCanvasSize(size);
          setIsReady(true);
        }, 300);
      };
      
      forceLandscape();

      // Handle resize and orientation changes
      const handleResize = () => {
        const size = calculateSize();
        setCanvasSize(size);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => {
        // Wait for orientation change to complete
        setTimeout(handleResize, 100);
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    } else {
      document.body.style.overflow = '';
      setIsReady(false);
      
      // Exit fullscreen and unlock orientation
      const exitFullscreen = async () => {
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              await document.webkitExitFullscreen();
            }
          }
          if (screen.orientation?.unlock) {
            screen.orientation.unlock();
          }
        } catch (err) {
          // Silently fail
        }
      };
      
      exitFullscreen();
    }
  }, [isOpen, calculateSize]);

  // Load initial signature ONLY when pad is ready and canvas exists
  useEffect(() => {
    if (isOpen && isReady && signatureRef.current && canvasSize.width > 0) {
      // ALWAYS clear the canvas first to prevent stacking signatures
      signatureRef.current.clear();
      
      // Only load the initial signature if one was provided
      if (initialSignature) {
        // Small delay to ensure canvas is ready after clear
        setTimeout(() => {
          if (signatureRef.current) {
            signatureRef.current.fromDataURL(initialSignature, {
              width: canvasSize.width - 8,
              height: canvasSize.height - 8
            });
          }
        }, 50);
      }
    }
  }, [isOpen, isReady, initialSignature, canvasSize]);

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
        // Get the canvas and process it
        const canvas = signatureRef.current.getCanvas();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Find the bounding box of the actual signature (non-white pixels)
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is not white/near-white (i.e., part of signature)
            if (!(r > 200 && g > 200 && b > 200)) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        
        // Add padding around the signature
        const padding = 10;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width - 1, maxX + padding);
        maxY = Math.min(canvas.height - 1, maxY + padding);
        
        const croppedWidth = maxX - minX + 1;
        const croppedHeight = maxY - minY + 1;
        
        // Get the cropped region
        const croppedImageData = ctx.getImageData(minX, minY, croppedWidth, croppedHeight);
        const croppedData = croppedImageData.data;
        
        // Convert white/near-white pixels to transparent
        for (let i = 0; i < croppedData.length; i += 4) {
          const r = croppedData[i];
          const g = croppedData[i + 1];
          const b = croppedData[i + 2];
          
          if (r > 200 && g > 200 && b > 200) {
            croppedData[i + 3] = 0;
          }
        }
        
        // Create a high-resolution canvas for better PDF quality (2x scale)
        const scale = 2;
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = croppedWidth * scale;
        outputCanvas.height = croppedHeight * scale;
        const outputCtx = outputCanvas.getContext('2d');
        
        // Create temp canvas at original size with cropped data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = croppedWidth;
        tempCanvas.height = croppedHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(croppedImageData, 0, 0);
        
        // Scale up to output canvas with smooth interpolation
        outputCtx.imageSmoothingEnabled = true;
        outputCtx.imageSmoothingQuality = 'high';
        outputCtx.drawImage(tempCanvas, 0, 0, croppedWidth * scale, croppedHeight * scale);
        
        const dataUrl = outputCanvas.toDataURL('image/png', 1.0);
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
      {/* Compact Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30 shrink-0" style={{ height: '44px' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground h-8 px-2"
        >
          <X className="h-4 w-4 mr-1" />
          <span className="text-xs">Cancel</span>
        </Button>
        <h2 className="text-sm font-semibold text-foreground">Sign Here</h2>
        <div className="w-16" />
      </div>

      {/* Main content area - different layout for landscape vs portrait */}
      <div className={`flex-1 flex ${isLandscape ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {/* Signature Area */}
        <div 
          ref={containerRef}
          className={`flex items-center justify-center p-4 overflow-hidden bg-muted/20 ${isLandscape ? 'flex-1' : ''}`}
        >
          <div 
            className="border-4 border-gray-800 rounded-lg bg-white overflow-hidden relative"
            style={{ width: canvasSize.width, height: canvasSize.height }}
          >
            {/* Sign Here watermark */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{ zIndex: 0 }}
            >
              <span 
                className="text-gray-200 text-4xl sm:text-5xl md:text-6xl tracking-wide"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                Sign Here
              </span>
            </div>
            
            {/* Baseline guide */}
            <div 
              className="absolute left-4 right-4 pointer-events-none"
              style={{ 
                bottom: '25%',
                height: '2px',
                backgroundImage: 'repeating-linear-gradient(to right, #d1d5db 0px, #d1d5db 12px, transparent 12px, transparent 20px)'
              }}
            />
            
            {canvasSize.width > 0 && canvasSize.height > 0 && isReady && (
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: canvasSize.width - 8,
                  height: canvasSize.height - 8,
                  className: 'touch-none',
                  style: { 
                    width: canvasSize.width - 8,
                    height: canvasSize.height - 8,
                    touchAction: 'none',
                    display: 'block'
                  }
                }}
                backgroundColor="white"
                penColor="black"
                minWidth={1.5}
                maxWidth={3}
              />
            )}
          </div>
        </div>

        {/* Buttons - side panel in landscape, footer in portrait */}
        {isLandscape ? (
          <div 
            className="flex flex-col justify-center gap-3 px-3 py-4 bg-muted/30 border-l border-border shrink-0"
            style={{ 
              width: '72px',
              paddingRight: 'max(12px, env(safe-area-inset-right))'
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="w-full h-14 flex flex-col items-center justify-center gap-1 p-1"
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-[10px]">Clear</span>
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleFinish}
              className="w-full h-14 flex flex-col items-center justify-center gap-1 p-1 bg-primary text-primary-foreground"
            >
              <Check className="h-5 w-5" />
              <span className="text-[10px]">Submit</span>
            </Button>
          </div>
        ) : (
          <div 
            className="px-4 py-2 border-t border-border bg-muted/30 flex justify-between items-center shrink-0"
            style={{ 
              minHeight: '52px',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
              paddingLeft: 'max(16px, env(safe-area-inset-left))',
              paddingRight: 'max(16px, env(safe-area-inset-right))'
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="px-4 h-8"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="text-xs">Clear</span>
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleFinish}
              className="bg-primary text-primary-foreground h-8 px-6"
            >
              <Check className="h-4 w-4 mr-1" />
              <span className="text-xs">Submit</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenSignaturePad;
