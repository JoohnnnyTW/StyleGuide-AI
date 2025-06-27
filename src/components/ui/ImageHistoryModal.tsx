
import React, { useEffect } from 'react';

// Define and export ImageDetail for use by App.tsx as well
export interface ImageDetail {
  url: string;
  tags: string[];
  displayName: string; // Added displayName
}

export interface SubmissionEntry {
  text: string;
  images: ImageDetail[] | null; 
}

interface ImageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: SubmissionEntry[];
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

export const ImageHistoryModal: React.FC<ImageHistoryModalProps> = ({ isOpen, onClose, entries }) => {
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

  const entriesWithContent = entries.filter(entry => entry.text || (entry.images && entry.images.length > 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-history-modal-title"
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-lg sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        <header className="p-4 sm:p-5 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
          <h2 id="image-history-modal-title" className="text-lg sm:text-xl font-semibold text-[#1D1D1F] dark:text-neutral-100">
            提交歷史紀錄
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-100 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            aria-label="關閉彈窗"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-gray-100 dark:scrollbar-track-neutral-700">
          {entriesWithContent.length === 0 ? (
            <p className="text-center text-sm sm:text-base text-gray-500 dark:text-neutral-400 py-8 sm:py-10">尚無提交紀錄。</p>
          ) : (
            <ul className="space-y-4 sm:space-y-6">
              {entriesWithContent.slice().reverse().map((entry, index) => ( 
                <li key={entries.length - 1 - index} className="p-3 sm:p-4 bg-gray-50 dark:bg-neutral-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                  <div className="flex-grow mb-2 sm:mb-3">
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-neutral-200 leading-relaxed break-words">
                      <strong className="text-[#1D1D1F] dark:text-neutral-100">提示：</strong> {entry.text || <em className="text-gray-400 dark:text-neutral-500">未提交文字</em>}
                    </p>
                  </div>
                  {entry.images && entry.images.length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <strong className="text-[0.65rem] sm:text-xs text-gray-500 dark:text-neutral-400 uppercase">附加圖片：</strong>
                      {entry.images.map((imgDetail, imgIndex) => (
                        <div key={imgIndex} className="mt-2 sm:mt-3 p-1.5 sm:p-2 border-t border-gray-100 dark:border-neutral-700/50">
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start">
                                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-200 dark:bg-neutral-700 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                                    <img
                                    src={imgDetail.url}
                                    alt={`${imgDetail.displayName || '圖片 ' + (imgIndex + 1)} - 項目 ${entries.length - 1 - index}`}
                                    className="object-contain w-full h-full"
                                    onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.alt = `${imgDetail.displayName || '圖片'} 載入失敗`;
                                        const parentDiv = target.parentElement;
                                        if (parentDiv) {
                                            parentDiv.innerHTML = ''; 
                                            const errorTextNode = document.createElement('span');
                                            errorTextNode.className = 'text-gray-400 dark:text-neutral-500 text-xs italic p-1 text-center block w-full h-full flex items-center justify-center';
                                            errorTextNode.textContent = `${imgDetail.displayName || '圖片'} 錯誤`;
                                            parentDiv.appendChild(errorTextNode);
                                            parentDiv.classList.add('bg-gray-100 dark:bg-neutral-600');
                                        }
                                    }}
                                    />
                                </div>
                                <div className="flex-grow mt-1 sm:mt-0">
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 font-medium">{imgDetail.displayName || `圖片 ${imgIndex + 1}`}</p>
                                  {imgDetail.tags.length > 0 ? (
                                      <>
                                          <p className="text-[0.65rem] sm:text-xs text-gray-500 dark:text-neutral-400 mb-1 mt-0.5">標籤：</p>
                                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                          {imgDetail.tags.map((tag, tagIdx) => (
                                              <span key={tagIdx} className="text-[0.6rem] sm:text-xs bg-gray-200 dark:bg-neutral-600 text-gray-700 dark:text-neutral-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-xs">
                                              {tag}
                                              </span>
                                          ))}
                                          </div>
                                      </>
                                  ) : (
                                    <p className="text-[0.65rem] sm:text-xs text-gray-400 dark:text-neutral-500 italic mt-1">此圖片無標籤。</p>
                                  )}
                                </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="p-3 sm:p-4 border-t border-gray-200 dark:border-neutral-700 text-right bg-gray-50 dark:bg-neutral-800/60">
            <button
              onClick={onClose}
              className="px-4 py-1.5 sm:px-5 sm:py-2 bg-neutral-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-colors"
            >
              關閉
            </button>
        </footer>
      </div>
    </div>
  );
};
