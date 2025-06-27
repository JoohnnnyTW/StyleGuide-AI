
import React, { useState, useRef, useEffect } from 'react';

interface ImageCompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  onClose?: () => void; // Optional close button handler
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({ beforeSrc, afterSrc, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleInteractionMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault(); // Prevent text selection/image dragging
    isDragging.current = true;
    handleInteractionMove(event.clientX);
  };
  
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    handleInteractionMove(event.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    const handleMouseMoveGlobal = (event: MouseEvent) => {
        if (isDragging.current) {
          handleInteractionMove(event.clientX);
        }
      };
  
      const handleTouchMoveGlobal = (event: TouchEvent) => {
        if (isDragging.current) {
          handleInteractionMove(event.touches[0].clientX);
        }
      };

    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMoveGlobal);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMoveGlobal);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps because we are adding/removing global listeners

  return (
    <div 
        className="relative w-full max-w-md mx-auto aspect-[4/3] sm:aspect-video select-none group cursor-ew-resize" 
        ref={containerRef} 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
    >
      {/* Ensure images cover the area but are contained within aspect ratio */}
      <img
        src={beforeSrc}
        alt="Before"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable="false"
      />
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterSrc}
          alt="After"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable="false"
        />
      </div>
      
      {/* Slider Handle Visual - positioned by 'left' style */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/70 dark:bg-black/70 pointer-events-none transform -translate-x-1/2 shadow-md"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 w-3 h-8 sm:w-4 sm:h-10 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-lg">
          <svg className="w-2 h-4 sm:w-2.5 sm:h-5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
        </div>
      </div>

       {onClose && (
         <button
            onClick={(e) => { e.stopPropagation(); onClose();}} // Stop propagation to prevent slider interaction
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white z-10 cursor-pointer"
            aria-label="Close image comparison"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
       )}
    </div>
  );
};
