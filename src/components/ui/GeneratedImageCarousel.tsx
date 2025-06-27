
import React from 'react';
import { GeneratedImageHistoryEntry } from '../../App'; 
import { FileTextIcon } from 'lucide-react';

interface GalleryItemProps {
  item: GeneratedImageHistoryEntry;
  onImageSelect: (item: GeneratedImageHistoryEntry) => void; 
  onUseAsPrompt: (imageUrl: string, originalPrompt: string) => void;
  onAddToMain: (imageUrl: string) => void;
  onGenerateReport?: (item: GeneratedImageHistoryEntry) => void;
  isGeneratingReport: boolean;
  activeGeneratingReportId: string | null;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ 
  item, 
  onImageSelect, 
  onUseAsPrompt, 
  onAddToMain, 
  onGenerateReport, 
  isGeneratingReport, 
  activeGeneratingReportId 
}) => {
  const { imageUrl, prompt } = item;

  const handleUseAsPromptClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onUseAsPrompt(imageUrl, prompt);
  };

  const handleAddToMainClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onAddToMain(imageUrl);
  };

  const handleGenerateReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGenerateReport) {
        onGenerateReport(item);
    }
  };

  const isReportForThisItemGenerating = isGeneratingReport && activeGeneratingReportId === item.id;

  return (
    <div 
      className="group relative block w-full text-left overflow-hidden rounded-lg shadow-md bg-gray-200 dark:bg-neutral-700 hover:shadow-xl focus:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-opacity-75 transition-all duration-200"
      role="button" 
      tabIndex={0} 
      onClick={() => onImageSelect(item)} 
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onImageSelect(item);}} 
      aria-label={`查看圖片詳情： ${prompt.substring(0, 40)}...`}
    >
      <img
        src={imageUrl}
        alt={`生成圖片：${prompt.substring(0, 40)}...`}
        className="h-48 w-full object-cover transition duration-300 ease-in-out group-hover:brightness-[.65] sm:h-56 md:h-64"
        loading="lazy"
        style={{ cursor: 'pointer' }} 
      />
      <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-[0.65rem] sm:text-xs font-medium text-white/95 leading-snug max-h-[calc(6em-2rem)] sm:max-h-[calc(6em-2.5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400/60 scrollbar-track-transparent">
          {prompt}
        </p>
        <div className="mt-auto pt-1.5 sm:pt-2 flex flex-wrap gap-1 sm:gap-1.5 justify-end">
            <button
                onClick={handleUseAsPromptClick}
                className="px-2 py-0.5 text-[0.6rem] sm:px-2.5 sm:py-1 sm:text-[10px] md:text-xs bg-sky-500/90 text-white rounded hover:bg-sky-600 shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-1 focus:ring-sky-300 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="使用此圖片作為提示圖片"
                disabled={isGeneratingReport}
            >
                設為主圖
            </button>
            <button
                onClick={handleAddToMainClick}
                className="px-2 py-0.5 text-[0.6rem] sm:px-2.5 sm:py-1 sm:text-[10px] md:text-xs bg-green-500/90 text-white rounded hover:bg-green-600 shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-1 focus:ring-green-300 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="將此圖片加入主要圖片列表"
                disabled={isGeneratingReport}
            >
                加入主要圖片
            </button>
            {onGenerateReport && (
                 <button
                    onClick={handleGenerateReportClick}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 py-0.5 text-[0.6rem] sm:px-2.5 sm:py-1 sm:text-[10px] md:text-xs bg-indigo-500/90 text-white rounded hover:bg-indigo-600 shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-60 disabled:cursor-wait"
                    aria-label="生成此圖片的設計建議報告"
                    disabled={isReportForThisItemGenerating}
                >
                    {isReportForThisItemGenerating ? (
                         <svg className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <FileTextIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
                    )}
                    報告
                </button>
            )}
        </div>
      </div>
      <div className="p-2 sm:p-3 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
          <p className="text-[0.65rem] sm:text-xs text-white/90 truncate">{prompt}</p>
      </div>
    </div>
  );
};

interface GeneratedImageGalleryProps {
  history: GeneratedImageHistoryEntry[]; 
  onImageSelect: (item: GeneratedImageHistoryEntry) => void;
  onUseAsPrompt: (imageUrl: string, originalPrompt: string) => void;
  onAddToMain: (imageUrl: string) => void;
  onGenerateReport?: (item: GeneratedImageHistoryEntry) => void;
  isGeneratingReport: boolean;
  activeGeneratingReportId: string | null;
}

export const GeneratedImageGallery: React.FC<GeneratedImageGalleryProps> = ({ 
  history, 
  onImageSelect, 
  onUseAsPrompt, 
  onAddToMain, 
  onGenerateReport, 
  isGeneratingReport,
  activeGeneratingReportId
}) => {
  if (!history || history.length === 0) {
    return <div className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-500 dark:text-neutral-400">目前選擇沒有可顯示的圖片。</div>;
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 md:gap-6">
        {history.map((item) => (
          <GalleryItem
            key={item.id} 
            item={item}
            onImageSelect={onImageSelect}
            onUseAsPrompt={onUseAsPrompt}
            onAddToMain={onAddToMain}
            onGenerateReport={onGenerateReport}
            isGeneratingReport={isGeneratingReport}
            activeGeneratingReportId={activeGeneratingReportId}
          />
        ))}
      </div>
    </div>
  );
};

export default GeneratedImageGallery;