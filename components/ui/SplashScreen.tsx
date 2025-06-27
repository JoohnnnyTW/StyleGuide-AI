

import React from 'react';
// StyleGuideLogoIcon import removed
import { TypingAnimation } from './TypingAnimation';

interface SplashScreenProps {
  onLoadingComplete?: () => void; // Optional: If splash itself manages its display time
  appName?: string;
  tagline?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onLoadingComplete, 
  appName = "StyleGuide AI", // Changed to English
  tagline = "Crafting Visual Excellence..." // Kept English tagline as per previous setup for StyleGuide AI
}) => {

  return (
    <div 
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-opacity duration-500 ease-in-out"
        aria-label={`Loading ${appName}`} // Updated to use English and dynamic appName
        role="alert"
        aria-live="assertive"
    >
      <div className="flex flex-col items-center px-4">
        {/* StyleGuideLogoIcon component removed */}
        
        <TypingAnimation 
          text={appName} 
          duration={120} 
          className="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-800 dark:text-neutral-100 mb-1 sm:mb-2 mt-6 leading-tight sm:leading-normal" 
        />
        <TypingAnimation 
          text={tagline} 
          duration={70} 
          className="text-xs sm:text-sm md:text-md font-light text-neutral-600 dark:text-neutral-400 opacity-0 animate-fadeInDelay leading-tight sm:leading-normal"
        />

        {/* Simple Spinner Removed */}
        {/* 
        <div className="mt-12 flex space-x-2">
            <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse-fast"></div>
            <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse-fast animation-delay-200"></div>
            <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse-fast animation-delay-400"></div>
        </div> 
        */}
      </div>
      {/* The <style jsx global> block was previously removed.
          Animations `fadeInDelay` and `pulse-fast` would need to be defined
          in a global CSS file (like index.html or a main.css) or using Tailwind's animation configuration
          if they are to work as intended. The `blink` animation for TypingAnimation is in index.html.
          Since `pulse-fast` is removed, its definition is no longer strictly necessary unless used elsewhere.
      */}
    </div>
  );
};
