

import React, { useEffect, useState } from 'react';
import { GeneratedImageHistoryEntry, Project } from '../../App'; 
import { GeneratedImageGallery } from './GeneratedImageCarousel'; 
import { FileTextIcon } from 'lucide-react'; 

interface GeneratedImageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectIdFromApp: string | null;
  onProjectTabChange: (projectId: string | null) => void;
  onUseAsPrompt: (imageUrl: string, originalPrompt: string) => void;
  onAddToMain: (imageUrl: string) => void;
  onGenerateReport?: (item: GeneratedImageHistoryEntry) => void; 
  isGeneratingReport: boolean;
  activeGeneratingReportId: string | null;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className={className || "w-5 h-5 sm:w-6 sm:h-6"}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const GeneratedImageHistoryModal: React.FC<GeneratedImageHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  projects,
  activeProjectIdFromApp,
  onProjectTabChange,
  onUseAsPrompt,
  onAddToMain,
  onGenerateReport,
  isGeneratingReport,
  activeGeneratingReportId 
}) => {
  const [lightboxItem, setLightboxItem] = useState<GeneratedImageHistoryEntry | null>(null);
  const [internalActiveTabId, setInternalActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeProjectIdFromApp) {
        setInternalActiveTabId(activeProjectIdFromApp);
      } else if (projects.length > 0) {
        setInternalActiveTabId(projects.sort((a,b) => b.createdAt - a.createdAt)[0].id);
      } else {
        setInternalActiveTabId(null);
      }
    }
  }, [isOpen, activeProjectIdFromApp, projects]);

  const handleTabClick = (projectId: string) => {
    setInternalActiveTabId(projectId);
    onProjectTabChange(projectId); 
  };
  
  const handleOpenLightbox = (item: GeneratedImageHistoryEntry) => {
    setLightboxItem(item);
  };

  const handleCloseLightbox = () => {
    setLightboxItem(null);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (lightboxItem) {
          handleCloseLightbox();
        } else if (isOpen) {
          onClose();
        }
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
      if (!isOpen && !lightboxItem) { 
         document.body.style.overflow = 'auto';
      }
    };
  }, [isOpen, onClose, lightboxItem]);


  if (!isOpen) {
    return null;
  }

  const activeProject = projects.find(p => p.id === internalActiveTabId);
  const imagesToShow = activeProject ? activeProject.images : [];
  const sortedProjectsForTabs = [...projects].sort((a,b) => b.createdAt - a.createdAt);


  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4 transition-opacity duration-300 ease-in-out"
        onClick={onClose} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="generated-image-history-modal-title"
      >
        <div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md sm:max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="p-3 sm:p-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center flex-shrink-0">
            <h2 id="generated-image-history-modal-title" className="text-base sm:text-lg font-semibold text-[#1D1D1F] dark:text-neutral-100">
              生成圖片紀錄
            </h2>
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-100 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="關閉彈窗"
            >
              <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </header>

          {sortedProjectsForTabs.length > 0 && (
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-neutral-700 bg-gray-50/70 dark:bg-neutral-800/60 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-gray-100 dark:scrollbar-track-neutral-700">
              <nav className="flex space-x-1 px-1.5 py-1.5 sm:px-3 sm:py-2.5" aria-label="專案分頁">
                {sortedProjectsForTabs.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleTabClick(project.id)}
                    className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-60 transition-colors duration-150
                      ${internalActiveTabId === project.id 
                        ? 'bg-sky-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-800 dark:hover:text-neutral-100'
                      }`}
                    aria-current={internalActiveTabId === project.id ? 'page' : undefined}
                  >
                    {project.name} ({project.images.length})
                  </button>
                ))}
              </nav>
            </div>
          )}

          <div className="flex-grow overflow-y-auto bg-gray-50 dark:bg-neutral-800/30">
            {projects.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-neutral-400 py-8 sm:py-10 px-4 sm:px-6">尚無專案。請建立專案並生成圖片以在此處查看。</p>
              </div>
            ) : !activeProject && projects.length > 0 ? (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-neutral-400 py-8 sm:py-10 px-4 sm:px-6">請選擇一個專案分頁以查看其圖片。</p>
                 </div>
            ) : activeProject && imagesToShow.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-neutral-400 py-8 sm:py-10 px-4 sm:px-6">「{activeProject.name}」專案中尚無圖片。</p>
                </div>
            ) : (
              <GeneratedImageGallery 
                history={imagesToShow} 
                onImageSelect={handleOpenLightbox}
                onUseAsPrompt={onUseAsPrompt}
                onAddToMain={onAddToMain}
                onGenerateReport={onGenerateReport}
                isGeneratingReport={isGeneratingReport}
                activeGeneratingReportId={activeGeneratingReportId}
              />
            )}
          </div>
          <footer className="p-2 sm:p-3 border-t border-gray-200 dark:border-neutral-700 text-right bg-gray-100 dark:bg-neutral-800/60 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[0.7rem] sm:px-5 sm:py-2 sm:text-sm font-medium rounded-md bg-neutral-600 text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 transition-colors"
            >
              關閉
            </button>
          </footer>
        </div>
      </div>

      {lightboxItem && ( 
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-2 sm:p-4 transition-opacity duration-200 ease-in-out"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-prompt-title"
          aria-describedby="lightbox-prompt-content"
        >
          <div
            className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-auto h-auto max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseLightbox}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 p-1.5 sm:p-2 bg-black/40 text-white rounded-full hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              aria-label="關閉放大圖片檢視"
            >
              <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex-grow flex items-center justify-center p-2 sm:p-3 bg-gray-100 dark:bg-neutral-700 overflow-hidden">
              <img
                src={lightboxItem.imageUrl}
                alt={`放大圖片：${lightboxItem.prompt.substring(0, 50)}...`}
                className="block object-contain max-w-full max-h-full rounded-sm" 
              />
            </div>

            <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/80">
                {lightboxItem.prompt && (
                <div className="max-h-[10vh] sm:max-h-[15vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-neutral-500 scrollbar-track-gray-200 dark:scrollbar-track-neutral-600 mb-2 sm:mb-3">
                    <h3 id="lightbox-prompt-title" className="sr-only">圖片提示</h3>
                    <p id="lightbox-prompt-content" className="text-[0.65rem] sm:text-xs leading-relaxed text-gray-700 dark:text-neutral-200">
                    {lightboxItem.prompt}
                    </p>
                </div>
                )}
                <div className="flex gap-1.5 sm:gap-2 justify-end">
                    <button
                        onClick={() => onUseAsPrompt(lightboxItem.imageUrl, lightboxItem.prompt)}
                        className="px-2 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs bg-sky-500/90 text-white rounded-md hover:bg-sky-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="使用此圖片作為提示圖片"
                        disabled={isGeneratingReport}
                    >
                        設為主圖
                    </button>
                    <button
                        onClick={() => onAddToMain(lightboxItem.imageUrl)}
                        className="px-2 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs bg-green-500/90 text-white rounded-md hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="將此圖片加入主要圖片"
                        disabled={isGeneratingReport}
                    >
                        加入主要圖片
                    </button>
                    {onGenerateReport && (
                         <button
                            onClick={() => onGenerateReport(lightboxItem)}
                            className="flex items-center gap-1 px-2 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs bg-indigo-500/90 text-white rounded-md hover:bg-indigo-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-wait"
                            aria-label="生成此圖片的設計建議報告"
                            disabled={isGeneratingReport && activeGeneratingReportId === lightboxItem.id}
                        >
                            {(isGeneratingReport && activeGeneratingReportId === lightboxItem.id) ? 
                                <svg className="animate-spin h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                : <FileTextIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true"/>
                            }
                           {(isGeneratingReport && activeGeneratingReportId === lightboxItem.id) ? "報告生成中..." : "生成報告"}
                        </button>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
