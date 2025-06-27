

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PaperclipIcon } from './PaperclipIcon'; 

const CloseIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({ className, strokeWidth = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" className={className || "w-3 h-3 sm:w-4 sm:h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  value: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitDisabled?: boolean;
  onPromptImageSelect: (file: File) => void;
  promptImagePreviewUrl: string | null;
  onClearPromptImage: () => void;
}

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className || "w-4 h-4 sm:w-5 sm:h-5"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0L13.5 19.5M21 12H3" />
  </svg>
);

export const PlaceholdersAndVanishInput: React.FC<PlaceholdersAndVanishInputProps> = ({
  placeholders,
  value,
  onInputChange,
  onSubmit,
  isSubmitDisabled,
  onPromptImageSelect,
  promptImagePreviewUrl,
  onClearPromptImage,
}) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [animatedPlaceholderText, setAnimatedPlaceholderText] = useState(placeholders[0] || "");
  const [placeholderOpacityClass, setPlaceholderOpacityClass] = useState('opacity-100');
  const promptImageInputRef = useRef<HTMLInputElement>(null);

  const startAnimationCycle = useCallback(() => {
    if (placeholders.length <= 1) {
      if (placeholders.length === 1) {
        setAnimatedPlaceholderText(placeholders[0]);
        setPlaceholderOpacityClass('opacity-100');
      } else {
         setAnimatedPlaceholderText('');
      }
      return () => {};
    }

    setPlaceholderOpacityClass('opacity-0'); 

    const timeoutId = setTimeout(() => {
        setAnimatedPlaceholderText(placeholders[currentPlaceholderIndex]);
        setPlaceholderOpacityClass('opacity-100');
    }, 50); 

    const intervalId = setInterval(() => {
      setPlaceholderOpacityClass('opacity-0'); 
      setTimeout(() => {
        setCurrentPlaceholderIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % placeholders.length;
          setAnimatedPlaceholderText(placeholders[nextIndex]);
          return nextIndex;
        });
        setPlaceholderOpacityClass('opacity-100'); 
      }, 500); 
    }, 3500); 

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholders]);


  useEffect(() => {
    if (placeholders.length > 0) {
      setAnimatedPlaceholderText(placeholders[0]);
      setCurrentPlaceholderIndex(0); 
    } else {
      setAnimatedPlaceholderText(""); 
    }
    const clearAnimation = startAnimationCycle();
    return clearAnimation;
  }, [placeholders, startAnimationCycle]);

  const handleInputChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value); 
  };

  const handleFormSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitDisabled) return; 
    onSubmit();
  };
  
  const showAnimatedPlaceholder = value === "" && placeholders.length > 0 && !promptImagePreviewUrl;
  const isButtonEffectivelyDisabled = isSubmitDisabled; 

  const handlePromptImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPromptImageSelect(file);
    }
    if (promptImageInputRef.current) {
      promptImageInputRef.current.value = ""; 
    }
  };


  return (
    <>
      <form
        onSubmit={handleFormSubmitEvent}
        className="relative w-full rounded-full p-0.5 sm:p-1 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 focus-within:border-neutral-700 dark:focus-within:border-sky-500 transition-colors duration-300"
      >
        <div className="relative flex items-center w-full">
          <button
            type="button"
            onClick={() => promptImageInputRef.current?.click()}
            className="p-2 sm:p-2.5 ml-1 sm:ml-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            aria-label="附加圖片至提示"
          >
            <PaperclipIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <input
            type="file"
            ref={promptImageInputRef}
            onChange={handlePromptImageFileChange}
            accept="image/*"
            className="hidden"
            aria-hidden="true"
          />

          {promptImagePreviewUrl && (
            <div className="relative group ml-1 sm:ml-1.5 flex-shrink-0">
              <img
                src={promptImagePreviewUrl}
                alt="提示附件預覽"
                className="h-7 w-7 sm:h-8 sm:w-8 object-cover rounded"
              />
              <button
                type="button"
                onClick={onClearPromptImage}
                className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 p-0.5 sm:p-1 bg-neutral-700 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-500"
                aria-label="清除已附加的提示圖片"
              >
                <CloseIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5}/>
              </button>
            </div>
          )}
          
          <input
            id="dynamic-placeholder-input"
            name="dynamic-placeholder-input"
            type="text"
            value={value} 
            onChange={handleInputChangeEvent}
            className={`w-full h-10 sm:h-12 pr-10 sm:pr-12 text-sm sm:text-base text-neutral-800/90 dark:text-neutral-100/90 bg-transparent rounded-full outline-none focus:ring-0 border-none placeholder:text-neutral-500/80 dark:placeholder:text-neutral-400/80
                        ${promptImagePreviewUrl ? 'pl-1.5 sm:pl-2' : 'pl-2 sm:pl-3'}`}
            placeholder={showAnimatedPlaceholder ? "" : (placeholders[0] || "請輸入內容...")}
            aria-label="查詢輸入"
          />
          {showAnimatedPlaceholder && (
            <span
              aria-hidden="true"
              className={`absolute top-1/2 -translate-y-1/2 pointer-events-none 
                          text-sm sm:text-base text-neutral-500/80 dark:text-neutral-400/80 
                          transition-opacity duration-500 ease-in-out 
                          ${placeholderOpacityClass}
                          ${promptImagePreviewUrl ? 'left-[4.5rem] sm:left-24' : 'left-12 sm:left-14'}`} 
            >
              {animatedPlaceholderText}
            </span>
          )}
          <button
            type="submit"
            aria-label="提交查詢"
            disabled={isButtonEffectivelyDisabled}
            className={`absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full 
                       bg-neutral-800 text-white hover:bg-neutral-700 
                       dark:bg-neutral-100 dark:text-neutral-800 dark:hover:bg-neutral-300 
                       focus:outline-none focus:ring-2 focus:ring-neutral-600 dark:focus:ring-neutral-400 focus:ring-opacity-50 
                       transition-all duration-200
                       disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed`}
          >
            <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </>
  );
};
