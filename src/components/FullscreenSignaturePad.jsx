import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X } from "lucide-react";

const FullscreenSignaturePad = ({ isOpen, onClose, onSave, initialSignature }) => {
  const signatureRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Request fullscreen first, then lock orientation to landscape
      const enterFullscreenLandscape = async () => {
        try {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen(); // Safari
          }
          
          // Now lock orientation to landscape
          if (screen.orientation?.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch (err) {
          // Silently fail - some browsers don't support this
          console.log('Fullscreen/orientation lock not supported');
        }
      };
      
      enterFullscreenLandscape();

      // Calculate canvas size - maximize screen utilization
      const updateSize = () => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const landscape = screenWidth > screenHeight;
        setIsLandscape(landscape);
        
        const headerHeight = 44;
        
        if (landscape) {
          // Landscape: buttons on right side, no footer
          const buttonColumnWidth = 72; // Width for button column
          const padding = 32; // 16px each side
          setCanvasSize({
            width: screenWidth - buttonColumnWidth - padding,
            height: screenHeight - headerHeight - 16
          });
        } else {
          // Portrait: buttons at bottom
          const footerHeight = 52;
          const padding = 32;
          setCanvasSize({
            width: screenWidth - padding,
            height: screenHeight - headerHeight - footerHeight - 16
          });
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      window.addEventListener('orientationchange', updateSize);

      return () => {
        window.removeEventListener('resize', updateSize);
        window.removeEventListener('orientationchange', updateSize);
      };
    } else {
      document.body.style.overflow = '';
      
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
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 0;
          }
        }
        
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
            
            {canvasSize.width > 0 && canvasSize.height > 0 && (
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