

import React, { useState, useEffect, useRef } from 'react';

// Icons (simplified for brevity, you might use lucide-react or similar)
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5 sm:w-4 sm:h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5 sm:w-4 sm:h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

interface MultiSelectOption {
  value: string; // English suggestion
  label: string; // Chinese suggestion for display
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  triggerLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  triggerLabel = "AI 建議",
  placeholder = "選擇建議...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOption = (optionValue: string) => {
    const newSelectedValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newSelectedValues);
  };

  const getTriggerText = () => {
    if (selectedValues.length === 0) {
      return triggerLabel;
    }
    if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : `${selectedValues.length} 個已選`;
    }
    return `${selectedValues.length} 個已選`;
  };

  if (options.length === 0 && !disabled) {
    return (
         <div className="py-1 text-center">
            <button
                type="button"
                className="w-full flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-medium rounded-md shadow-sm opacity-50 cursor-default"
                disabled
            >
                {triggerLabel} (尚無可用建議)
            </button>
        </div>
    );
  }


  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || options.length === 0}
        className="w-full flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-md shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedValues.length > 0 ? getTriggerText() : (placeholder || triggerLabel)}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && options.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-700 shadow-lg border border-neutral-300 dark:border-neutral-600 rounded-md max-h-48 sm:max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-500 scrollbar-track-neutral-100 dark:scrollbar-track-neutral-800">
          <ul role="listbox">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleToggleOption(option.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleToggleOption(option.value)}
                className="flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-600 cursor-pointer focus:bg-neutral-100 dark:focus:bg-neutral-600 focus:outline-none"
                role="option"
                aria-selected={selectedValues.includes(option.value)}
                tabIndex={0}
              >
                <span className="truncate flex-grow mr-1.5 sm:mr-2">{option.label}</span>
                {selectedValues.includes(option.value) && (
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
