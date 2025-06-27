
import React from 'react';

interface FloatingSliderProps {
  isVisible: boolean;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChevronLeftIconComponent: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIconComponent: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);


export const FloatingSlider: React.FC<FloatingSliderProps> = ({
  isVisible,
  value,
  onChange,
  min = 0,
  max = 5,
  step = 1,
  label = "Tolerance",
  isCollapsed,
  onToggleCollapse,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-30 
                  bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm 
                  rounded-l-lg shadow-xl border border-r-0 border-neutral-200 dark:border-neutral-700 
                  flex items-center transition-all duration-300 ease-in-out
                  ${isCollapsed ? 'w-10 sm:w-12 p-1.5 sm:p-2 justify-center' : 'w-auto p-2 sm:p-3 space-x-1 sm:space-x-1.5'}`}
      aria-label={`${label} Slider Control`}
    >
      <button
        onClick={onToggleCollapse}
        className={`p-1 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors
                    ${isCollapsed ? 'w-full h-full flex items-center justify-center' : ''}`}
        aria-expanded={!isCollapsed}
        aria-controls="floating-slider-content"
      >
        {isCollapsed ? 
            <ChevronLeftIconComponent className="w-4 h-4 sm:w-5 sm:h-5" /> : 
            <ChevronRightIconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
        }
        <span className="sr-only">{isCollapsed ? `展開 ${label} 控制條` : `收合 ${label} 控制條`}</span>
      </button>

      {!isCollapsed && (
        <div 
            id="floating-slider-content"
            className="flex flex-col items-center space-y-1 sm:space-y-1.5 opacity-100 visible transition-opacity duration-300 ease-in-out"
        >
          {label && (
            <label 
                htmlFor="floating-slider-input" 
                className="text-[0.65rem] sm:text-xs font-medium text-neutral-700 dark:text-neutral-200 whitespace-nowrap"
            >
                {label}: <span className="font-bold text-sky-600 dark:text-sky-400">{value}</span>
            </label>
          )}
          <div className="h-28 sm:h-32 w-full flex justify-center items-center">
            <input
              type="range"
              id="floating-slider-input"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value, 10))}
              className="appearance-none bg-transparent cursor-pointer slider-vertical-custom w-20 h-2 sm:w-24 sm:h-2.5 transform -rotate-90" 
              aria-orientation="vertical"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value}
            />
          </div>
        </div>
      )}
      <style>{`
        .slider-vertical-custom {
          background: transparent; 
        }
        .slider-vertical-custom::-webkit-slider-runnable-track {
          width: 100%;
          height: 5px; 
          cursor: pointer;
          background: #d1d5db; /* neutral-300 */
          border-radius: 3px;
          border: 0.5px solid #9ca3af; /* neutral-400 */
        }
        html.dark .slider-vertical-custom::-webkit-slider-runnable-track {
          background: #4b5563; /* neutral-600 */
          border-color: #6b7280; /* neutral-500 */
        }
        .slider-vertical-custom::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          border: 1px solid #0284c7; /* sky-600 */
          height: 16px; 
          width: 16px;  
          border-radius: 50%;
          background: #ffffff; /* white */
          cursor: grab;
          margin-top: -5.5px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        html.dark .slider-vertical-custom::-webkit-slider-thumb {
          background: #e0f2fe; /* sky-100 */
          border-color: #7dd3fc; /* sky-300 */
        }

        /* Firefox */
        .slider-vertical-custom::-moz-range-track {
          width: 100%;
          height: 5px;
          cursor: pointer;
          background: #d1d5db; /* neutral-300 */
          border-radius: 3px;
          border: 0.5px solid #9ca3af; /* neutral-400 */
        }
        html.dark .slider-vertical-custom::-moz-range-track {
          background: #4b5563; /* neutral-600 */
          border-color: #6b7280; /* neutral-500 */
        }
        .slider-vertical-custom::-moz-range-thumb {
          border: 1px solid #0284c7; /* sky-600 */
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ffffff; /* white */
          cursor: grab;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        html.dark .slider-vertical-custom::-moz-range-thumb {
          background: #e0f2fe; /* sky-100 */
          border-color: #7dd3fc; /* sky-300 */
        }
      `}</style>
    </div>
  );
};
