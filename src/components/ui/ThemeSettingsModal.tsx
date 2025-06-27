
import React, { useEffect, useState } from 'react';
import { Button, Input, Separator } from './Primitives'; 

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultThemes: string[];
  customThemes: string[];
  currentTheme: string;
  onSelectTheme: (theme: string) => void;
  onAddCustomTheme: (themeName: string) => void;
  onDeleteCustomTheme: (themeName: string) => void;
  selectedEngine: string;
  onSelectEngine: (engine: string) => void;
  isGeminiApiAvailable: boolean;

  imagenOutputFormat: string; 
  onImagenOutputFormatChange: (format: string) => void;

  fluxOutputFormat: string; 
  onFluxOutputFormatChange: (format:string) => void;
  fluxPromptUpsampling: boolean;
  onFluxPromptUpsamplingChange: (enabled: boolean) => void;
  fluxSafetyTolerance: number;
  onFluxSafetyToleranceChange: (value: number) => void;
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

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-3.5 h-3.5 sm:w-4 sm:h-4"} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.094m7.072 0l-.21 1.687M7.5 5.25h9M7.5 5.25c-.621 0-1.155.51-1.155 1.155v.006c0 .645.534 1.155 1.155 1.155H12m0 0H7.5m11.25-8.25h-5.625c-.621 0-1.155.51-1.155 1.155v.006c0 .645.534 1.155 1.155 1.155H12m0 0h5.625m0 0v11.25c0 .621-.51 1.155-1.155 1.155H9.345c-.621 0-1.155-.51-1.155-1.155V7.5m0 0H2.25mC1.532 7.5.974 6.942.974 6.225v.007c0-.717.558-1.275 1.275-1.275H7.5Z" />
    </svg>
);


