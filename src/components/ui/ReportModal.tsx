
import React, { useEffect } from 'react';
import { GeneratedImageHistoryEntry } from '../../App'; // Adjust path as needed

export interface GeneratedReport {
  concept: string;
  suggestions: string[];
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: GeneratedReport;
  imageForReport: GeneratedImageHistoryEntry;
  onDownloadReport: (reportData: GeneratedReport, originalPrompt: string) => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className || "w-5 h-5 sm:w-6 sm:h-6"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


export const ReportModal: React.FC<ReportModalProps> = ({ 
    isOpen, 
    onClose, 
    reportContent, 
    imageForReport, 
    onDownloadReport 
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-5 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center flex-shrink-0">
          <h2 id="report-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            設計建議報告
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-100 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="關閉彈窗"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="p-4 sm:p-6 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-gray-100 dark:scrollbar-track-neutral-700 space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-sky-600 dark:text-sky-400 mb-1.5 sm:mb-2">相關圖片：</h3>
            <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-lg border border-gray-200 dark:border-neutral-600">
              <img 
                src={imageForReport.imageUrl} 
                alt="報告相關圖片" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md shadow"
              />
              <div className="flex-grow min-w-0"> {/* Added min-w-0 for better truncation */}
                <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mb-1">原始提示詞：</p>
                <p className="text-[0.65rem] sm:text-xs text-gray-700 dark:text-neutral-300 leading-relaxed line-clamp-3 break-all"> {/* Changed to break-all for better wrapping */}
                    {imageForReport.prompt}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-sky-600 dark:text-sky-400 mb-1.5 sm:mb-2">設計理念：</h3>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
              {reportContent.concept}
            </p>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-semibold text-sky-600 dark:text-sky-400 mb-1.5 sm:mb-2">修改建議：</h3>
            {reportContent.suggestions.length > 0 ? (
              <ul className="list-disc list-outside space-y-1 sm:space-y-1.5 pl-4 sm:pl-5 text-xs sm:text-sm text-gray-700 dark:text-neutral-200 marker:text-sky-500 dark:marker:text-sky-400">
                {reportContent.suggestions.map((suggestion, index) => (
                  <li key={index} className="leading-relaxed whitespace-pre-wrap">{suggestion}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 italic">目前沒有修改建議。</p>
            )}
          </div>
        </div>

        <footer className="p-3 sm:p-4 border-t border-gray-200 dark:border-neutral-700 flex flex-col sm:flex-row justify-end items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-neutral-800/60 flex-shrink-0">
          <button
            onClick={() => onDownloadReport(reportContent, imageForReport.prompt)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-sky-500 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors"
          >
            <DownloadIcon />
            下載報告 (.md)
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
          >
            關閉
          </button>
        </footer>
      </div>
    </div>
  );
};
