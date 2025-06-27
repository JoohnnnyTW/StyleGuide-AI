
"use client" 

import * as React from "react"
import { useEffect, useRef } from "react";
import { CameraIcon as DefaultCameraIcon } from 'lucide-react'; 

interface TabDef {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AnimatedTabsProps {
  tabs: TabDef[];
  activeTab: string; 
  onTabChange: (label: string) => void; 
}

interface AnimatedTabGroupProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (label: string) => void;
}

const TAB_NAME_CAMERA = "相機"; 

const AnimatedTabGroup: React.FC<AnimatedTabGroupProps> = ({ tabs, activeTab, onTabChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const defaultHideClipPath = 'inset(0 100% 0 0 round 14px)';

    if (!container || tabs.length === 0) {
      if (container) container.style.clipPath = defaultHideClipPath;
      return;
    }

    const isActiveTabInThisGroup = tabs.some(t => t.label === activeTab);

    if (isActiveTabInThisGroup) {
      const activeEl = activeTabRef.current || 
                       (container.parentElement?.querySelector(`button[data-label="${activeTab}"][data-type="foreground-tab"]`) as HTMLButtonElement | null);
      
      if (activeEl && container.offsetWidth > 0) {
        const containerRect = container.getBoundingClientRect();
        const activeElRect = activeEl.getBoundingClientRect();

        if (containerRect.width > 0) {
          const leftInsetPx = activeElRect.left - containerRect.left;
          const rightInsetPx = containerRect.right - activeElRect.right;

          let clipLeftPercent = (leftInsetPx / containerRect.width) * 100;
          let clipRightPercent = (rightInsetPx / containerRect.width) * 100;
          
          clipLeftPercent = Math.max(0, Math.min(100, clipLeftPercent));
          clipRightPercent = Math.max(0, Math.min(100, clipRightPercent));

          if (clipLeftPercent + clipRightPercent >= 100) {
            container.style.clipPath = defaultHideClipPath;
          } else {
            const borderRadius = "14px"; 
            container.style.clipPath = `inset(0 ${clipRightPercent.toFixed(2)}% 0 ${clipLeftPercent.toFixed(2)}% round ${borderRadius})`;
          }
        } else {
          container.style.clipPath = defaultHideClipPath;
        }
      } else {
        container.style.clipPath = defaultHideClipPath;
      }
    } else {
      container.style.clipPath = defaultHideClipPath;
    }
  }, [activeTab, tabs]);

  const handleTabClick = (label: string) => {
    onTabChange(label);
  };

  const groupRoundingClass = "rounded-full";


  return (
    <div className={`relative bg-neutral-200/50 dark:bg-neutral-800/50 border border-neutral-300/50 dark:border-neutral-700/50 flex flex-col items-center ${groupRoundingClass} py-1 sm:py-1.5 px-2 sm:px-3`}>
      <div
        ref={containerRef}
        className="absolute inset-0 z-10 w-full h-full overflow-hidden [transition:clip-path_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]"
        style={{ clipPath: 'inset(0 100% 0 0 round 14px)' }} 
      >
        <div className={`relative flex w-full h-full justify-center bg-black ${groupRoundingClass}`}>
          {tabs.map((tab, index) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={`${tab.label}-bg-${index}`}
                data-label={tab.label}
                data-type="background-tab"
                className="flex h-6 sm:h-7 items-center justify-center rounded-full px-2 py-1 sm:p-2.5 text-[0.65rem] sm:text-xs font-medium text-transparent select-none shrink-0"
                tabIndex={-1}
                aria-hidden="true"
              >
                {IconComponent ? <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative z-20 flex w-full justify-center">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.label;
          const IconComponent = tab.icon;
          return (
            <button
              key={`${tab.label}-fg-${index}`}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleTabClick(tab.label)}
              data-label={tab.label}
              data-type="foreground-tab"
              className={`flex h-6 sm:h-7 items-center justify-center cursor-pointer rounded-full px-2 py-1 sm:p-2.5 text-[0.65rem] sm:text-xs font-medium transition-colors duration-200 shrink-0
                          ${IconComponent ? 'w-auto' : ''} 
                          ${isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
              aria-label={tab.label}
              aria-pressed={isActive}
            >
              {IconComponent ? <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
 
export function AnimatedTabs({ tabs, activeTab, onTabChange }: AnimatedTabsProps) {
  useEffect(() => {
    const isCurrentActiveTabValid = tabs.some(t => t.label === activeTab);
    if (!isCurrentActiveTabValid && tabs.length > 0) {
      onTabChange(tabs[0].label); 
    }
  }, [tabs, activeTab, onTabChange]);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  const cameraTabIndex = tabs.findIndex(tab => tab.label === TAB_NAME_CAMERA);
  let tabsBeforeCamera: TabDef[] = [];
  let cameraTabDetails: TabDef | undefined = undefined;
  let tabsAfterCamera: TabDef[] = [];

  if (cameraTabIndex !== -1) {
    cameraTabDetails = tabs[cameraTabIndex];
    tabsBeforeCamera = tabs.slice(0, cameraTabIndex);
    tabsAfterCamera = tabs.slice(cameraTabIndex + 1);
  } else {
    tabsBeforeCamera = tabs;
  }

  const handleCameraTabClick = () => {
    if (cameraTabDetails) {
      onTabChange(cameraTabDetails.label);
    }
  };

  const CameraIconToUse = cameraTabDetails?.icon || DefaultCameraIcon;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center py-1.5 sm:py-2 md:py-3 pointer-events-none">
      <div className="flex items-end gap-2 sm:gap-3 pointer-events-auto">
        
        {tabsBeforeCamera.length > 0 && (
          <AnimatedTabGroup 
            tabs={tabsBeforeCamera} 
            activeTab={activeTab} 
            onTabChange={onTabChange}
          />
        )}

        {cameraTabDetails && (
          <button
            onClick={handleCameraTabClick}
            className={`
              h-[36px] w-[36px] sm:h-[42px] sm:w-[42px] 
              rounded-full flex items-center justify-center shadow-lg transition-all duration-200
              focus:outline-none 
              ${activeTab === cameraTabDetails.label 
                ? 'bg-sky-500 dark:bg-sky-400 text-white dark:text-neutral-800 ring-2 ring-offset-2 ring-sky-500 dark:ring-sky-400 ring-offset-white dark:ring-offset-neutral-900' 
                : 'bg-neutral-800 dark:bg-white text-white dark:text-neutral-800 hover:bg-neutral-700 dark:hover:bg-neutral-200 focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 dark:focus:ring-neutral-300 ring-offset-white dark:ring-offset-neutral-900'
              }
            `}
            aria-label={cameraTabDetails.label}
            aria-pressed={activeTab === cameraTabDetails.label}
          >
            <CameraIconToUse className="w-4 h-4 sm:w-5 sm:w-5" />
          </button>
        )}

        {tabsAfterCamera.length > 0 && (
          <AnimatedTabGroup 
            tabs={tabsAfterCamera} 
            activeTab={activeTab} 
            onTabChange={onTabChange}
          />
        )}
      </div>
    </div>
  );
}