export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
    isOpen,
    onClose,
    defaultThemes,
    customThemes,
    currentTheme,
    onSelectTheme,
    onAddCustomTheme,
    onDeleteCustomTheme,
    selectedEngine,
    onSelectEngine,
    isGeminiApiAvailable,
    imagenOutputFormat,
    onImagenOutputFormatChange,
    fluxOutputFormat,
    onFluxOutputFormatChange,
    fluxPromptUpsampling,
    onFluxPromptUpsamplingChange,
    fluxSafetyTolerance,
    onFluxSafetyToleranceChange,
  }) => {
    const [newCustomThemeInput, setNewCustomThemeInput] = useState('');
  
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
  
    const handleAddThemeClick = () => {
      if (newCustomThemeInput.trim()) {
        onAddCustomTheme(newCustomThemeInput.trim());
        setNewCustomThemeInput('');
      }
    };

    const handleSafetyToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) value = 2;
        if (value < 0) value = 0;
        if (value > 5) value = 5;
        onFluxSafetyToleranceChange(value);
    };
  
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-settings-modal-title"
      >
        <div
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="p-4 sm:p-5 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
            <h2 id="theme-settings-modal-title" className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
              應用程式設定
            </h2>
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-100 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="關閉彈窗"
            >
              <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
            </button>
          </header>
  
          <div className="p-4 sm:p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent space-y-5 sm:space-y-6">
            <section>
                <h3 className="text-md sm:text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2 sm:mb-3">自訂提示主題</h3>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="new-custom-theme" className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    新增主題類別：
                  </label>
                  <div className="flex gap-1.5 sm:gap-2">
                    <Input
                      id="new-custom-theme"
                      type="text"
                      value={newCustomThemeInput}
                      onChange={(e) => setNewCustomThemeInput(e.target.value)}
                      placeholder="例如：海盜奇航"
                      className="flex-grow rounded-md text-xs sm:text-sm dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400 h-9 sm:h-10"
                      aria-label="新自訂主題名稱"
                      disabled={true} 
                    />
                    <Button
                      onClick={handleAddThemeClick}
                      disabled={true} 
                      variant="default" 
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md h-9 sm:h-10"
                      aria-label="新增自訂主題"
                    >
                      新增
                    </Button>
                  </div>
                   <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1 italic">新增自訂主題類別功能目前已停用。</p>
                </div>
    
                {customThemes.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5 sm:mb-2">您的主題：</h4>
                    <div className="space-y-1.5 sm:space-y-2">
                      {customThemes.map((theme) => (
                        <div key={`custom-${theme}`} className="flex items-center justify-between p-2 sm:p-2.5 rounded-md bg-neutral-50 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-600">
                          <button
                            onClick={() => onSelectTheme(theme)}
                            className={`text-xs sm:text-sm font-medium flex-grow text-left rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1
                                        ${currentTheme === theme ? 'text-sky-600 dark:text-sky-400 font-semibold' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600'}`}
                          >
                            {theme} {currentTheme === theme && <span className="text-[0.65rem] sm:text-xs"> （目前啟用）</span>}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteCustomTheme(theme)}
                            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-100/50 dark:hover:bg-red-700/30 ml-1.5 sm:ml-2 w-7 h-7 sm:w-8 sm:h-8"
                            aria-label={`刪除自訂主題 ${theme}`}
                          >
                            <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
      
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 mb-1.5 sm:mb-2">預設主題：</h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {defaultThemes.map((theme) => (
                      <button
                        key={`default-${theme}`}
                        onClick={() => onSelectTheme(theme)}
                        className={`w-full text-left p-2 sm:p-2.5 rounded-md text-xs sm:text-sm font-medium
                                    ${currentTheme === theme 
                                        ? 'bg-sky-500 text-white shadow-sm' 
                                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                    }`}
                      >
                        {theme} {currentTheme === theme && <span className="text-[0.65rem] sm:text-xs"> （目前啟用）</span>}
                      </button>
                    ))}
                  </div>
                </div>
            </section>

            <Separator />

            <section>
                <h3 className="text-md sm:text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2 sm:mb-3">圖像生成引擎設定</h3>
                
                <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        選擇生成引擎：
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {['flux', 'imagen'].map(engineValue => {
                            const engineLabel = engineValue === 'flux' ? 'Flux Kontext Max' : 'Imagen 3 (Gemini)';
                            return (
                                <button
                                    key={engineValue}
                                    type="button"
                                    role="radio"
                                    aria-checked={selectedEngine === engineValue}
                                    onClick={() => onSelectEngine(engineValue)}
                                    className={`w-full text-center p-2 sm:p-2.5 rounded-md text-xs sm:text-sm font-medium border
                                                ${selectedEngine === engineValue
                                                    ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                                }`}
                                >
                                    {engineLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedEngine === 'imagen' && (
                    <>
                        <div className="mb-3 sm:mb-4">
                            <label htmlFor="imagen-output-format" className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                輸出格式 (Imagen 3)：
                            </label>
                            <select
                                id="imagen-output-format"
                                value={imagenOutputFormat}
                                onChange={(e) => onImagenOutputFormatChange(e.target.value)}
                                className="w-full text-xs sm:text-sm p-1.5 sm:p-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm h-9 sm:h-10"
                                aria-label="Imagen 3 輸出格式"
                            >
                                <option value="image/jpeg">JPEG</option>
                                <option value="image/png">PNG</option>
                            </select>
                        </div>
                        <div className="p-2 rounded-md bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600">
                            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                                Imagen 3 使用應用程式預設的 Gemini API 金鑰。請確保已在 Netlify 環境變數中設定 `VITE_GEMINI_API_KEY` 並重新部署。
                            </p>
                            {!isGeminiApiAvailable && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                    警告：Gemini API 金鑰似乎未設定或無效，Imagen 3 可能無法運作。
                                </p>
                            )}
                        </div>
                    </>
                )}

                {selectedEngine === 'flux' && (
                    <>
                        <div className="mb-3 sm:mb-4">
                            <label htmlFor="flux-output-format" className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                輸出格式 (Flux)：
                            </label>
                            <select
                                id="flux-output-format"
                                value={fluxOutputFormat}
                                onChange={(e) => onFluxOutputFormatChange(e.target.value)}
                                className="w-full text-xs sm:text-sm p-1.5 sm:p-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm h-9 sm:h-10"
                                aria-label="Flux 輸出格式"
                            >
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                            </select>
                        </div>
                        <div className="mb-3 sm:mb-4 flex items-center">
                            <input
                                type="checkbox"
                                id="flux-prompt-upsampling"
                                checked={fluxPromptUpsampling}
                                onChange={(e) => onFluxPromptUpsamplingChange(e.target.checked)}
                                className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                aria-label="Flux 提示詞增強"
                            />
                            <label htmlFor="flux-prompt-upsampling" className="ml-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                啟用提示詞增強 (Prompt Upsampling)
                            </label>
                        </div>
                        <div className="mb-3 sm:mb-4">
                            <label htmlFor="flux-safety-tolerance" className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                安全容忍度 (0-5)：
                            </label>
                            <Input
                                id="flux-safety-tolerance"
                                type="number"
                                value={fluxSafetyTolerance}
                                onChange={handleSafetyToleranceChange}
                                min="0"
                                max="5"
                                step="1"
                                placeholder="預設 2"
                                className="w-full rounded-md text-xs sm:text-sm dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400 h-9 sm:h-10"
                                aria-label="Flux 安全容忍度"
                            />
                        </div>
                    </>
                )}
            </section>
          </div>
  
          <footer className="p-3 sm:p-4 border-t border-gray-200 dark:border-neutral-700 text-right bg-neutral-50 dark:bg-neutral-800/50">
            <Button
              onClick={onClose}
              variant="outline" 
              className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm rounded-md"
            >
              完成
            </Button>
          </footer>
        </div>
      </div>
    );
  };
