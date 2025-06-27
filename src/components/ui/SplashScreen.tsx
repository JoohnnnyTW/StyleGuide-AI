import React from 'react';
import { TypingAnimation } from './TypingAnimation'; 

interface SplashScreenProps {
  appName?: string;
  tagline?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  appName = "StyleGuide AI",
  tagline = "Crafting Visual Excellence..." 
}) => {

  return (
    <div 
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-opacity duration-500 ease-in-out"
        aria-label={`Loading ${appName}`}
        role="alert"
        aria-live="assertive"
    >
      <div className="flex flex-col items-center px-4">
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
      </div>
    </div>
  );
};