
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlaceholdersAndVanishInput } from './components/ui/PlaceholdersAndVanishInput';
import { GeneratedImageHistoryModal } from './components/ui/GeneratedImageHistoryModal';
import { LoginModal } from './components/ui/LoginModal';
import { AnimatedTabs } from './components/ui/AnimatedTabs'; 
import { CogIcon } from './components/ui/CogIcon';
import { AppSettingsModal } from './components/ui/AppSettingsModal';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RefreshCwIcon, TagsIcon, BrainIcon, InfoIcon, CheckCircleIcon, FileTextIcon, CameraIcon } from 'lucide-react';
import { MultiSelectDropdown } from './components/ui/MultiSelectDropdown';
import { SplashScreen } from './components/ui/SplashScreen';
import { ReportModal, GeneratedReport } from './components/ui/ReportModal';
import { ImageCompareSlider } from './components/ui/ImageCompareSlider';
import { FloatingSlider } from './components/ui/FloatingSlider';

interface SelectedImageDataPerTab {
  id: string; 
  file: File;
  previewUrl: string;
  tags: string[];
  displayName:string;
  currentDropdownTagSelection?: string;
  aiGeneratedTags?: string[];
  isFetchingOcr?: boolean;
  ocrError?: string | null;
  manualTagInput?: string;
}

export interface GeneratedImageHistoryEntry {
  id: string;
  imageUrl: string;
  prompt: string;
  projectId: string; 
}

export interface Project {
  id:string;
  name: string;
  images: GeneratedImageHistoryEntry[];
  createdAt: number;
}

interface AiSuggestion {
  chinese: string;
  english: string;
}

const TAB_NAME_REFERENCE_INSPIRATION = "靈感";
const TAB_NAME_GENERATE_IMAGE = "參考";
const TAB_NAME_CAMERA = "相機";
const TAB_NAME_EDIT = "編輯";
const TAB_NAME_ADD_ELEMENT = "加入";

type TargetAspectRatioString = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";


const tagCategories = [
  { name: "物件類別", tags: ["家俱", "擺設", "掛件", "人物", "植物", "動物", "食物", "交通工具", "建築", "自然景觀", "其他物件"] },
  { name: "風格與色彩", tags: ["風格", "色調", "顏色"] },
  { name: "操作指令", tags: ["參考", "修改"] } 
];

const placeholderThemes: Record<string, string[]> = {
  "室內設計": [ 
    "為這個空間設計一個現代風格的佈局...",
    "想像一下這個房間採用侘寂美學...",
    "如果這個區域變成一個舒適的閱讀角落會是什麼樣子？",
    "生成一個帶有落地窗和充足自然光的明亮客廳。",
    "在「參考」模式下，設計一個帶有中島的開放式廚房。"
  ]
};


const CloseIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({ className, strokeWidth = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 sm:w-6 sm:h-6"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 12h4M9 15h2" />
  </svg>
);

const FolderPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 sm:w-6 sm:h-6"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A18.732 18.732 0 0 1 12 22.5c-2.786 0-5.433-.608-7.499-1.632Z" />
  </svg>
);

export const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.051-.986-.15-1.447l-1.428-4.286a1.125 1.125 0 0 0-1.996-.533l-1.042 1.042a9.75 9.75 0 0 1-4.743-4.743l1.042-1.042a1.125 1.125 0 0 0-.533-1.996L10.947.3a2.251 2.251 0 0 0-1.448-.15H7.875A2.25 2.25 0 0 0 5.625 2.25v2.25c0 .324.03.642.09.951Z" />
  </svg>
);

export const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4 sm:w-5 sm:h-5"} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

export const AppleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props} className={props.className || "w-5 h-5 sm:w-6 sm:h-6"} aria-hidden="true">
        <path d="M18.3977 14.7027C18.4357 13.5187 19.3157 12.6847 20.4437 12.5947C20.4817 12.5867 20.5197 12.5867 20.5497 12.5867C21.6597 12.5867 22.5397 11.7527 22.5857 10.5687C22.5937 10.3907 22.5937 10.2127 22.5937 10.0347C22.5937 7.26669 20.2697 4.96869 17.4857 4.95269C15.5417 4.88069 13.8457 5.96869 12.9257 7.56869C12.4837 7.49669 12.0337 7.47269 11.5837 7.47269C11.1977 7.47269 10.8277 7.49669 10.4737 7.54469C9.91172 6.53669 8.94372 5.76869 7.78172 5.48069C6.07772 5.04869 4.24572 5.73269 3.36572 7.19069C1.62172 10.0407 2.48572 13.8167 4.10172 16.2087C5.00572 17.5127 6.11572 18.6567 7.45372 19.4607C8.22172 19.9167 9.07772 20.2127 9.99772 20.2127C10.2377 20.2127 10.4777 20.1967 10.7097 20.1647C11.1017 20.0847 11.4777 19.9407 11.8457 19.7407C12.1177 19.5967 12.3817 19.4207 12.6377 19.2287C12.7417 19.1407 12.8377 19.0607 12.9337 18.9727L12.9737 18.9407C13.8857 18.2367 14.5417 17.3327 14.9017 16.2847C14.5157 16.2207 14.1457 16.1807 13.7617 16.1807C12.7257 16.1807 11.7577 16.5007 10.9417 17.0287C10.7977 17.1167 10.6537 17.2207 10.5097 17.3327C10.4537 17.3807 10.3977 17.4207 10.3417 17.4687C10.2457 17.5487 10.1417 17.6287 10.0377 17.7087C9.38172 18.1407 8.65372 18.3887 7.88572 18.3887C7.26172 18.3887 6.66972 18.2287 6.14172 17.9407C4.65372 17.1247 3.82972 15.3687 4.29372 13.7927C4.40572 13.4087 4.58172 13.0487 4.79772 12.7127C4.82172 12.6687 4.85372 12.6327 4.87772 12.5967C5.54172 11.6047 6.65972 10.9007 7.90172 10.9007C8.38172 10.9007 8.84572 11.0127 9.26172 11.2047C10.0377 11.5567 10.6057 12.2127 10.8217 13.0207C11.1897 14.3407 12.3657 15.3007 13.7617 15.3007C14.7897 15.3007 15.6857 14.7487 16.1337 13.8847C16.5337 13.0687 17.3817 12.5727 18.3977 12.5727C18.4357 12.5727 18.4737 12.5727 18.5177 12.5727C18.3177 13.2607 18.2617 13.9887 18.3977 14.7027Z" />
        <path d="M12.7099 2.05957C14.2889 2.18357 15.6199 3.01857 16.3809 4.15557C16.2919 4.17957 16.2029 4.20957 16.1079 4.23757C15.3639 4.45357 14.8039 5.14157 14.7249 5.93257C14.6539 6.65257 14.0799 7.22157 13.3599 7.22157C13.2539 7.22157 13.1479 7.21357 13.0499 7.19757C12.0619 7.04557 11.2779 6.27757 11.1739 5.28957C11.0459 4.09557 11.7519 3.00757 12.8319 2.62957C12.8079 2.45157 12.7839 2.25757 12.7099 2.05957Z" />
    </svg>
);

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL: Missing comma separator");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) throw new Error("Invalid data URL: MIME type not found");
    const mime = mimeMatch[1];
    
    let bstr;
    try {
        bstr = atob(arr[1]);
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        throw new Error("Invalid data URL: Failed to decode base64 content.");
    }

    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64StringWithPrefix = reader.result as string;
      const base64String = base64StringWithPrefix.split(',')[1];
      if (!base64String) {
        reject(new Error("Failed to extract base64 data from file."));
        return;
      }
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const processAndCropPromptImage = async (file: File): Promise<{
    croppedFile: File;
    croppedPreviewUrl: string;
    aspectRatioString: TargetAspectRatioString;
} | null> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const originalWidth = img.naturalWidth;
                const originalHeight = img.naturalHeight;
                let targetAspectRatioVal: number;
                let targetAspectRatioStr: TargetAspectRatioString;

                const currentRatio = originalWidth / originalHeight;

                if (originalHeight > originalWidth) { // Portrait
                    const ratio3_4 = 3 / 4;
                    const ratio9_16 = 9 / 16;

                    if (Math.abs(currentRatio - ratio3_4) < Math.abs(currentRatio - ratio9_16)) {
                        targetAspectRatioVal = ratio3_4;
                        targetAspectRatioStr = "3:4";
                    } else {
                        targetAspectRatioVal = ratio9_16;
                        targetAspectRatioStr = "9:16";
                    }
                } else { // Landscape or Square
                    const ratio4_3 = 4 / 3;
                    const ratio16_9 = 16 / 9;

                    if (Math.abs(currentRatio - ratio4_3) < Math.abs(currentRatio - ratio16_9)) {
                        targetAspectRatioVal = ratio4_3;
                        targetAspectRatioStr = "4:3";
                    } else {
                        targetAspectRatioVal = ratio16_9;
                        targetAspectRatioStr = "16:9";
                    }
                }
                
                let sx = 0, sy = 0, sWidth = originalWidth, sHeight = originalHeight;
                const canvas = document.createElement('canvas');

                if (currentRatio > targetAspectRatioVal) {
                    sWidth = originalHeight * targetAspectRatioVal;
                    sx = (originalWidth - sWidth) / 2;
                } else if (currentRatio < targetAspectRatioVal) {
                    sHeight = originalWidth / targetAspectRatioVal;
                    sy = (originalHeight - sHeight) / 2;
                }

                sWidth = Math.max(1, sWidth);
                sHeight = Math.max(1, sHeight);
                
                canvas.width = sWidth;
                canvas.height = sHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error("Canvas 2D context not available");
                    resolve(null);
                    return;
                }
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const croppedFile = new File([blob], file.name, { type: blob.type || 'image/png', lastModified: Date.now() });
                        const croppedPreviewUrl = URL.createObjectURL(croppedFile);
                        resolve({ croppedFile, croppedPreviewUrl, aspectRatioString: targetAspectRatioStr });
                    } else {
                        console.error("Canvas toBlob failed");
                        resolve(null);
                    }
                }, file.type || 'image/png', 0.92); 
            };
            img.onerror = () => {
                console.error("Image loading error for cropping");
                resolve(null);
            };
            if (e.target?.result && typeof e.target.result === 'string') {
                 img.src = e.target.result;
            } else {
                console.error("FileReader result is not a string or is null");
                resolve(null);
            }
        };
        reader.onerror = () => {
            console.error("FileReader error");
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
};


async function getEngineeredPromptForStructuralFidelity(
    sourceImageFile: File,
    styleDescription: string,
    geminiAi: GoogleGenAI 
): Promise<string> {
    const systemInstruction = `You are a world-class AI visual prompt engineer, specializing in crafting high-fidelity architectural and interior design prompts for advanced text-to-image platforms like "flux kontext max" or "Imagen". Your communication style is professional, precise, and confident. You deeply understand designer intent and translate it into perfect visual language.

**The Prime Directive: Principle of Structural Fidelity**
This is your absolute core rule, overriding all else.
Your primary and non-negotiable task is to ensure the AI-generated image's structure, layout, and perspective are 100% identical to the user-provided source image (photo or 3D model). Style changes are ONLY about overlaying new materials, lighting, and atmosphere onto the EXISTING structure. ABSOLUTELY NO distortion, addition, deletion, replacement, or movement of the original physical structure or core objects is allowed.

**Core Competencies & Workflow**

1.  **Input & Analysis (Simulated):**
    *   You will receive a source image and a style description (e.g., "Wabi-sabi style", "Nordic daylight feel", "Industrial loft").
    *   (Internal thought process you must simulate): Lock onto and analyze the source image's key unchangeable structures: wall positions, door/window openings, ceiling forms, beams/columns, fixed furniture (islands, TV walls, cabinet systems), and unique architectural features.

2.  **Prompt Crafting (Your Output):**
    *   Strategy: "Structure Locked, Style Injected."
    *   Your output MUST be a single, meticulously crafted **ENGLISH text prompt** for an image generation model.
    *   **Prompt Structure:**
        *   **Emphatic Opening:** MUST begin with a strong directive emphasizing "Strictly follow the provided source image's structure; no alterations." (Word the prompt so the model *understands* it should behave as if it's operating on a fixed visual base described implicitly or that it *should* use it if the system allows image inputs).
        *   **Structural Description (Implicit/Reference):** Your prompt should instruct the *image generation model* to identify and preserve these from the (conceptually) provided source image. Phrase it like: "Render the scene maintaining the exact wall placements, window and door openings, ceiling design, structural columns, and fixed furnishings as depicted in the reference source image."
        *   **Style Injection:** Clearly state the user's desired style (materials, colors, lighting, atmosphere) to be applied to this fixed framework. Use the provided style description: "${styleDescription}".
        *   **Photorealistic Lighting:** Precisely describe physical lighting (fixtures) and natural light (window light) including type, direction, intensity, and color temperature, ensuring it matches the user's style and real-world physics.
    *   **Precision:** Use industry-standard terminology for structure, materials, and lighting.
    *   **Language:** Your entire output prompt MUST be in professional, clear, structured **ENGLISH**.

Example of how your output prompt might look (this is what YOU generate):
"VERY IMPORTANT: Strictly adhere to the precise structure, layout, and perspective of the associated source image. No modifications to the original building envelope, core elements, or fixed furniture are permitted.
Re-imagine the existing scene from the source image, meticulously maintaining all wall positions, window and door openings, ceiling architecture, and structural components.
Apply the following style: ${styleDescription}.
Illuminate the space with [describe specific natural light, e.g., soft morning light through large windows] and [describe specific artificial lights, e.g., warm LED downlights and a central pendant fixture], ensuring realistic shadows and material interactions. The atmosphere should be [e.g., serene and minimalist / vibrant and eclectic].
Produce a photorealistic, high-resolution architectural visualization."

Output only the final English prompt. No other text.
`;

    const base64Image = await fileToBase64(sourceImageFile);
    const imagePart = {
        inlineData: { mimeType: sourceImageFile.type, data: base64Image },
    };
    const textPart = { text: `Source image provided. Style demand: "${styleDescription}". Generate the English image generation prompt based on the system instruction.` };

    const response: GenerateContentResponse = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: { parts: [textPart, imagePart] },
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return (response.text || "").trim();
}

async function getEngineeredImageModificationPrompt(
    sourceImageFile: File,
    userStyleObjectDescription: string,
    referenceImagesData: SelectedImageDataPerTab[],
    geminiAi: GoogleGenAI
): Promise<string> {
    const systemInstruction = `You are a world-class AI visual prompt engineer, specializing in crafting high-fidelity architectural and interior design prompts for advanced text-to-image platforms like "flux kontext max" or "Imagen". Your communication style is professional, precise, and confident.

**Core Task: Object Integration into Source Image**
Your primary goal is to generate an ENGLISH text prompt that instructs an image generation model to seamlessly integrate or replace objects within a 'Source Image' based on 'Reference Image(s)' and a 'User Style/Object Description'. The prompt must ensure the structural integrity, perspective, scale, and lighting of the 'Source Image' are meticulously maintained for all unchanged elements.

**Input You Will Receive (Conceptually):**
1.  **Source Image:** The main image to be modified. (Provided as 'Image for Modification')
2.  **User Style/Object Description:** Text from the user describing the new object they want to add/replace, its style, material, color, or specific instructions for modification. (Provided as 'User Objective')
3.  **Reference Image(s) (Optional):** One or more images providing visual examples of the object to be integrated. Each reference image MAY come with 'Reference Image Tags' (user-provided or AI-generated) that highlight key aspects of that reference image. (Provided as 'Reference Image 1', 'Reference Image 2', etc., along with their tags)

**Your Output: A Single English Prompt for an Image Generation Model**

**Key Prompt Engineering Principles (Dual Command Approach):**

1.  **Object Command (What to Change/Add):**
    *   Clearly identify the object from the 'Reference Image(s)' (guided by their 'Reference Image Tags' if available, and the 'User Style/Object Description').
    *   Describe the new object's key characteristics (style, material, color, specific type). For example: "a plush velvet armchair in emerald green," "a minimalist oak wood coffee table." This description should be derived from the 'User Style/Object Description' and refined by any 'Reference Image(s)' and their 'Tags'.
    *   Specify the action, informed by the 'User Style/Object Description' (e.g., if user says "replace sofa", it's replacement; if "add a plant", it's addition):
        *   **Replacement:** "Replace the existing [specific object in Source Image, e.g., 'old red sofa', infer this from the Source Image if not explicitly stated by user but implied by User Objective like 'new sofa'] with [description of new object]."
        *   **Addition:** "Add a [description of new object] into the [specific location in Source Image, e.g., 'empty corner by the window', infer this or use a general placement if not specified]."
    *   If 'Reference Image Tags' are provided for a reference image, these tags are CRITICAL. Your description of the new object to be added/replaced MUST strongly align with these tags. The 'User Style/Object Description' refines this.

2.  **Integration Command (How to Blend Seamlessly into Source Image):**
    *   **Perspective and Scale:** "The new [object type] MUST perfectly match the exact perspective and scale of the Source Image's room context." If replacing, "it must occupy the same footprint and perceived size as the original [object being replaced]." If adding, "it must be realistically scaled relative to other objects in the Source Image."
    *   **Lighting and Shadows:** "The new [object type] MUST be illuminated according to the Source Image's existing lighting conditions (e.g., 'natural light from the left window', 'warm ambient light from ceiling fixtures'). It MUST cast realistic, soft shadows onto adjacent surfaces (e.g., 'the wooden floor', 'the nearby wall') consistent with the Source Image's light sources."
    *   **Interaction (If Applicable):** If the new object interacts with other elements (e.g., a vase on a new table), state: "Ensure existing objects like [e.g., 'the vase'] are realistically placed on/around the new [object type]."
    *   **Preservation of Unchanged Elements:** "Crucially, ALL OTHER elements, furniture, architectural details, and the overall environment of the Source Image MUST remain ABSOLUTELY UNCHANGED. No alterations to the background, surrounding objects, or room structure."

**Example Prompt Structures (Combine Object and Integration Commands):**

*   **For Replacement (User Objective: "replace the current sofa with a blue velvet one like in reference 1"):**
    "URGENT: Image Modification Task.
    Source Image is the base. User Objective: '${userStyleObjectDescription}'.
    Reference Image 1 shows the desired [object type inferred from user objective and ref tags]. Tags for Reference Image 1: [List tags for Ref 1].
    Based on this, REPLACE the existing [e.g., 'sofa'] in the Source Image with a [e.g., 'blue velvet sofa'] visually similar to Reference Image 1, especially its [relevant tags, e.g., 'tufted design', 'gold legs'].
    The new sofa MUST adopt the precise perspective, scale, and spatial position of the original sofa.
    It MUST be lit by the Source Image's existing lighting and cast accurate, soft shadows on the [surface, e.g., 'area rug'].
    ALL OTHER ELEMENTS of the Source Image (walls, windows, other furniture, decor) MUST remain IDENTICAL and UNCHANGED.
    Produce a photorealistic, high-resolution architectural visualization."

*   **For Addition (User Objective: "add a tall plant from reference 2 to the corner"):**
    "URGENT: Image Modification Task.
    Source Image is the base. User Objective: '${userStyleObjectDescription}'.
    Reference Image 1 shows [object type, e.g., 'a tall Fiddle Leaf Fig plant']. Tags for Reference Image 1: [List tags for Ref 1].
    Based on this, ADD a [e.g., 'tall Fiddle Leaf Fig plant in a ceramic pot'] inspired by Reference Image 1.
    Place this plant [specific location if mentioned in User Objective, otherwise e.g., 'in a suitable empty corner, such as near the window'] in the Source Image.
    The new plant MUST be rendered with perspective and scale that is perfectly consistent with the Source Image's room.
    It MUST be lit by the Source Image's existing lighting and cast realistic shadows.
    ALL OTHER ELEMENTS of the Source Image (existing furniture, walls, windows, decor) MUST remain IDENTICAL and UNCHANGED.
    Produce a photorealistic, high-resolution architectural visualization."

**Workflow Guidance (Internal Thought Process):**
1.  Examine the 'User Style/Object Description'. This is the primary intent.
2.  For each 'Reference Image':
    *   Prioritize its 'Tags' (both user-provided and AI-generated) to understand what specific element/style from that reference is desired.
    *   Use the visual of the 'Reference Image' to inform the characteristics of the object to be added/replaced, filtered by the tags.
3.  Analyze the 'Source Image' to understand its spatial context, lighting, and existing objects.
4.  Determine if it's an "addition" or "replacement" task based on the user's description.
5.  Construct the English prompt using the principles and examples above. Ensure it's a single, coherent block of text.

Output ONLY the final English prompt. No other text or explanation.
`;

    const parts: any[] = [];
    const sourceBase64 = await fileToBase64(sourceImageFile);
    parts.push({ text: "Image for Modification (Source Image):" });
    parts.push({ inlineData: { mimeType: sourceImageFile.type, data: sourceBase64 } });
    parts.push({ text: `User Objective: "${userStyleObjectDescription}"` });

    for (let i = 0; i < referenceImagesData.length; i++) {
        const refData = referenceImagesData[i];
        const refBase64 = await fileToBase64(refData.file);
        const allTags = Array.from(new Set([...refData.tags, ...(refData.aiGeneratedTags || [])]));
        parts.push({ text: `Reference Image ${i + 1} (Display Name: ${refData.displayName}): Tags: [${allTags.join(", ")}]` });
        parts.push({ inlineData: { mimeType: refData.file.type, data: refBase64 } });
    }
    
    parts.push({ text: "Based on all the above, generate the final English image generation prompt following the system instruction." });

    const response: GenerateContentResponse = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17', 
        contents: { parts: parts },
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return (response.text || "").trim();
}


const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userBasePrompt, setUserBasePrompt] = useState(""); 
  const [selectedAiSuggestionValues, setSelectedAiSuggestionValues] = useState<string[]>([]); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState(false);
  const [activePlaceholderTheme, setActivePlaceholderTheme] = useState<string>("室內設計");
  const [customPlaceholderThemes, setCustomPlaceholderThemes] = useState<Record<string, string[]>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false); 
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isRecentQuotaError, setIsRecentQuotaError] = useState<boolean>(false);
  const [lastPromptForGeneratedImage, setLastPromptForGeneratedImage] = useState<string | null>(null);


  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = localStorage.getItem('styleguideAiProjects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    } catch (e) {
      console.error("Failed to parse projects from localStorage", e);
      return [];
    }
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => localStorage.getItem('styleguideAiCurrentProjectId'));
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [showNewProjectInput, setShowNewProjectInput] = useState<boolean>(false);
  const [isGeneratedHistoryModalOpen, setIsGeneratedHistoryModalOpen] = useState(false);
  const [activeModalProjectId, setActiveModalProjectId] = useState<string | null>(null);
  const [projectCreationError, setProjectCreationError] = useState<string | null>(null);
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState<boolean>(false);

  const [promptSpecificImageFile, setPromptSpecificImageFile] = useState<File | null>(null);
  const [promptSpecificImagePreviewUrl, setPromptSpecificImagePreviewUrl] = useState<string | null>(null);
  const [currentPromptImageAspectRatio, setCurrentPromptImageAspectRatio] = useState<TargetAspectRatioString | null>(null);
  
  const aiStyleTopics: { label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { label: TAB_NAME_REFERENCE_INSPIRATION },
    { label: TAB_NAME_GENERATE_IMAGE },
    { label: TAB_NAME_CAMERA, icon: CameraIcon },
    { label: TAB_NAME_EDIT },
    { label: TAB_NAME_ADD_ELEMENT },
  ];

  const [activeAnimatedTab, setActiveAnimatedTab] = useState<string>(TAB_NAME_GENERATE_IMAGE); 
  const [lastNonCameraActiveTab, setLastNonCameraActiveTab] = useState<string>(TAB_NAME_GENERATE_IMAGE);
  
  const [tabSelectedImageData, setTabSelectedImageData] = useState<Record<string, SelectedImageDataPerTab[]>>({});

  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [isFetchingAiSuggestions, setIsFetchingAiSuggestions] = useState<boolean>(false); 
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null); 

  const [genModeSelectedTagsForPrompt, setGenModeSelectedTagsForPrompt] = useState<string[]>([]);
  const [isGeneratingPromptByButtonClick, setIsGeneratingPromptByButtonClick] = useState<boolean>(false);
  const [promptGenerationByButtonClickError, setPromptGenerationByButtonClickError] = useState<string | null>(null);
  
  const [isCorrectingAllTagsGlobal, setIsCorrectingAllTagsGlobal] = useState<boolean>(false);
  const [tagCorrectionGlobalError, setTagCorrectionGlobalError] = useState<string | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [activeGeneratingReportId, setActiveGeneratingReportId] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [generatedReportContent, setGeneratedReportContent] = useState<GeneratedReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [activeImageForReport, setActiveImageForReport] = useState<GeneratedImageHistoryEntry | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [showImageCompare, setShowImageCompare] = useState<boolean>(false);
  const [beforeImageUrlForCompare, setBeforeImageUrlForCompare] = useState<string | null>(null);

  const [selectedEngine, setSelectedEngine] = useState<string>(() => localStorage.getItem('preferredImageEngine') || 'flux');
  const [imagenOutputFormat, setImagenOutputFormat] = useState<string>(() => localStorage.getItem('imagenOutputFormat') || 'image/jpeg');
  const [fluxOutputFormat, setFluxOutputFormat] = useState<string>(() => localStorage.getItem('fluxOutputFormat') || 'png');
  const [fluxPromptUpsampling, setFluxPromptUpsampling] = useState<boolean>(() => (localStorage.getItem('fluxPromptUpsampling') === 'true') || false);
  const [fluxSafetyTolerance, setFluxSafetyTolerance] = useState<number>(() => parseInt(localStorage.getItem('fluxSafetyTolerance') || '2', 10));
  const [isFloatingSliderCollapsed, setIsFloatingSliderCollapsed] = useState<boolean>(true);


  const ai = React.useMemo(() => process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null, []);

  const sortedProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt);
  
  const currentTabImages = activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA 
    ? (tabSelectedImageData[activeAnimatedTab] || []) 
    : [];

  const currentInputTextForDisplay = userBasePrompt + 
    (selectedAiSuggestionValues.length > 0
      ? (userBasePrompt.length > 0 ? " " : "") + selectedAiSuggestionValues.join(", ") 
      : "");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { localStorage.setItem('styleguideAiProjects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { 
    if (currentProjectId) localStorage.setItem('styleguideAiCurrentProjectId', currentProjectId);
    else localStorage.removeItem('styleguideAiCurrentProjectId');
  }, [currentProjectId]);

  useEffect(() => { localStorage.setItem('preferredImageEngine', selectedEngine); }, [selectedEngine]);
  useEffect(() => { localStorage.setItem('imagenOutputFormat', imagenOutputFormat); }, [imagenOutputFormat]);
  useEffect(() => { localStorage.setItem('fluxOutputFormat', fluxOutputFormat); }, [fluxOutputFormat]);
  useEffect(() => { localStorage.setItem('fluxPromptUpsampling', String(fluxPromptUpsampling)); }, [fluxPromptUpsampling]);
  useEffect(() => { localStorage.setItem('fluxSafetyTolerance', String(fluxSafetyTolerance)); }, [fluxSafetyTolerance]);

  useEffect(() => {
    if (!currentProjectId && sortedProjects.length > 0) {
      setCurrentProjectId(sortedProjects[0].id);
    } else if (currentProjectId && !sortedProjects.find(p => p.id === currentProjectId)) {
      setCurrentProjectId(sortedProjects.length > 0 ? sortedProjects[0].id : null);
    }
  }, [projects, currentProjectId, sortedProjects]); 

  const handleTabChange = (newTabLabel: string) => {
    if (newTabLabel !== TAB_NAME_CAMERA) {
      setLastNonCameraActiveTab(newTabLabel);
      setIsCameraActive(false); 
    } else {
      setIsCameraActive(true); 
    }
    setActiveAnimatedTab(newTabLabel);
    setUserBasePrompt(""); 
    setSelectedAiSuggestionValues([]);
    setGenModeSelectedTagsForPrompt([]); 
    setAiSuggestions([]);
    setAiSuggestionError(null);
    setPromptGenerationByButtonClickError(null);
    setCapturedImagePreview(null);
    setCameraError(null);
  };

  const startCamera = async () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraError(null);
    setCapturedImagePreview(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setCameraStream(stream);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (err: any) {
        console.error("Error accessing camera:", err);
        setCameraError(`無法啟用相機：${err.message}. 請確認已授予相機權限。`);
        setIsCameraActive(false); 
        setActiveAnimatedTab(lastNonCameraActiveTab || TAB_NAME_GENERATE_IMAGE);
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (isCameraActive) {
        startCamera();
    } else {
        stopCamera();
    }
    return () => { 
        stopCamera();
    };
  }, [isCameraActive, stopCamera]);

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImagePreview(dataUrl);
            stopCamera(); 
        }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImagePreview(null);
    startCamera();
  };

  const handleUseCapturedPhotoAsPromptImage = async () => {
    if (capturedImagePreview) {
        const file = dataURLtoFile(capturedImagePreview, `captured_prompt_${Date.now()}.jpg`);
        await handlePromptImageSelect(file); 
        setCapturedImagePreview(null);
        setIsCameraActive(false);
        setActiveAnimatedTab(lastNonCameraActiveTab || TAB_NAME_GENERATE_IMAGE);
    }
  };

  const handleAddCapturedPhotoToMainImages = () => {
    if (capturedImagePreview && lastNonCameraActiveTab && lastNonCameraActiveTab !== TAB_NAME_CAMERA && lastNonCameraActiveTab !== TAB_NAME_REFERENCE_INSPIRATION) {
        const file = dataURLtoFile(capturedImagePreview, `captured_main_${Date.now()}.jpg`);
        const currentImagesForTargetTab = tabSelectedImageData[lastNonCameraActiveTab] || [];
        if (currentImagesForTargetTab.length < 3) {
            const newImageData: SelectedImageDataPerTab = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                file: file,
                previewUrl: URL.createObjectURL(file),
                tags: [],
                displayName: `相機照片 ${currentImagesForTargetTab.length + 1}`,
                currentDropdownTagSelection: "",
                manualTagInput: "",
                aiGeneratedTags: [],
                isFetchingOcr: false,
                ocrError: null,
            };
            if (lastNonCameraActiveTab === TAB_NAME_GENERATE_IMAGE && ai) {
                fetchOcrTagsForImage(newImageData, lastNonCameraActiveTab);
            }
            setTabSelectedImageData(prev => ({
                ...prev,
                [lastNonCameraActiveTab]: [...currentImagesForTargetTab, newImageData]
            }));
            setCapturedImagePreview(null);
            setIsCameraActive(false);
            setActiveAnimatedTab(lastNonCameraActiveTab);
        } else {
            setCameraError(`「${lastNonCameraActiveTab}」分頁最多只能有3張主要圖片。`);
        }
    } else if (lastNonCameraActiveTab === TAB_NAME_REFERENCE_INSPIRATION) {
         setCameraError(`無法將相機照片加入「${TAB_NAME_REFERENCE_INSPIRATION}」分頁的主要圖片。`);
    }
  };


  const handleCreateProject = () => {
    setProjectCreationError(null);
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setProjectCreationError("專案名稱不能為空。");
      return;
    }
    if (projects.find(p => p.name === trimmedName)) {
      setProjectCreationError("具有此名稱的專案已存在。");
      return;
    }
    const newProject: Project = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: trimmedName,
      images: [],
      createdAt: Date.now(),
    };
    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    setActiveModalProjectId(newProject.id);
    setNewProjectName("");
    setShowNewProjectInput(false);
    setIsProjectsCollapsed(false);
  };

  const toggleProjectsCollapse = () => {
    setIsProjectsCollapsed(prev => !prev);
  };

  const handlePromptInputChange = (newFullText: string) => {
    setUserBasePrompt(newFullText);
    if (isRecentQuotaError) setIsRecentQuotaError(false);
    if (generationError) setGenerationError(null);
    if (aiSuggestionError) setAiSuggestionError(null);
    if (promptGenerationByButtonClickError) setPromptGenerationByButtonClickError(null);
  };
  
  const handleGeneralAiSuggestionsSelect = (newSelectedEngStrings: string[]) => {
    setSelectedAiSuggestionValues(newSelectedEngStrings);
  };

  const dismissGenerationError = () => {
    setGenerationError(null);
    if (isRecentQuotaError) {
      setIsRecentQuotaError(false);
    }
  };

  const fetchOcrTagsForImage = useCallback(async (imageToTag: SelectedImageDataPerTab, forTab: string) => {
    if (!ai || forTab !== TAB_NAME_GENERATE_IMAGE) return;

    handlePerImageStateChange(forTab, imageToTag.id, 'isFetchingOcr', true);
    handlePerImageStateChange(forTab, imageToTag.id, 'ocrError', null);
    handlePerImageStateChange(forTab, imageToTag.id, 'aiGeneratedTags', []);


    const systemInstruction = `你是一位專業的室內設計AI助理。請分析提供的圖片。識別並列出詳細的視覺元素作為標籤。將這些標籤分類至以下類別：'空間名稱' (例如：客廳、臥室、廚房、庭院、辦公空間), '風格名稱', '主要物件描述', '次要物件描述', '空間氛圍', '色彩搭配', '材質特點', '光線照明', '家俱類型', '家俱品牌或風格', '硬裝風格', '軟裝風格', '裝飾品', '植物綠化', '窗景視野', '空間佈局技巧', '使用者定義情境'（例如，嘗試推斷 '閱讀角落', '家庭辦公室'）。如果圖片與室內設計無關，請提供通用的描述性標籤。以 JSON 物件格式輸出，其中鍵是類別，值是字串標籤陣列。例如：{\"空間名稱\": [\"客廳\"], \"風格名稱\": [\"現代簡約\", \"北歐風\"], \"家俱類型\": [\"布藝沙發\", \"實木茶几\"]}。如果某類別沒有相關標籤，可以省略該類別或提供空陣列。請專注於最顯著的特徵。整體主題情境為：${activePlaceholderTheme}。`;

    try {
        const base64Image = await fileToBase64(imageToTag.file);
        const imagePart = {
            inlineData: { mimeType: imageToTag.file.type, data: base64Image },
        };
        const textPart = { text: `分析這張圖片，主題是 ${activePlaceholderTheme}。` };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: [textPart, imagePart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });
        
        let jsonStr = (response.text || "").trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);
        let allTags: string[] = [];
        if (typeof parsedData === 'object' && parsedData !== null) {
            Object.values(parsedData).forEach((categoryTags) => {
                if (Array.isArray(categoryTags)) {
                    allTags = [...allTags, ...categoryTags.filter(tag => typeof tag === 'string')];
                }
            });
        }
        const uniqueTags = Array.from(new Set(allTags));
        handlePerImageStateChange(forTab, imageToTag.id, 'aiGeneratedTags', uniqueTags.slice(0, 15)); 

    } catch (error: any) {
        console.error("Error fetching OCR tags:", error);
        handlePerImageStateChange(forTab, imageToTag.id, 'ocrError', `OCR標籤生成失敗: ${error.message || '未知錯誤'}`);
    } finally {
        handlePerImageStateChange(forTab, imageToTag.id, 'isFetchingOcr', false);
    }
  }, [ai, activePlaceholderTheme]);


  const fetchGeneralAiSuggestions = useCallback(async () => {
    if (!ai || activeAnimatedTab === TAB_NAME_GENERATE_IMAGE || activeAnimatedTab === TAB_NAME_CAMERA) { 
      setAiSuggestions([]);
      setAiSuggestionError(null);
      setIsFetchingAiSuggestions(false);
      return;
    }

    setIsFetchingAiSuggestions(true);
    setAiSuggestions([]);
    setAiSuggestionError(null);

    let systemInstruction = "";
    let contents: { parts: any[] } = { parts: [] };
    let imageFileToProcess: File | null = null;
    
    const currentTabImagesForRequest = activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA
      ? (tabSelectedImageData[activeAnimatedTab] || [])
      : [];


    if (activeAnimatedTab === TAB_NAME_EDIT) {
         if (promptSpecificImageFile) {
            imageFileToProcess = promptSpecificImageFile;
        } else if (currentTabImagesForRequest.length > 0) {
            imageFileToProcess = currentTabImagesForRequest[0].file;
        }

        if (!imageFileToProcess) {
            setAiSuggestions([]);
            setAiSuggestionError(null);
            setIsFetchingAiSuggestions(false);
            return;
        }
        
        systemInstruction = "You are an AI assistant. Your task is to analyze an image and provide editing suggestions. Provide exactly 8 editing suggestions. Each suggestion must be an object with two keys: 'chinese' (Traditional Chinese, concise, under 15 characters) and 'english' (US English, concise, under 10 words). VERY IMPORTANT: Output ONLY and EXACTLY a JSON array of these 8 suggestion objects. Do NOT include any other text or commentary outside the JSON structure. The response must be a single, valid JSON array string. For example: [{\"chinese\": \"沙發改紅色\", \"english\": \"Change sofa to red\"}, {\"chinese\": \"加隻寵物貓\", \"english\": \"Add a pet cat\"}]";
        try {
            const base64Image = await fileToBase64(imageFileToProcess);
            const imagePart = {
                inlineData: {
                mimeType: imageFileToProcess.type,
                data: base64Image,
                },
            };
            contents.parts = [imagePart];
        } catch (error) {
            console.error(`Error processing image for '${TAB_NAME_EDIT}' tab:`, error);
            setAiSuggestionError("處理圖片以獲取建議失敗。");
            setIsFetchingAiSuggestions(false);
            return;
        }
    } else if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION) {
        if (!promptSpecificImageFile) { 
            setAiSuggestions([]);
            setAiSuggestionError(null); 
            setIsFetchingAiSuggestions(false);
            return;
        }

        systemInstruction = `You are a world-class AI visual prompt engineer, specializing in crafting high-fidelity architectural and interior design prompts. Your communication style is professional, precise, and confident. You are working with a 'Source Image' provided by the user, which depicts a room or architectural space.

**The Prime Directive: Principle of Structural Fidelity**
This is your absolute core rule. Any image generated based on your suggestions MUST ensure the AI-generated image's structure, layout, and perspective are 100% identical to the user-provided 'Source Image'. Style changes ONLY overlay new materials, lighting, and atmosphere onto the EXISTING structure. ABSOLUTELY NO distortion, addition, deletion, replacement, or movement of original physical structure or core objects is allowed.

**Core Task for "靈感" (Inspiration) Mode:**
Analyze the provided 'Source Image'. Generate 8 creative suggestion pairs. Each pair must have:
1.  'chinese': A concise, user-friendly suggestion or question in Traditional Chinese, as if the user is asking for ideas. This is what the user will see.
2.  'english': A corresponding concise, complete English image generation prompt sentence. This English prompt MUST:
    a.  Instruct an advanced image generation model (like Imagen or Flux) to re-imagine the 'Source Image'.
    b.  Strictly adhere to the 'Source Image's original structure, layout, and perspective.
    c.  Reflect the stylistic intent of the 'chinese' suggestion.
    d.  Be ready for direct use by the image generation model.

**Specific Chinese Suggestions to Include (AI should select appropriate styles for placeholders):**
*   "我想改造我的房間有什麼建議?"
*   "幫我把照片風格轉為[AI選擇一個具體風格，例如：工業風、北歐風、現代簡約風]風格"
*   "如何搭配我的房間?"
*   "我的客廳適合什麼風格?" (If the image isn't a living room, adapt this, e.g., "這個空間適合什麼風格?")

**Other Chinese Suggestions (fill the remaining slots up to 8):**
*   Generate short Traditional Chinese sentences that propose different stylistic interpretations or ask for specific aesthetic changes while respecting structural fidelity. Examples: "嘗試日式侘寂風格。", "賦予空間現代奢華感。", "如果變成夜晚的氛圍呢？", "使用更溫暖的木質調材質。"

**Example output objects (illustrative):**
{
  "chinese": "我想改造我的房間有什麼建議?",
  "english": "Showcase several renovation ideas for the provided room, strictly maintaining its original structure and layout but exploring different materials, color palettes, and decor styles. Photorealistic rendering."
}
{
  "chinese": "幫我把照片風格轉為現代簡約風",
  "english": "Re-render the provided scene in a modern minimalist style. All structural elements, layout, and perspective must remain identical to the source image. Focus on clean lines, neutral colors, and uncluttered spaces. Photorealistic."
}

**Output Format:**
Respond ONLY with a valid JSON array of exactly 8 suggestion objects, each containing 'chinese' (Traditional Chinese) and 'english' (English prompt sentence) keys. Do NOT include any markdown formatting like \`\`\`json or any other explanatory text.
`;
        try {
            const parts = [];
            const primaryBase64 = await fileToBase64(promptSpecificImageFile);
            parts.push({text: "Source Image for Structure (Analyze this image and generate 8 suggestion pairs based on the system instruction):"});
            parts.push({ inlineData: { mimeType: promptSpecificImageFile.type, data: primaryBase64 } });
            contents.parts = parts;
        } catch (error) {
            console.error(`Error processing images for '${TAB_NAME_REFERENCE_INSPIRATION}' tab:`, error);
            setAiSuggestionError("處理「提示特定圖片」以獲取風格建議失敗。");
            setIsFetchingAiSuggestions(false);
            return;
        }
    } else if (activeAnimatedTab === TAB_NAME_ADD_ELEMENT) {
        const primaryImageFile = promptSpecificImageFile;
        const referenceImagesWithTags = currentTabImagesForRequest
            .filter(imgData => imgData.tags.length > 0)
            .map(imgData => ({
                file: imgData.file,
                displayName: imgData.displayName,
                tags: imgData.tags 
            }));

        if (!primaryImageFile || referenceImagesWithTags.length === 0) {
            setAiSuggestions([]);
            setAiSuggestionError(null); 
            setIsFetchingAiSuggestions(false);
            return;
        }
        
        systemInstruction = `You are an AI visual design assistant.
Your task is to suggest 8 creative ways to ADD objects or elements described by 'User Tags' from 'Reference Images' into a 'Primary Image'.
You will receive:
1. A 'Primary Image' (the image to be modified).
2. One or more 'Reference Images' (up to 3). For each Reference Image, you will also receive a list of 'User Tags' provided by the user for that specific Reference Image. These tags describe the object(s) or element(s) the user is interested in from that image.

Instructions:
A. Analyze the 'Primary Image' to understand its current content, style, and available space.
B. For each 'Reference Image' and its 'User Tags':
    a. Interpret the 'User Tags' to understand what specific object(s), type of object, or element(s) the user wants to take from this Reference Image (e.g., if tags include '家俱' and '紅色扶手椅', focus on a red armchair; if tags include '人物', focus on a woman).
    b. Visually locate the most prominent or relevant object/element in the Reference Image that matches these User Tags. If tags are very general (e.g. '家俱'), pick a prominent piece of furniture.
    c. Suggest how to integrate this specific object/element into the 'Primary Image' in a natural or creative way.
    d. Consider placement, scale, and interaction with existing elements in the Primary Image.
C. Generate 8 actionable suggestions. Each suggestion should clearly state which object/element (inferred from tags) is being added and from which Reference Image (e.g., "Add the 'red armchair' based on tags from Reference Image 1 to the living room area of the Primary Image."). Use the display names like "Image 1", "Image 2" when referring to reference images.
D. Be creative with placement and context. For example, if adding an object based on a 'woman' tag from Reference Image 2 and the Primary Image has a sofa, suggest "Place the 'woman' (from Reference Image 2 tags) sitting on the sofa in the Primary Image."
E. If a Reference Image has multiple tags that seem to describe different objects, you can pick the most prominent one or offer suggestions for different objects if feasible within the 8-suggestion limit. If tags are ambiguous, make a reasonable interpretation.
F. Provide suggestions in a JSON array format. Each element must be an object with two keys:
    *   \`chinese\`: The suggestion in Traditional Chinese (concise, e.g., "將參考圖[編號]的[標籤描述物件]加入主圖的[位置]").
    *   \`english\`: The suggestion in US English (concise, e.g., "Add [tag-described object] from Reference Image [Number] to [location] in the main image").
G. VERY IMPORTANT: Output ONLY and EXACTLY a JSON array of these 8 suggestion objects. Do NOT include any other text or commentary outside the JSON structure. The response must be a single, valid JSON array string.
`;
        try {
            const parts = [];
            const primaryBase64 = await fileToBase64(primaryImageFile);
            parts.push({text: "Primary Image (This is the image you should suggest modifications FOR):"});
            parts.push({ inlineData: { mimeType: primaryImageFile.type, data: primaryBase64 } });

            for (let i = 0; i < Math.min(referenceImagesWithTags.length, 3); i++) {
                const refData = referenceImagesWithTags[i];
                const refFile = refData.file;
                const refBase64 = await fileToBase64(refFile);
                
                const tagListString = refData.tags.join("', '");
                parts.push({text: `Reference ${refData.displayName}. User Tags for this Reference Image: ['${tagListString}'].`});
                parts.push({ inlineData: { mimeType: refFile.type, data: refBase64 } });
            }
            contents.parts = parts;
        } catch (error) {
            console.error(`Error processing images for '${TAB_NAME_ADD_ELEMENT}' tab:`, error);
            setAiSuggestionError("處理圖片以獲取「加入物件」建議失敗。");
            setIsFetchingAiSuggestions(false);
            return;
        }
    } else {
      setAiSuggestions([]);
      setAiSuggestionError(null);
      setIsFetchingAiSuggestions(false);
      return;
    }

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        }
      });

      let jsonStr = (response.text || "").trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      try {
        const parsedData = JSON.parse(jsonStr);
        if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'object' && item !== null && 'chinese' in item && 'english' in item && typeof item.chinese === 'string' && typeof item.english === 'string')) {
            setAiSuggestions(parsedData.slice(0, 8) as AiSuggestion[]);
        } else {
            console.error("Parsed suggestions are not in expected format:", parsedData);
            setAiSuggestionError("AI 提供的建議格式非預期。");
            setAiSuggestions([]);
        }
      } catch (parseError: any) { 
        console.error("Failed to parse AI suggestions JSON:", parseError, "Raw text:", response.text);
        let errorMsg = "AI 未能提供有效的建議。";
        if (parseError && parseError.message) {
            errorMsg += ` 錯誤：${parseError.message}。`;
        }
        if (response.text && response.text.length < 200) { 
            errorMsg += ` 回應：「${(response.text || "").substring(0,100)}${(response.text || "").length > 100 ? "..." : ""}」`;
        } else if (!response.text) {
            errorMsg = "AI 建議服務傳回空回應。"
        }
        setAiSuggestionError(errorMsg);
        setAiSuggestions([]);
      }
    } catch (error: any) {
      console.error("Error fetching AI suggestions from Gemini:", error);
      let detailedErrorMessage = "獲取 AI 建議失敗。";
      if (error.message) {
        detailedErrorMessage += ` ${error.message}`;
      } else if (typeof error === 'string') {
        detailedErrorMessage += ` ${error}`;
      }
      setAiSuggestionError(detailedErrorMessage);
      setAiSuggestions([]);
    } finally {
      setIsFetchingAiSuggestions(false);
    }
  }, [ai, activeAnimatedTab, promptSpecificImageFile, tabSelectedImageData, activePlaceholderTheme]);


  const handleRegenerateGeneralAiSuggestions = () => {
    if (!ai || activeAnimatedTab === TAB_NAME_GENERATE_IMAGE || activeAnimatedTab === TAB_NAME_CAMERA) return; 
    setSelectedAiSuggestionValues([]); 

    const currentTabImagesForRegen = activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA
      ? (tabSelectedImageData[activeAnimatedTab] || [])
      : [];


    if (activeAnimatedTab === TAB_NAME_EDIT) {
        let imageToProcess: File | null = null;
        if (promptSpecificImageFile) imageToProcess = promptSpecificImageFile;
        else if (currentTabImagesForRegen.length > 0) imageToProcess = currentTabImagesForRegen[0].file;
        
        if (imageToProcess) fetchGeneralAiSuggestions();
    } else if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION) {
        if (promptSpecificImageFile) { 
            fetchGeneralAiSuggestions();
        }
    } else if (activeAnimatedTab === TAB_NAME_ADD_ELEMENT) {
        const hasTagsOnReferenceImages = currentTabImagesForRegen.some(img => img.tags.length > 0);
        if (promptSpecificImageFile && hasTagsOnReferenceImages) {
            fetchGeneralAiSuggestions();
        }
    }
  };


  useEffect(() => { 
    if (!ai || activeAnimatedTab === TAB_NAME_GENERATE_IMAGE || activeAnimatedTab === TAB_NAME_CAMERA) {
        setAiSuggestions([]);
        setAiSuggestionError(null);
        setIsFetchingAiSuggestions(false);
        setSelectedAiSuggestionValues([]);
        return;
    }
    
    const currentTabImagesForEffect = activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA
        ? (tabSelectedImageData[activeAnimatedTab] || [])
        : [];
    let shouldFetch = false;

    if (activeAnimatedTab === TAB_NAME_EDIT) {
        if (promptSpecificImageFile || currentTabImagesForEffect.length > 0) {
            shouldFetch = true;
        }
    } else if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION) {
        if (promptSpecificImageFile) { 
            shouldFetch = true;
        }
    } else if (activeAnimatedTab === TAB_NAME_ADD_ELEMENT) {
        const hasTagsOnReferenceImages = currentTabImagesForEffect.some(img => img.tags.length > 0);
        if (promptSpecificImageFile && hasTagsOnReferenceImages) {
            shouldFetch = true;
        }
    }

    if (shouldFetch) {
      fetchGeneralAiSuggestions();
    } else {
      setAiSuggestions([]); 
      setAiSuggestionError(null); 
      setIsFetchingAiSuggestions(false); 
      setSelectedAiSuggestionValues([]);
    }
  }, [activeAnimatedTab, promptSpecificImageFile, tabSelectedImageData, ai, fetchGeneralAiSuggestions]);

  const handleGeneratePromptFromTagsButtonClick = async () => {
    if (!ai || activeAnimatedTab !== TAB_NAME_GENERATE_IMAGE || genModeSelectedTagsForPrompt.length === 0) {
        setPromptGenerationByButtonClickError(null);
        setIsGeneratingPromptByButtonClick(false);
        return;
    }

    setIsGeneratingPromptByButtonClick(true);
    setPromptGenerationByButtonClickError(null);

    const systemInstruction = `You are an expert prompt engineer for advanced text-to-image AI models like Imagen 3. Based on the following list of tags (which may be in Traditional Chinese or English), combine them into a coherent, descriptive, and effective prompt *entirely in English*. The prompt should be suitable for generating high-quality images. Translate any Chinese tags to appropriate English terms. Focus on creating a vivid and detailed scene description. Ensure the prompt flows naturally and reads like a well-crafted image generation instruction. Tags are: [${genModeSelectedTagsForPrompt.join(", ")}]. Output *only* the final English prompt text itself, without any introductory phrases or explanations.`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: `Generate a high-quality, detailed English image prompt suitable for Imagen 3, based on these tags (translate Chinese tags to English as needed): ${genModeSelectedTagsForPrompt.join(", ")}.`,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        setUserBasePrompt((response.text || "").trim());
        setSelectedAiSuggestionValues([]); 
    } catch (error: any) {
        console.error("Error generating prompt from tags:", error);
        setPromptGenerationByButtonClickError(`從標籤生成提示詞失敗: ${error.message || '未知錯誤'}`);
    } finally {
        setIsGeneratingPromptByButtonClick(false);
    }
  };

  const handleGenModeTagsForPromptChange = (newSelectedTags: string[]) => {
    setGenModeSelectedTagsForPrompt(newSelectedTags);
    if (promptGenerationByButtonClickError) setPromptGenerationByButtonClickError(null);
  };

  const correctTagsForTheme = async (originalTags: string[], newTheme: string): Promise<string[]> => {
    if (!ai || originalTags.length === 0) return originalTags;

    const systemInstruction = `You are an AI assistant specializing in re-contextualizing descriptive tags for images.
Given a list of original tags for an image, and a new target 'overall theme' or 'style context', your task is to review each original tag.
1. If an original tag is already perfectly aligned and relevant to the new 'overall theme', keep the tag as is.
2. If an original tag is relevant but could be rephrased or made more specific to better fit the new 'overall theme', provide the improved tag.
3. If an original tag becomes irrelevant or contradictory in the context of the new 'overall theme', you may choose to discard it or suggest a more suitable replacement if a clear conceptual link exists. Prioritize keeping relevant information if possible.
The goal is to produce a refined set of tags that are highly coherent with the new 'overall theme'.
The output must be a JSON array of strings, representing the new list of tags. The order of tags can be changed if it improves coherence, but try to maintain a similar number of tags unless some are truly irrelevant.
Respond ONLY with the JSON array of the new tags.`;

    const contentForAI = `Original Tags: ${JSON.stringify(originalTags)}. New Overall Theme: "${newTheme}". Review and correct these tags.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: contentForAI,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });

        let jsonStr = (response.text || "").trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const parsedData = JSON.parse(jsonStr);
        if (Array.isArray(parsedData) && parsedData.every(tag => typeof tag === 'string')) {
            return parsedData as string[];
        }
        console.warn("Tag correction AI returned non-array or non-string array:", parsedData);
        return originalTags; 
    } catch (error) {
        console.error(`Error correcting tags for theme "${newTheme}":`, error);
        throw error; 
    }
  };

  const handleGlobalTagCorrectionForThemeChange = async (newTheme: string) => {
    if (!ai) return;

    setIsCorrectingAllTagsGlobal(true);
    setTagCorrectionGlobalError(null);

    const updatedTabSelectedImageData = { ...tabSelectedImageData };
    let anyErrorOccurred = false;

    for (const tabKey in updatedTabSelectedImageData) {
        if (tabKey === TAB_NAME_REFERENCE_INSPIRATION || tabKey === TAB_NAME_CAMERA) continue; 

        const images = updatedTabSelectedImageData[tabKey];
        const updatedImagesForTab = [];

        for (const image of images) {
            let currentImageVersion = { ...image };
            try {
                if (currentImageVersion.tags && currentImageVersion.tags.length > 0) {
                    const correctedManualTags = await correctTagsForTheme(currentImageVersion.tags, newTheme);
                    currentImageVersion = { ...currentImageVersion, tags: correctedManualTags };
                }
                if (tabKey === TAB_NAME_GENERATE_IMAGE && currentImageVersion.aiGeneratedTags && currentImageVersion.aiGeneratedTags.length > 0) {
                    const correctedAiTags = await correctTagsForTheme(currentImageVersion.aiGeneratedTags, newTheme);
                    currentImageVersion = { ...currentImageVersion, aiGeneratedTags: correctedAiTags };
                }
            } catch (error: any) {
                console.error(`Error correcting tags for image ${image.id} in tab ${tabKey} for new theme "${newTheme}":`, error);
                anyErrorOccurred = true;
            }
            updatedImagesForTab.push(currentImageVersion);
        }
        updatedTabSelectedImageData[tabKey] = updatedImagesForTab;
    }

    setTabSelectedImageData(updatedTabSelectedImageData);

    if (anyErrorOccurred) {
        setTagCorrectionGlobalError("部分或全部圖片標籤更新失敗，請檢查主控台獲取詳細資訊。");
    }
    setIsCorrectingAllTagsGlobal(false);
  };


  const handleGenerateImageFromInput = async () => {
    if (activeAnimatedTab === TAB_NAME_CAMERA) {
      setGenerationError("相機分頁無法直接生成圖片。請先拍攝照片並選擇用途。");
      return;
    }

    const userStyleDescriptionFromInputForGenMode = userBasePrompt.trim();
    const fullPromptForGeneration = currentInputTextForDisplay.trim(); 
    const isGenMode = activeAnimatedTab === TAB_NAME_GENERATE_IMAGE;
    const isInspirationMode = activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION;
    const isAddMode = activeAnimatedTab === TAB_NAME_ADD_ELEMENT;
    const isEditMode = activeAnimatedTab === TAB_NAME_EDIT;


    if (isGenMode && !userStyleDescriptionFromInputForGenMode && !promptSpecificImageFile && currentTabImages.length === 0 && genModeSelectedTagsForPrompt.length === 0 ) {
        setGenerationError(`在「${TAB_NAME_GENERATE_IMAGE}」模式下，請提供風格描述、上傳「提示特定圖片」或上傳「主要圖片」並使用標籤生成提示詞。`);
        return;
    }
    if (isInspirationMode && !promptSpecificImageFile) {
        setGenerationError(`在「${TAB_NAME_REFERENCE_INSPIRATION}」模式下，必須上傳「提示特定圖片」(作為結構來源)。`);
        return;
    }
    if (isInspirationMode && !fullPromptForGeneration) {
         setGenerationError(`在「${TAB_NAME_REFERENCE_INSPIRATION}」模式下，請選擇AI建議或輸入文字以形成提示詞。`);
        return;
    }
    if (isAddMode && (!promptSpecificImageFile || currentTabImages.length === 0 || !fullPromptForGeneration)) {
        setGenerationError(`在「${TAB_NAME_ADD_ELEMENT}」模式下，必須上傳「提示特定圖片」、至少一張「主要圖片」並提供提示文字。`);
        return;
    }
    if (isEditMode && (!promptSpecificImageFile && currentTabImages.length === 0)) {
        setGenerationError(`在「${TAB_NAME_EDIT}」模式下，必須上傳「提示特定圖片」或「主要圖片」。`);
        return;
    }
    if (isEditMode && !fullPromptForGeneration) {
         setGenerationError(`在「${TAB_NAME_EDIT}」模式下，請選擇AI建議或輸入文字以形成提示詞。`);
        return;
    }
    
    let targetProjectId = currentProjectId;
    if (!targetProjectId) {
      const currentSortedProjects = [...projects].sort((a, b) => b.createdAt - a.createdAt); 
      if (currentSortedProjects.length === 0) {
        const defaultProjectName = "預設專案";
        const defaultProject: Project = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: defaultProjectName,
          images: [],
          createdAt: Date.now(),
        };
        setProjects(prev => [defaultProject, ...prev]); 
        targetProjectId = defaultProject.id;
        setCurrentProjectId(targetProjectId); 
        setActiveModalProjectId(targetProjectId); 
      } else {
        targetProjectId = currentSortedProjects[0].id;
        setCurrentProjectId(targetProjectId);
        setActiveModalProjectId(targetProjectId);
      }
    }
    
    if (!targetProjectId) { 
        setGenerationError("無法確定專案。請選擇或建立一個專案。");
        return;
    }

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setGenerationError(null);
    setIsRecentQuotaError(false);
    setLastPromptForGeneratedImage(null);
    setShowImageCompare(false);
    setBeforeImageUrlForCompare(null);

    let finalPromptForImageModel = "";
    let potentialBeforeImage = null;

    if (ai && (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE || activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION || activeAnimatedTab === TAB_NAME_ADD_ELEMENT || activeAnimatedTab === TAB_NAME_EDIT) ) {
        if (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE) {
            potentialBeforeImage = promptSpecificImagePreviewUrl; 
            if (promptSpecificImageFile && currentTabImages.length > 0 && userStyleDescriptionFromInputForGenMode) {
                console.log(`Engineering prompt for '${TAB_NAME_GENERATE_IMAGE}' - image modification...`);
                try {
                    finalPromptForImageModel = await getEngineeredImageModificationPrompt(promptSpecificImageFile, userStyleDescriptionFromInputForGenMode, currentTabImages, ai);
                } catch (e: any) { setGenerationError(`提示詞工程失敗: ${e.message}. 使用基本提示詞。`); finalPromptForImageModel = userStyleDescriptionFromInputForGenMode; }
            } else if (promptSpecificImageFile && userStyleDescriptionFromInputForGenMode) {
                console.log(`Engineering prompt for '${TAB_NAME_GENERATE_IMAGE}' - structural fidelity...`);
                try {
                    finalPromptForImageModel = await getEngineeredPromptForStructuralFidelity(promptSpecificImageFile, userStyleDescriptionFromInputForGenMode, ai);
                } catch (e: any) { setGenerationError(`提示詞工程失敗: ${e.message}. 使用基本提示詞。`); finalPromptForImageModel = userStyleDescriptionFromInputForGenMode; }
            } else {
                finalPromptForImageModel = fullPromptForGeneration;
            }
        } else if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION && promptSpecificImageFile) {
            potentialBeforeImage = promptSpecificImagePreviewUrl;
            finalPromptForImageModel = fullPromptForGeneration;
        } else if (activeAnimatedTab === TAB_NAME_ADD_ELEMENT && promptSpecificImageFile && currentTabImages.length > 0) {
            potentialBeforeImage = promptSpecificImagePreviewUrl;
             console.log(`Engineering prompt for '${TAB_NAME_ADD_ELEMENT}'...`);
            try {
                 finalPromptForImageModel = await getEngineeredImageModificationPrompt(promptSpecificImageFile, fullPromptForGeneration, currentTabImages, ai);
            } catch (e:any) {setGenerationError(`「加入」模式提示詞工程失敗: ${e.message}. 使用基本提示詞。`); finalPromptForImageModel = fullPromptForGeneration;}

        } else if (activeAnimatedTab === TAB_NAME_EDIT && promptSpecificImageFile) {
            potentialBeforeImage = promptSpecificImagePreviewUrl;
             console.log(`Engineering prompt for '${TAB_NAME_EDIT}'...`);
             try {
                finalPromptForImageModel = await getEngineeredPromptForStructuralFidelity(promptSpecificImageFile, fullPromptForGeneration, ai);
             } catch (e:any) {setGenerationError(`「編輯」模式提示詞工程失敗: ${e.message}. 使用基本提示詞。`); finalPromptForImageModel = fullPromptForGeneration;}
        }
         else {
            finalPromptForImageModel = fullPromptForGeneration;
            if (promptSpecificImageFile) potentialBeforeImage = promptSpecificImagePreviewUrl;
        }
    } else { 
        finalPromptForImageModel = fullPromptForGeneration;
        if (promptSpecificImageFile) potentialBeforeImage = promptSpecificImagePreviewUrl;
    }
    
    if (!finalPromptForImageModel.trim() && !(activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && currentTabImages.length > 0 && genModeSelectedTagsForPrompt.length > 0)) {
        if (!(activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && currentTabImages.length > 0 && genModeSelectedTagsForPrompt.length > 0 && !userStyleDescriptionFromInputForGenMode)) {
           setGenerationError("最終提示詞為空，無法生成圖片。");
           setIsGeneratingImage(false);
           return;
        }
    }
    console.log(`Final prompt for image model (${activeAnimatedTab} with ${selectedEngine}):`, finalPromptForImageModel);
    setLastPromptForGeneratedImage(finalPromptForImageModel);

    const updateStateWithNewImage = (imageUrl: string, projId: string, usedPrompt: string) => {
        setGeneratedImageUrl(imageUrl);
        const newHistoryEntry: GeneratedImageHistoryEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          imageUrl: imageUrl,
          prompt: usedPrompt, 
          projectId: projId,
        };
        
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === projId
            ? { ...p, images: [newHistoryEntry, ...p.images] }
            : p
          ).sort((a,b) => b.createdAt - a.createdAt) 
        );
        setUserBasePrompt(""); 
        setSelectedAiSuggestionValues([]);
        if (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE) setGenModeSelectedTagsForPrompt([]);
        
        if (potentialBeforeImage) { 
            setBeforeImageUrlForCompare(potentialBeforeImage);
            setShowImageCompare(true);
        }
    };

    if (selectedEngine === 'flux') {
        console.log("Using Flux API (via proxy) for image generation with tolerance:", fluxSafetyTolerance);
        try {
            const fluxProxyUrl = '/api/flux-proxy';
            const fluxPayload: any = {
                prompt: finalPromptForImageModel,
                output_format: fluxOutputFormat,
                prompt_upsampling: fluxPromptUpsampling,
                safety_tolerance: fluxSafetyTolerance, 
            };
            if (promptSpecificImageFile && currentPromptImageAspectRatio) {
                fluxPayload.aspect_ratio = currentPromptImageAspectRatio;
            }

            const apiResponse = await fetch(fluxProxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fluxPayload),
            });

            if (!apiResponse.ok) {
                const errorJson = await apiResponse.json().catch(() => ({ message: apiResponse.statusText }));
                throw new Error(`Flux API Error (via proxy): ${apiResponse.status} - ${errorJson.message || JSON.stringify(errorJson)}`);
            }
            const fluxResult = await apiResponse.json();
            let base64ImageBytes = fluxResult.image_bytes || (fluxResult.images && fluxResult.images[0]?.image_bytes) || fluxResult.base64_image || fluxResult.generated_image_base64;
            if (base64ImageBytes) {
                updateStateWithNewImage(`data:${fluxOutputFormat === 'png' ? 'image/png' : 'image/jpeg'};base64,${base64ImageBytes}`, targetProjectId, finalPromptForImageModel);
            } else {
                const errorMessage = fluxResult.message || fluxResult.error || JSON.stringify(fluxResult);
                throw new Error(`回應中未找到圖片資料。 API 回應: ${errorMessage}`);
            }
        } catch (fluxError: any) {
            console.error("Error generating image with Flux API (via proxy):", fluxError);
            setGenerationError(`Flux API 圖片生成失敗： ${fluxError.message || '未知錯誤'}`);
        } finally {
            setIsGeneratingImage(false);
        }

    } else if (selectedEngine === 'imagen') {
        if (!ai) {
             setGenerationError("Imagen 3 無法使用：Gemini API 金鑰未設定。請在伺服器環境中設定 API_KEY。");
            setIsGeneratingImage(false);
            return;
        }
        console.log("Using Imagen 3 (Gemini) for image generation.");
        try {
            const generationConfig: any = { 
                numberOfImages: 1, 
                outputMimeType: imagenOutputFormat
            };
            if (promptSpecificImageFile && currentPromptImageAspectRatio) {
                generationConfig.aspectRatio = currentPromptImageAspectRatio;
            }
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: finalPromptForImageModel,
                config: generationConfig,
            });
            if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
                updateStateWithNewImage(`data:${imagenOutputFormat};base64,${response.generatedImages[0].image.imageBytes}`, targetProjectId, finalPromptForImageModel);
            } else {
                throw new Error("Imagen 3 API 回應中未找到圖片資料。");
            }
        } catch (geminiError: any) {
            console.error("Error generating image with Imagen 3 (Gemini):", geminiError);
            let msg = `Imagen 3 圖片生成失敗: ${geminiError.message || '未知錯誤'}`;
            if (geminiError.message?.toLowerCase().includes("quota") || geminiError.message?.toLowerCase().includes("rate limit")) {
                setIsRecentQuotaError(true);
            }
            setGenerationError(msg);
        } finally {
            setIsGeneratingImage(false);
        }
    } else {
        setGenerationError("未選擇有效的圖片生成引擎。");
        setIsGeneratingImage(false);
    }
  };

  const handleAddGeneratedImageToSpecificTab = async (imageUrl: string, targetTabName: string) => {
    if (targetTabName === TAB_NAME_REFERENCE_INSPIRATION || targetTabName === TAB_NAME_CAMERA) {
      alert(`無法將圖片加入「${targetTabName}」分頁。`);
      return;
    }
    try {
      const currentImagesForTargetTab = tabSelectedImageData[targetTabName] || [];
      if (currentImagesForTargetTab.length >= 3) {
        alert(`「${targetTabName}」分頁最多只能有3張主要圖片。`);
        return;
      }

      const timestamp = Date.now();
      const nextImageNumber = currentImagesForTargetTab.length + 1;
      const filename = `GeneratedTo_${targetTabName}_Img${nextImageNumber}_${timestamp}.jpeg`;
      const file = dataURLtoFile(imageUrl, filename);

      const newImageData: SelectedImageDataPerTab = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7) + `_to_${targetTabName}_` + nextImageNumber,
        file: file,
        previewUrl: URL.createObjectURL(file),
        tags: [],
        displayName: `生成圖片 ${nextImageNumber} (來自 ${activeAnimatedTab})`,
        currentDropdownTagSelection: "",
        manualTagInput: "",
        aiGeneratedTags: [],
        isFetchingOcr: false,
        ocrError: null,
      };

      if (targetTabName === TAB_NAME_GENERATE_IMAGE && ai) {
        fetchOcrTagsForImage(newImageData, targetTabName);
      }

      setTabSelectedImageData(prev => ({
        ...prev,
        [targetTabName]: [...currentImagesForTargetTab, newImageData]
      }));
      
      alert(`圖片已新增至「${targetTabName}」分頁的主要圖片。`);

    } catch (error) {
      console.error(`Error adding generated image to tab ${targetTabName}:`, error);
      alert(`新增圖片至「${targetTabName}」時發生錯誤： ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearGeneratedImage = () => {
    setGeneratedImageUrl(null);
    setGenerationError(null);
    setLastPromptForGeneratedImage(null);
    if (isRecentQuotaError) setIsRecentQuotaError(false);
    setShowImageCompare(false);
    setBeforeImageUrlForCompare(null);
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openAppSettingsModal = () => setIsAppSettingsModalOpen(true);
  const closeAppSettingsModal = () => setIsAppSettingsModalOpen(false);
  
  const handleSelectTheme = async (themeName: string) => {
    setActivePlaceholderTheme(themeName);
    closeAppSettingsModal();
    await handleGlobalTagCorrectionForThemeChange(themeName);
  };

  const handleAddCustomTheme = async (themeName: string) => {
    const trimmedThemeName = themeName.trim();
    if (!trimmedThemeName) {
      alert("主題名稱不能為空。");
      return;
    }
    if (placeholderThemes[trimmedThemeName] || customPlaceholderThemes[trimmedThemeName]) {
      alert("此主題名稱已存在。");
      return;
    }
    setCustomPlaceholderThemes(prev => ({
      ...prev,
      [trimmedThemeName]: [ 
        `關於 ${trimmedThemeName} 的圖片...`,
        `探索 ${trimmedThemeName} 的不同面向。`,
        `以 ${trimmedThemeName} 風格生成。`
      ]
    }));
    setActivePlaceholderTheme(trimmedThemeName); 
    await handleGlobalTagCorrectionForThemeChange(trimmedThemeName);
  };

  const handleDeleteCustomTheme = (themeName: string) => {
    setCustomPlaceholderThemes(prev => {
      const newCustomThemes = { ...prev };
      delete newCustomThemes[themeName];
      return newCustomThemes;
    });
    if (activePlaceholderTheme === themeName) {
      const newActiveTheme = "室內設計"; 
      setActivePlaceholderTheme(newActiveTheme); 
    }
  };

  const triggerImageFileDialog = () => {
    if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION || activeAnimatedTab === TAB_NAME_CAMERA) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION || activeAnimatedTab === TAB_NAME_CAMERA) return;

    const files = e.target.files;
    if (files && files.length > 0) {
      const originalFilesArray = Array.from(files);
      
      (tabSelectedImageData[activeAnimatedTab] || []).forEach(data => {
        if (data.previewUrl.startsWith('blob:')) URL.revokeObjectURL(data.previewUrl);
      });
      
      const newImageDataPromises = originalFilesArray.slice(0, 3).map(async (originalFile, idx) => { 
        const fileExtension = originalFile.name.split('.').pop();
        const newFileName = `圖片 ${idx + 1}${fileExtension ? '.' + fileExtension : ''}`;
        const renamedFile = new File([originalFile], newFileName, {
          type: originalFile.type,
          lastModified: originalFile.lastModified,
        });
        const newImgData: SelectedImageDataPerTab = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7) + idx,
          file: renamedFile,
          previewUrl: URL.createObjectURL(renamedFile),
          tags: [] as string[],
          displayName: `圖片 ${idx + 1}`,
          currentDropdownTagSelection: "",
          manualTagInput: "", 
          aiGeneratedTags: [],
          isFetchingOcr: false,
          ocrError: null,
        };
        if (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && ai) {
            fetchOcrTagsForImage(newImgData, activeAnimatedTab); 
        }
        return newImgData;
      });

      Promise.all(newImageDataPromises).then(newImageData => {
        setTabSelectedImageData(prev => ({
          ...prev,
          [activeAnimatedTab]: newImageData
        }));
      });
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeImageFromApp = (tabKey: string, imageIdToRemove: string) => {
    if (tabKey === TAB_NAME_REFERENCE_INSPIRATION || tabKey === TAB_NAME_CAMERA) return; 
    setTabSelectedImageData(prev => {
      const updatedTabImages = (prev[tabKey] || []).filter(img => {
        if (img.id === imageIdToRemove) {
          if (img.previewUrl.startsWith('blob:')) URL.revokeObjectURL(img.previewUrl);
          return false;
        }
        return true;
      });
      return { ...prev, [tabKey]: updatedTabImages };
    });
  };

  const handlePromptImageSelect = async (selectedFile: File) => {
    if (promptSpecificImagePreviewUrl) {
      URL.revokeObjectURL(promptSpecificImagePreviewUrl);
    }
    setPromptSpecificImageFile(null);
    setPromptSpecificImagePreviewUrl(null);
    setCurrentPromptImageAspectRatio(null);
  
    const processingResult = await processAndCropPromptImage(selectedFile);
  
    if (processingResult) {
      setPromptSpecificImageFile(processingResult.croppedFile);
      setPromptSpecificImagePreviewUrl(processingResult.croppedPreviewUrl);
      setCurrentPromptImageAspectRatio(processingResult.aspectRatioString);
      console.log("Cropped image and set aspect ratio:", processingResult.aspectRatioString);
    } else {
      setPromptSpecificImageFile(selectedFile);
      setPromptSpecificImagePreviewUrl(URL.createObjectURL(selectedFile));
      setCurrentPromptImageAspectRatio(null); 
      console.error("Failed to crop image. Using original.");
    }
  
    setSelectedAiSuggestionValues([]);
    if (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE) setGenModeSelectedTagsForPrompt([]);
  };

  const clearPromptSpecificImage = () => {
    if (promptSpecificImagePreviewUrl) {
      URL.revokeObjectURL(promptSpecificImagePreviewUrl);
    }
    setPromptSpecificImageFile(null);
    setPromptSpecificImagePreviewUrl(null);
    setCurrentPromptImageAspectRatio(null);
    setAiSuggestions([]); 
    setSelectedAiSuggestionValues([]);
    if (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE) setGenModeSelectedTagsForPrompt([]);
  };

  const handlePerImageStateChange = (
    tabKey: string,
    imageId: string,
    field: keyof SelectedImageDataPerTab,
    value: any
  ) => {
    if (tabKey === TAB_NAME_REFERENCE_INSPIRATION || tabKey === TAB_NAME_CAMERA) return; 
    setTabSelectedImageData(prev => {
      const tabImages = (prev[tabKey] || []).map(img =>
        img.id === imageId ? { ...img, [field]: value } : img
      );
      return { ...prev, [tabKey]: tabImages };
    });
  };

  const addTag = (tabKey: string, imageId: string, tag: string) => {
    if (tabKey === TAB_NAME_REFERENCE_INSPIRATION || tabKey === TAB_NAME_CAMERA) return; 
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    setTabSelectedImageData(prev => {
        const tabImages = (prev[tabKey] || []).map(img => {
            if (img.id === imageId && !img.tags.includes(trimmedTag)) {
                const updatedImg = { ...img, tags: [...img.tags, trimmedTag] };
                if (tabKey === TAB_NAME_GENERATE_IMAGE) {
                    updatedImg.manualTagInput = ""; 
                } else {
                    updatedImg.currentDropdownTagSelection = ""; 
                }
                return updatedImg;
            }
            return img;
        });
        return { ...prev, [tabKey]: tabImages };
    });
  };
  
  const removeTag = (tabKey: string, imageId: string, tagIndexToRemove: number) => {
    if (tabKey === TAB_NAME_REFERENCE_INSPIRATION || tabKey === TAB_NAME_CAMERA) return; 
    setTabSelectedImageData(prev => {
        const tabImages = (prev[tabKey] || []).map(img => {
            if (img.id === imageId) {
                const updatedTags = img.tags.filter((_, i) => i !== tagIndexToRemove);
                return { ...img, tags: updatedTags };
            }
            return img;
        });
        return { ...prev, [tabKey]: tabImages };
    });
  };

  const handleUseGeneratedAsPromptImage = async (imageUrl: string, originalPrompt: string) => {
    try {
        const timestamp = Date.now();
        const filename = `generated_prompt_img_${timestamp}.jpeg`; 
        const file = dataURLtoFile(imageUrl, filename);
        await handlePromptImageSelect(file); 
        setUserBasePrompt(originalPrompt);
        
        if (generatedImageUrl === imageUrl) { 
             setGeneratedImageUrl(null); 
             setLastPromptForGeneratedImage(null);
             setShowImageCompare(false);
             setBeforeImageUrlForCompare(null);
        }
        if (isGeneratedHistoryModalOpen) setIsGeneratedHistoryModalOpen(false);
    } catch (error) {
        console.error("Error using generated image as prompt image:", error);
        alert(`設定圖片為提示時發生錯誤： ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAddGeneratedToMainImages = (imageUrl: string) => {
    if (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION || activeAnimatedTab === TAB_NAME_CAMERA) {
        alert(`「${activeAnimatedTab}」分頁不支援新增主要圖片。`);
        return;
    }
    try {
        const currentImagesForTab = tabSelectedImageData[activeAnimatedTab] || [];
        if (currentImagesForTab.length >= 3) {
            alert(`「${activeAnimatedTab}」分頁最多只能有3張主要圖片。`);
            return;
        }

        const timestamp = Date.now();
        const nextImageNumber = currentImagesForTab.length + 1;
        const filename = `Generated_${activeAnimatedTab}_Img${nextImageNumber}_${timestamp}.jpeg`;
        const file = dataURLtoFile(imageUrl, filename);

        const newImageData: SelectedImageDataPerTab = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7) + nextImageNumber,
            file: file,
            previewUrl: URL.createObjectURL(file), 
            tags: [],
            displayName: `生成圖片 ${nextImageNumber}`, 
            currentDropdownTagSelection: "",
            manualTagInput: "", 
            aiGeneratedTags: [], 
            isFetchingOcr: false,
            ocrError: null,
        };

        if (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && ai) {
            fetchOcrTagsForImage(newImageData, activeAnimatedTab);
        }

        setTabSelectedImageData(prev => ({
            ...prev,
            [activeAnimatedTab]: [...currentImagesForTab, newImageData]
        }));
        
        if (isGeneratedHistoryModalOpen) setIsGeneratedHistoryModalOpen(false);
        alert(`圖片已新增至「${activeAnimatedTab}」分頁的主要圖片。`);

    } catch (error) {
        console.error("Error adding generated image to main images:", error);
        alert(`新增圖片時發生錯誤： ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGenerateReport = useCallback(async (imageEntry: GeneratedImageHistoryEntry) => {
    if (!ai) {
        setReportError("無法生成報告：Gemini API 未初始化。");
        return;
    }
    setIsGeneratingReport(true);
    setActiveGeneratingReportId(imageEntry.id);
    setReportError(null);
    setGeneratedReportContent(null);
    setActiveImageForReport(imageEntry);

    const systemInstruction = `You are a world-class AI design consultant specializing in architecture and interior design.
Analyze the provided image (which was generated from the given prompt) and its original generation prompt.
Provide a structured professional feedback report in Traditional Chinese.
The report must include two sections:
1.  **設計理念 (Design Concept):** Interpret the main style, color scheme, material usage, and lighting atmosphere presented in the image. Give the style a deep and compelling narrative.
2.  **修改建議 (Modification Suggestions):** Based on the final image, provide specific, actionable optimization suggestions. Cover aspects of:
    *   硬裝 (Hard Furnishings): e.g., wall finishes, flooring materials.
    *   軟裝 (Soft Furnishings): e.g., furniture choices, curtain styles, decorative accessory pairings.
    *   燈光 (Lighting): e.g., adding focal lighting, enhancing ambient lighting, specific fixture suggestions.

The original prompt for the image was: "${imageEntry.prompt}"

Format the output as a JSON object with two keys: "concept" (a string for the design concept in Traditional Chinese) and "suggestions" (an array of strings, where each string is a modification suggestion in Traditional Chinese).
For example:
{
  "concept": "此空間展現了極簡侘寂風格，透過斑駁的清水模牆面與溫潤的橡木地板，營造出寧靜致遠的氛圍。自然光線透過亞麻紗簾灑落，為空間增添一抹柔和詩意。",
  "suggestions": [
    "硬裝：考慮將一面牆改為珪藻土材質，增加質樸手感。",
    "軟裝：可添置一張單人羊毛Lounge Chair，提升閱讀角落的舒適度。",
    "燈光：在畫作上方增設一盞可調角度的射灯，作為視覺焦點。",
    "軟裝：建議搭配素色棉麻地毯，呼應整體自然調性。"
  ]
}
Respond ONLY with the JSON object. Do not include any markdown formatting like \`\`\`json or explanation.
`;
    try {
        const imageFile = dataURLtoFile(imageEntry.imageUrl, `report_image_for_${imageEntry.id}.jpeg`);
        const base64Image = await fileToBase64(imageFile);
        const imagePart = {
            inlineData: { mimeType: imageFile.type, data: base64Image },
        };
        const textPart = { text: `Analyze this image (original prompt: "${imageEntry.prompt}") and generate a design report.` };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: { parts: [textPart, imagePart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            }
        });

        let jsonStr = (response.text || "").trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr);
        if (parsedData && typeof parsedData.concept === 'string' && Array.isArray(parsedData.suggestions)) {
            setGeneratedReportContent({
                concept: parsedData.concept,
                suggestions: parsedData.suggestions.filter((s: any) => typeof s === 'string') as string[],
            });
            setIsReportModalOpen(true);
        } else {
            throw new Error("AI 回應的報告格式不正確。");
        }
    } catch (error: any) {
        console.error("Error generating design report:", error);
        setReportError(`生成報告失敗: ${error.message || '未知錯誤'}`);
    } finally {
        setIsGeneratingReport(false);
        setActiveGeneratingReportId(null);
    }
  }, [ai]);

  const downloadReport = useCallback((reportData: GeneratedReport, originalPrompt: string) => {
    const markdownContent = `
# 設計建議報告

## 原始提示詞
${originalPrompt}

## 設計理念
${reportData.concept}

## 修改建議
${reportData.suggestions.map(s => `- ${s}`).join('\n')}
    `.trim();

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `design_report_${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);



  useEffect(() => {
    const currentTabImageData = tabSelectedImageData;
    const currentPromptSpecificImagePreviewUrl = promptSpecificImagePreviewUrl;
    
    return () => {
      Object.values(currentTabImageData).flat().forEach(data => {
        if (data.previewUrl && data.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(data.previewUrl);
        }
      });
      if (currentPromptSpecificImagePreviewUrl && currentPromptSpecificImagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPromptSpecificImagePreviewUrl);
      }
    };
  }, [tabSelectedImageData, promptSpecificImagePreviewUrl]); 
  
  const activeProjectForDisplay = projects.find(p => p.id === currentProjectId) || (sortedProjects.length > 0 ? sortedProjects[0] : null);
  
  const currentPlaceholders = customPlaceholderThemes[activePlaceholderTheme] || placeholderThemes[activePlaceholderTheme] || placeholderThemes["室內設計"]; 
  
  const canRegenerateGeneralAiSuggestions = ai && !isFetchingAiSuggestions && activeAnimatedTab !== TAB_NAME_GENERATE_IMAGE && activeAnimatedTab !== TAB_NAME_CAMERA && (
    (activeAnimatedTab === TAB_NAME_EDIT && (promptSpecificImageFile || currentTabImages.length > 0)) ||
    (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION && promptSpecificImageFile) || 
    (activeAnimatedTab === TAB_NAME_ADD_ELEMENT && promptSpecificImageFile && currentTabImages.some(img => img.tags.length > 0))
  );

  const generalAiSuggestionDropdownOptions = aiSuggestions.map(s => ({
    value: s.english, 
    label: s.chinese, 
  }));

  const genModeAllAvailableTags = activeAnimatedTab === TAB_NAME_GENERATE_IMAGE 
    ? Array.from(new Set(currentTabImages.flatMap(img => [...img.tags, ...(img.aiGeneratedTags || [])])))
        .map(tag => ({ value: tag, label: tag }))
    : [];

  const showGenModeTagPromptGenerator = activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && currentTabImages.length > 0 && genModeAllAvailableTags.length > 0 && ai;
  
  const showGeneralAiSuggestions = activeAnimatedTab !== TAB_NAME_GENERATE_IMAGE && activeAnimatedTab !== TAB_NAME_CAMERA && aiSuggestions.length > 0 && !isFetchingAiSuggestions && !aiSuggestionError && ai;


  if (isLoading) {
    return <SplashScreen />;
  }

  const uploadButtonLabel = 
    activeAnimatedTab === TAB_NAME_GENERATE_IMAGE || activeAnimatedTab === TAB_NAME_ADD_ELEMENT || activeAnimatedTab === TAB_NAME_EDIT
    ? `上傳主要圖片 (${currentTabImages.length}/3) 用於「${activeAnimatedTab}」`
    : `上傳輔助圖片 (用於「${activeAnimatedTab}」)`; 

  const mainContentArea = () => {
    if (isCameraActive) {
      return (
        <div className="w-full max-w-xl flex flex-col items-center p-4">
          {cameraError && <p className="text-red-500 dark:text-red-400 mb-2">{cameraError}</p>}
          {capturedImagePreview ? (
            <div className="flex flex-col items-center">
              <img src={capturedImagePreview} alt="已拍攝照片" className="max-w-full max-h-64 rounded-lg shadow-md mb-4" />
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={handleRetakePhoto} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-xs sm:text-sm">重新拍攝</button>
                <button onClick={handleUseCapturedPhotoAsPromptImage} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 text-xs sm:text-sm">設為主圖</button>
                {lastNonCameraActiveTab && lastNonCameraActiveTab !== TAB_NAME_REFERENCE_INSPIRATION && lastNonCameraActiveTab !== TAB_NAME_CAMERA && (
                  <button onClick={handleAddCapturedPhotoToMainImages} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs sm:text-sm">
                    加入「{lastNonCameraActiveTab}」主要圖片
                  </button>
                )}
                <button onClick={() => { setCapturedImagePreview(null); setIsCameraActive(false); setActiveAnimatedTab(lastNonCameraActiveTab || TAB_NAME_GENERATE_IMAGE); }} className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 text-xs sm:text-sm">捨棄</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <video ref={videoRef} autoPlay playsInline className="w-full max-w-md h-auto rounded-lg shadow-md mb-4 bg-black" />
              <button
                onClick={handleCapturePhoto}
                disabled={!cameraStream}
                className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-neutral-400 text-sm sm:text-base flex items-center gap-2"
              >
                <CameraIcon className="w-5 h-5" /> 拍攝照片
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center pb-20 sm:pb-24"> 
        <div className="w-full max-w-xl p-3 sm:p-4 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm bg-gray-50/50 dark:bg-neutral-800/30 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-md font-semibold text-gray-700 dark:text-neutral-300 flex items-center">
              管理專案
              {isProjectsCollapsed && (
                <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-neutral-400 ml-2 truncate max-w-[150px] sm:max-w-[300px]">
                   ：{activeProjectForDisplay ? activeProjectForDisplay.name : "尚無專案"}
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={toggleProjectsCollapse}
              className="p-1 sm:p-1.5 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-expanded={!isProjectsCollapsed}
              aria-controls="project-details-content"
              disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
            >
              {isProjectsCollapsed ? <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span className="sr-only">{isProjectsCollapsed ? '展開專案管理' : '收合專案管理'}</span>
            </button>
          </div>

          <div id="project-details-content" className={`${isProjectsCollapsed ? 'hidden' : 'block'}`}>
            {sortedProjects.length > 0 && (
              <div className="mb-2 sm:mb-3">
                <label htmlFor="project-select" className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">
                  啟動專案 (用於新的生成)：
                </label>
                <select
                  id="project-select"
                  value={currentProjectId || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value || null;
                    setCurrentProjectId(selectedId);
                    if(selectedId) setActiveModalProjectId(selectedId);
                  }}
                  className="w-full text-xs sm:text-sm p-1.5 sm:p-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm"
                  aria-label="選擇用於新圖片生成的啟動專案"
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                >
                  {sortedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.images.length} 張圖片)</option>
                  ))}
                </select>
              </div>
            )}

            {showNewProjectInput ? (
              <div className="mt-2 space-y-1.5 sm:space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    if (projectCreationError) setProjectCreationError(null);
                  }}
                  placeholder="輸入新專案名稱"
                  className="w-full text-xs sm:text-sm p-1.5 sm:p-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-neutral-700 text-black dark:text-white"
                  aria-label="新專案名稱"
                  aria-describedby={projectCreationError ? "project-creation-error" : undefined}
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                />
                {projectCreationError && (
                  <p id="project-creation-error" className="text-[0.65rem] sm:text-xs text-red-500 dark:text-red-400 mt-1">{projectCreationError}</p>
                )}
                <div className="flex items-center gap-2 pt-0.5 sm:pt-1">
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-sky-500 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                  >
                    建立專案
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProjectInput(false);
                      setNewProjectName("");
                      setProjectCreationError(null);
                    }}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-200 dark:bg-neutral-600 text-gray-700 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-neutral-500"
                    disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowNewProjectInput(true);
                  setProjectCreationError(null);
                }}
                className="mt-1 flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-green-500 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="建立新專案"
                disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
              >
                <FolderPlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                新增專案
              </button>
            )}
              {sortedProjects.length === 0 && !showNewProjectInput && (
              <p className="text-[0.65rem] sm:text-xs text-gray-500 dark:text-neutral-400 mt-1.5 sm:mt-2 italic">尚無專案。請建立一個，或在首次生成圖片時將自動建立「預設專案」。</p>
              )}
          </div>
        </div>
        
        <div className="w-full max-w-xl mt-auto"> 
          {(isGeneratingImage || generatedImageUrl || generationError || isGeneratingReport || showImageCompare) && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm bg-gray-50 dark:bg-neutral-800/30 flex flex-col items-center justify-center min-h-[150px] sm:min-h-[200px]">
                  {isGeneratingImage && ( 
                      <div className="flex flex-col items-center text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                          <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-sky-500 mb-1.5 sm:mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          正在生成您的圖片...
                      </div>
                  )}
                  {isGeneratingReport && !isGeneratingImage && !generatedImageUrl && !showImageCompare && ( 
                      <div className="flex flex-col items-center text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                           <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-indigo-500 mb-1.5 sm:mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          正在生成設計報告...
                      </div>
                  )}
                  {generationError && !isGeneratingImage && !isGeneratingReport && ( 
                      <div className="text-center text-red-600 dark:text-red-400">
                          <p className="text-sm sm:text-base"><strong>生成失敗：</strong></p>
                          <p className="text-xs sm:text-sm">{generationError}</p>
                          <button
                              onClick={dismissGenerationError}
                              className="mt-2 text-[0.65rem] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/60"
                          >
                              關閉
                          </button>
                      </div>
                  )}
                  {showImageCompare && beforeImageUrlForCompare && generatedImageUrl && !isGeneratingImage && !generationError &&(
                     <ImageCompareSlider 
                        beforeSrc={beforeImageUrlForCompare} 
                        afterSrc={generatedImageUrl} 
                        onClose={() => {
                            setShowImageCompare(false);
                        }} 
                    />
                  )}
                  {generatedImageUrl && !showImageCompare && !isGeneratingImage && !generationError && ( 
                      <div className="relative group text-center">
                          <img
                              src={generatedImageUrl}
                              alt="生成的圖片"
                              className="max-w-full max-h-48 sm:max-h-64 rounded-md shadow-lg inline-block"
                          />
                          <button
                              onClick={clearGeneratedImage}
                              aria-label="清除已生成的圖片"
                              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-white/70 dark:bg-neutral-900/70 rounded-full text-black dark:text-white hover:bg-white dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isGeneratingReport}
                          >
                              <CloseIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                      </div>
                  )}
                  {generatedImageUrl && !isGeneratingImage && !generationError && (
                    <div className={`mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 justify-center ${showImageCompare ? 'pt-2 border-t border-neutral-200 dark:border-neutral-700 w-full max-w-lg' : ''}`}>
                        <button
                            onClick={() => handleUseGeneratedAsPromptImage(generatedImageUrl, lastPromptForGeneratedImage || "")}
                            className="px-2 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs bg-sky-100 dark:bg-sky-700/50 text-sky-700 dark:text-sky-300 rounded-md hover:bg-sky-200 dark:hover:bg-sky-600/60 transition-colors disabled:opacity-60"
                            aria-label="使用此已生成圖片作為提示圖片"
                            disabled={isGeneratingReport}
                        >
                            設為主圖
                        </button>
                        {activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION && (
                            <>
                                <button onClick={() => handleAddGeneratedImageToSpecificTab(generatedImageUrl, TAB_NAME_GENERATE_IMAGE)} className="px-2 py-1 text-[0.65rem] sm:text-xs bg-teal-100 dark:bg-teal-700/50 text-teal-700 dark:text-teal-300 rounded-md hover:bg-teal-200 dark:hover:bg-teal-600/60">加入「參考」主圖</button>
                                <button onClick={() => handleAddGeneratedImageToSpecificTab(generatedImageUrl, TAB_NAME_EDIT)} className="px-2 py-1 text-[0.65rem] sm:text-xs bg-purple-100 dark:bg-purple-700/50 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-600/60">加入「編輯」主圖</button>
                                <button onClick={() => handleAddGeneratedImageToSpecificTab(generatedImageUrl, TAB_NAME_ADD_ELEMENT)} className="px-2 py-1 text-[0.65rem] sm:text-xs bg-pink-100 dark:bg-pink-700/50 text-pink-700 dark:text-pink-300 rounded-md hover:bg-pink-200 dark:hover:bg-pink-600/60">加入「加入」主圖</button>
                            </>
                        )}
                        {activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && (
                             <>
                                <button onClick={() => handleAddGeneratedImageToSpecificTab(generatedImageUrl, TAB_NAME_EDIT)} className="px-2 py-1 text-[0.65rem] sm:text-xs bg-purple-100 dark:bg-purple-700/50 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-600/60">加入「編輯」主圖</button>
                                <button onClick={() => handleAddGeneratedImageToSpecificTab(generatedImageUrl, TAB_NAME_ADD_ELEMENT)} className="px-2 py-1 text-[0.65rem] sm:text-xs bg-pink-100 dark:bg-pink-700/50 text-pink-700 dark:text-pink-300 rounded-md hover:bg-pink-200 dark:hover:bg-pink-600/60">加入「加入」主圖</button>
                            </>
                        )}
                        {activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA && (
                          <button
                            onClick={() => handleAddGeneratedToMainImages(generatedImageUrl)}
                            className="px-2 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs bg-green-100 dark:bg-green-700/50 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-600/60 transition-colors disabled:opacity-60"
                            aria-label="將此已生成圖片加入目前分頁的主要圖片"
                            disabled={isGeneratingReport}
                          >
                            加入本頁主圖
                          </button>
                        )}
                        {ai && lastPromptForGeneratedImage && (
                        <button
                            onClick={() => handleGenerateReport({ id: 'current_generated_img', imageUrl: generatedImageUrl, prompt: lastPromptForGeneratedImage || "未提供提示詞", projectId: currentProjectId || 'current_project' })}
                            className="px-2 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs bg-indigo-100 dark:bg-indigo-700/50 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-600/60 transition-colors flex items-center gap-1 disabled:opacity-60 disabled:cursor-wait"
                            aria-label="生成此圖片的設計建議報告"
                            disabled={isGeneratingReport && activeGeneratingReportId === 'current_generated_img'}
                        >
                            {(isGeneratingReport && activeGeneratingReportId === 'current_generated_img') ? 
                                <svg className="animate-spin h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-700 dark:text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                : <FileTextIcon className="w-3 h-3 sm:w-3.5 sm:w-3.5" aria-hidden="true"/>
                            }
                            {(isGeneratingReport && activeGeneratingReportId === 'current_generated_img') ? "生成中..." : "生成報告"}
                        </button>
                        )}
                    </div>
                  )}
              </div>
          )}

          <PlaceholdersAndVanishInput
            placeholders={currentPlaceholders}
            value={currentInputTextForDisplay}
            onInputChange={handlePromptInputChange}
            onSubmit={handleGenerateImageFromInput}
            isSubmitDisabled={
              isGeneratingImage || 
              isRecentQuotaError || 
              (activeAnimatedTab === TAB_NAME_GENERATE_IMAGE ? (!userBasePrompt.trim() && !promptSpecificImageFile && currentTabImages.length === 0 && genModeSelectedTagsForPrompt.length === 0) : false) ||
              (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION ? (!promptSpecificImageFile || !currentInputTextForDisplay.trim()) : false) ||
              (activeAnimatedTab === TAB_NAME_ADD_ELEMENT ? ((!promptSpecificImageFile || currentTabImages.length === 0) || !currentInputTextForDisplay.trim()): false) || 
              (activeAnimatedTab === TAB_NAME_EDIT ? ((!promptSpecificImageFile && currentTabImages.length === 0) || !currentInputTextForDisplay.trim()): false) ||
              isCorrectingAllTagsGlobal || 
              isGeneratingReport
            }
            onPromptImageSelect={handlePromptImageSelect}
            promptImagePreviewUrl={promptSpecificImagePreviewUrl}
            onClearPromptImage={clearPromptSpecificImage}
          />
          
          <div className="w-full max-w-xl mt-2 sm:mt-3 mb-1.5 sm:mb-2 px-1 min-h-[3rem] sm:min-h-[4rem]">
            {showGenModeTagPromptGenerator && (
              <div className="p-2 sm:p-3 border border-dashed border-sky-400/70 dark:border-sky-500/50 rounded-lg bg-sky-50/30 dark:bg-sky-900/20 mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-sky-700 dark:text-sky-300 mb-1.5 sm:mb-2 flex items-center">
                  <TagsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                  從圖片標籤組合提示詞：
                </label>
                <MultiSelectDropdown
                  options={genModeAllAvailableTags}
                  selectedValues={genModeSelectedTagsForPrompt}
                  onChange={handleGenModeTagsForPromptChange}
                  triggerLabel="選擇圖片標籤"
                  placeholder="点此選擇標籤..."
                  disabled={isGeneratingPromptByButtonClick || genModeAllAvailableTags.length === 0 || isCorrectingAllTagsGlobal || isGeneratingReport}
                />
                <button
                  onClick={handleGeneratePromptFromTagsButtonClick}
                  disabled={genModeSelectedTagsForPrompt.length === 0 || isGeneratingPromptByButtonClick || isCorrectingAllTagsGlobal || isGeneratingReport}
                  className="mt-2 sm:mt-2.5 w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-sky-500 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="依所選標籤生成提示詞"
                >
                  {isGeneratingPromptByButtonClick ? (
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:w-5" />
                  )}
                  <span>{isGeneratingPromptByButtonClick ? "AI 正在組合提示詞..." : "確定並生成提示詞"}</span>
                </button>
                {promptGenerationByButtonClickError && !isGeneratingPromptByButtonClick && (
                  <p className="text-[0.65rem] sm:text-xs text-red-500 dark:text-red-400 text-center py-1 mt-1">{promptGenerationByButtonClickError}</p>
                )}
              </div>
            )}

            {isFetchingAiSuggestions && (
                <div className="flex items-center justify-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 py-1">
                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在生成 AI 建議...
                </div>
            )}
            {aiSuggestionError && !isFetchingAiSuggestions && (
                <p className="text-[0.65rem] sm:text-xs text-red-500 dark:text-red-400 text-center py-1">{aiSuggestionError}</p>
            )}
            {!isFetchingAiSuggestions && !aiSuggestionError && ai && activeAnimatedTab !== TAB_NAME_GENERATE_IMAGE && activeAnimatedTab !== TAB_NAME_CAMERA && (
                (activeAnimatedTab === TAB_NAME_EDIT && aiSuggestions.length === 0 && (promptSpecificImageFile || currentTabImages.length > 0)) ||
                (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION && aiSuggestions.length === 0 && promptSpecificImageFile ) ||
                (activeAnimatedTab === TAB_NAME_ADD_ELEMENT && aiSuggestions.length === 0 && promptSpecificImageFile && currentTabImages.some(img => img.tags.length > 0 ))
            ) && (
                <p className="text-[0.65rem] sm:text-xs text-neutral-500 dark:text-neutral-400 text-center py-1">未生成建議。請嘗試重新生成或使用不同的圖片/標籤。</p>
            )}

            {!isFetchingAiSuggestions && !aiSuggestionError && ai && activeAnimatedTab !== TAB_NAME_GENERATE_IMAGE && activeAnimatedTab !== TAB_NAME_CAMERA && (
                (activeAnimatedTab === TAB_NAME_EDIT && !promptSpecificImageFile && currentTabImages.length === 0 && (
                    <p className="text-[0.65rem] sm:text-xs text-neutral-500 dark:text-neutral-400 text-center py-1">附加圖片至提示或上傳主要圖片以獲取編輯建議。</p>
                )) ||
                (activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION && !promptSpecificImageFile && ( 
                    <p className="text-[0.65rem] sm:text-xs text-neutral-500 dark:text-neutral-400 text-center py-1">請附加「提示特定圖片」以獲取風格建議。</p>
                )) ||
                (activeAnimatedTab === TAB_NAME_ADD_ELEMENT && !promptSpecificImageFile && (
                    <p className="text-[0.65rem] sm:text-xs text-neutral-500 dark:text-neutral-400 text-center py-1">附加圖片至提示，作為加入物件的主要圖片。</p>
                )) ||
                (activeAnimatedTab === TAB_NAME_ADD_ELEMENT && promptSpecificImageFile && currentTabImages.filter(img => img.tags.length > 0).length === 0 && (
                    <p className="text-[0.65rem] sm:text-xs text-neutral-500 dark:text-neutral-400 text-center py-1">上傳「主要圖片」並為其套用標籤，以獲取「加入物件」建議。</p>
                ))
            )}
            
            {showGeneralAiSuggestions && (
                <MultiSelectDropdown
                    options={generalAiSuggestionDropdownOptions}
                    selectedValues={selectedAiSuggestionValues}
                    onChange={handleGeneralAiSuggestionsSelect}
                    triggerLabel="AI 建議"
                    placeholder="選擇建議..."
                    disabled={isFetchingAiSuggestions || isCorrectingAllTagsGlobal || isGeneratingReport}
                />
            )}

            {canRegenerateGeneralAiSuggestions && (
                <div className="mt-2 sm:mt-3 flex justify-center">
                    <button
                    onClick={handleRegenerateGeneralAiSuggestions}
                    disabled={isFetchingAiSuggestions || isCorrectingAllTagsGlobal || isGeneratingReport}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[0.65rem] sm:text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-100/70 dark:bg-sky-700/30 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors disabled:opacity-50"
                    aria-label="重新生成 AI 建議"
                    >
                    <RefreshCwIcon className={`w-3 h-3 sm:w-3.5 sm:w-3.5 ${isFetchingAiSuggestions ? 'animate-spin' : ''}`} />
                    新建議
                    </button>
                </div>
            )}
          </div>

          {(activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA) && (
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start justify-center w-full gap-2 sm:gap-3">
              <button
                  type="button"
                  onClick={triggerImageFileDialog}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-800/80 dark:text-neutral-200/80 text-xs sm:text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-opacity-50 transition-colors duration-200 shadow-sm border border-neutral-300 dark:border-neutral-600 w-full sm:w-auto"
                  aria-label={uploadButtonLabel}
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
              >
                  <UploadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[0.7rem] sm:text-xs">{currentTabImages.length > 0 ? `更換主要圖片 (${currentTabImages.length}/3)` : `上傳主要圖片 (最多3張)`} (用於「{activeAnimatedTab}」)</span>
              </button>

              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  aria-hidden="true"
                  multiple
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
              />
          </div>
          )}
          {!ai && selectedEngine === 'imagen' && <p className="text-center text-xs text-red-500 dark:text-red-400 mt-1.5 sm:mt-2">生成失敗：Imagen 3 無法使用：Gemini API 金鑰未設定。請在伺服器環境中設定 API_KEY。</p>}
          {selectedEngine === 'flux' && import.meta.env.PROD && (
             <p className="text-center text-xs text-yellow-600 dark:text-yellow-400 mt-1.5 sm:mt-2">
                Flux 引擎使用伺服器端 API 金鑰。管理員請確認 FLUX_API_KEY 已在 Netlify Functions 環境變數中設定。
            </p>
          )}


          {(activeAnimatedTab !== TAB_NAME_REFERENCE_INSPIRATION && activeAnimatedTab !== TAB_NAME_CAMERA) && currentTabImages.length > 0 && ( 
              <div className="mt-6 sm:mt-8 w-full flex flex-col items-center gap-4 sm:gap-6 px-1 sm:px-2" role="group" aria-label={`「${activeAnimatedTab}」分頁已選的主要圖片`}>
                {currentTabImages.map((imageData) => (
                  <div key={imageData.id} className="relative w-full max-w-md p-2.5 sm:p-3 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm bg-gray-50 dark:bg-neutral-800/30">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <img
                          src={imageData.previewUrl}
                          alt={`預覽 ${imageData.displayName}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg shadow-md border border-gray-200 dark:border-neutral-600 flex-shrink-0 self-center sm:self-start"
                      />
                      <button
                          type="button"
                          onClick={() => removeImageFromApp(activeAnimatedTab, imageData.id)}
                          aria-label={`移除 ${imageData.displayName}`}
                          className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 p-1 sm:p-1.5 bg-white dark:bg-neutral-700 rounded-full text-red-500 hover:text-red-700 dark:hover:text-red-400 shadow-md hover:bg-red-50 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-400 z-10"
                          disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                      >
                          <CloseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <div className="flex-grow space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mb-1">手動標籤 - {imageData.displayName}：</p>
                          {activeAnimatedTab === TAB_NAME_GENERATE_IMAGE ? (
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                  <input
                                      type="text"
                                      value={imageData.manualTagInput || ""}
                                      onChange={(e) => handlePerImageStateChange(activeAnimatedTab, imageData.id, 'manualTagInput', e.target.value)}
                                      placeholder="輸入手動標籤並按新增"
                                      className="text-xs sm:text-sm p-1.5 sm:p-2 border border-gray-300 dark:border-neutral-600 rounded flex-grow focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-neutral-700 text-black dark:text-white"
                                      aria-label={`為 ${imageData.displayName} 輸入手動標籤`}
                                      disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                                  />
                                  <button
                                      type="button"
                                      onClick={() => {
                                          if (imageData.manualTagInput?.trim()) {
                                              addTag(activeAnimatedTab, imageData.id, imageData.manualTagInput.trim());
                                          }
                                      }}
                                      disabled={!imageData.manualTagInput?.trim() || isCorrectingAllTagsGlobal || isGeneratingReport}
                                      className="text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2 bg-sky-500 text-white rounded hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed"
                                      aria-label={`確認為 ${imageData.displayName} 新增手動標籤`}
                                  >
                                      新增標籤
                                  </button>
                              </div>
                          ) : ( 
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <select
                                  value={imageData.currentDropdownTagSelection || ""}
                                  onChange={(e) => handlePerImageStateChange(activeAnimatedTab, imageData.id, 'currentDropdownTagSelection', e.target.value)}
                                  className="text-xs sm:text-sm p-1.5 sm:p-2 border border-gray-300 dark:border-neutral-600 rounded flex-grow focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-neutral-700 text-black dark:text-white"
                                  aria-label={`為 ${imageData.displayName} 選擇通用標籤`}
                                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                              >
                                  <option value="" className="text-gray-500 dark:text-neutral-400">-- 選擇標籤 --</option>
                                  {tagCategories.map(category => (
                                  <optgroup label={category.name} key={category.name}>
                                      {category.tags.map(tag => (
                                      <option value={tag} key={tag} className="text-black dark:text-white">{tag}</option>
                                      ))}
                                  </optgroup>
                                  ))}
                              </select>
                              <button
                                  type="button"
                                  onClick={() => addTag(activeAnimatedTab, imageData.id, imageData.currentDropdownTagSelection || "")}
                                  disabled={!imageData.currentDropdownTagSelection || isCorrectingAllTagsGlobal || isGeneratingReport}
                                  className="text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-2 bg-sky-500 text-white rounded hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed"
                                  aria-label={`確認為 ${imageData.displayName} 新增通用標籤`}
                              >
                                  新增標籤
                              </button>
                              </div>
                          )}
                          {imageData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 sm:gap-1.5" role="list" aria-label={`${imageData.displayName} 的目前通用標籤`}>
                              {imageData.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} role="listitem" className="text-[0.65rem] sm:text-xs bg-gray-200 dark:bg-neutral-600 text-gray-700 dark:text-neutral-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex items-center shadow-xs">
                                  {tag}
                                  <button type="button" onClick={() => removeTag(activeAnimatedTab, imageData.id, tagIndex)}
                                    aria-label={`從 ${imageData.displayName} 移除標籤 ${tag}`}
                                    className="ml-1 sm:ml-1.5 p-0.5 text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none rounded-full"
                                    disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
                                  > <CloseIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3.5" strokeWidth={3} /> </button>
                                </span>
                              ))}
                            </div>
                          )}
                          {imageData.tags.length === 0 && <p className="text-[0.65rem] sm:text-xs text-gray-400 dark:text-neutral-500 italic">尚無手動標籤。</p>}
                        </div>

                        {activeAnimatedTab === TAB_NAME_GENERATE_IMAGE && (
                          <div className="mt-2 sm:mt-3">
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mb-1 flex items-center">
                                  <BrainIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-sky-500" />
                                  AI 辨識標籤：
                              </p>
                              {imageData.isFetchingOcr && (
                                  <div className="flex items-center text-xs text-sky-600 dark:text-sky-400 py-1">
                                      <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      正在辨識圖片內容...
                                  </div>
                              )}
                              {imageData.ocrError && !imageData.isFetchingOcr && (
                                  <p className="text-[0.65rem] sm:text-xs text-red-500 dark:text-red-400">{imageData.ocrError}</p>
                              )}
                              {!imageData.isFetchingOcr && !imageData.ocrError && imageData.aiGeneratedTags && imageData.aiGeneratedTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                      {imageData.aiGeneratedTags.map((tag, idx) => (
                                          <span key={`ai-${idx}`} className="text-[0.65rem] sm:text-xs bg-sky-100 dark:bg-sky-800/70 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-xs">
                                              {tag}
                                          </span>
                                      ))}
                                  </div>
                              )}
                              {!imageData.isFetchingOcr && !imageData.ocrError && (!imageData.aiGeneratedTags || imageData.aiGeneratedTags.length === 0) && (
                                   <p className="text-[0.65rem] sm:text-xs text-gray-400 dark:text-neutral-500 italic">無 AI 辨識標籤。</p>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}

          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-neutral-700/60 dark:text-neutral-300/60">
            輸入提示以生成圖片。
            {activeAnimatedTab === TAB_NAME_REFERENCE_INSPIRATION 
              ? `請附加「提示特定圖片」作為結構參考，AI 將提供風格化提示建議，以應用於「${TAB_NAME_REFERENCE_INSPIRATION}」模式。`
              : activeAnimatedTab === TAB_NAME_CAMERA 
                ? `使用相機拍攝照片，然後選擇如何使用它。`
                : "可選擇上傳主要圖片或將圖片附加至提示以獲取 AI 建議。"
            }
            目前分頁：「{activeAnimatedTab}」。
            目前主題：「{activePlaceholderTheme}」。
            選擇的引擎：「{selectedEngine === 'flux' ? 'Flux Kontext Max' : 'Imagen 3'}」。
            {activeAnimatedTab === TAB_NAME_GENERATE_IMAGE ? ` 在此「${TAB_NAME_GENERATE_IMAGE}」模式下，上傳主要圖片後，AI會自動辨識圖片內容並提供標籤，您也可以手動添加。然後，您可以使用這些標籤組合來生成更精準的提示詞。` : ""}
            當主題變更時，所有相關標籤將會自動更新以符合新主題。
            {currentPromptImageAspectRatio && promptSpecificImagePreviewUrl && (
                <span className="block mt-1 text-sky-600 dark:text-sky-400">主圖已裁切為 {currentPromptImageAspectRatio} 比例。</span>
            )}
          </p>
        </div> 
      </div>
    );
  }

  const isAnyModalOpen = isAppSettingsModalOpen || isLoginModalOpen || isGeneratedHistoryModalOpen || isReportModalOpen;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col selection:bg-neutral-800 selection:text-white">
      {isCorrectingAllTagsGlobal && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-white p-4">
          <svg className="animate-spin h-10 w-10 text-sky-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">正在根據新主題「{activePlaceholderTheme}」更新所有圖片標籤...</p>
          <p className="text-sm opacity-80">這可能需要一些時間，請稍候。</p>
        </div>
      )}
      {tagCorrectionGlobalError && !isCorrectingAllTagsGlobal && (
         <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-3 bg-red-600 text-white rounded-md shadow-lg text-sm flex items-center gap-2">
            <InfoIcon className="w-5 h-5"/>
            <span>{tagCorrectionGlobalError}</span>
            <button onClick={() => setTagCorrectionGlobalError(null)} className="ml-2 p-1 hover:bg-red-700 rounded-full">
                <CloseIcon className="w-4 h-4" />
            </button>
         </div>
      )}
      {reportError && !isGeneratingReport && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-3 bg-red-600 text-white rounded-md shadow-lg text-sm flex items-center gap-2">
            <InfoIcon className="w-5 h-5"/>
            <span>{reportError}</span>
            <button onClick={() => setReportError(null)} className="ml-2 p-1 hover:bg-red-700 rounded-full">
                <CloseIcon className="w-4 h-4" />
            </button>
         </div>
      )}


      <header className="w-full py-3 sm:py-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            StyleGuide AI
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                  onClick={() => setIsGeneratedHistoryModalOpen(true)}
                  className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-colors"
                  aria-label="開啟已生成圖片歷史紀錄"
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
              >
                  <HistoryIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                  onClick={openAppSettingsModal}
                  className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-colors"
                  aria-label="開啟應用程式設定"
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
              >
                  <CogIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                  onClick={openLoginModal}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition-colors"
                  aria-label="登入或註冊"
                  disabled={isCorrectingAllTagsGlobal || isGeneratingReport}
              >
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">登入</span>
              </button>
            </div>
        </div>
      </header>
      
      <FloatingSlider
        isVisible={selectedEngine === 'flux' && !isCameraActive && !isLoading && !isGeneratingImage && !isGeneratingReport && !isAnyModalOpen}
        value={fluxSafetyTolerance}
        onChange={setFluxSafetyTolerance}
        min={0}
        max={5}
        step={1}
        label="安全容忍度"
        isCollapsed={isFloatingSliderCollapsed}
        onToggleCollapse={() => setIsFloatingSliderCollapsed(prev => !prev)}
      />

      <main className="flex-grow flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {mainContentArea()}
      </main>

      <AnimatedTabs
        tabs={aiStyleTopics}
        activeTab={activeAnimatedTab}
        onTabChange={handleTabChange}
      />

      {isGeneratedHistoryModalOpen && (
         <GeneratedImageHistoryModal
          isOpen={isGeneratedHistoryModalOpen}
          onClose={() => setIsGeneratedHistoryModalOpen(false)}
          projects={sortedProjects}
          activeProjectIdFromApp={activeModalProjectId || currentProjectId}
          onProjectTabChange={(pid) => {
            setActiveModalProjectId(pid);
            if(pid) setCurrentProjectId(pid); 
          }}
          onUseAsPrompt={handleUseGeneratedAsPromptImage}
          onAddToMain={handleAddGeneratedToMainImages}
          onGenerateReport={ai ? handleGenerateReport : undefined}
          isGeneratingReport={isGeneratingReport}
          activeGeneratingReportId={activeGeneratingReportId}
        />
      )}
      {isLoginModalOpen && (
        <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      )}
      {isAppSettingsModalOpen && (
        <AppSettingsModal 
            isOpen={isAppSettingsModalOpen}
            onClose={closeAppSettingsModal}
            defaultThemes={Object.keys(placeholderThemes)}
            customThemes={Object.keys(customPlaceholderThemes)}
            currentTheme={activePlaceholderTheme}
            onSelectTheme={handleSelectTheme}
            onAddCustomTheme={handleAddCustomTheme}
            onDeleteCustomTheme={handleDeleteCustomTheme}
            selectedEngine={selectedEngine}
            onSelectEngine={setSelectedEngine}
            isGeminiApiAvailable={!!ai}
            imagenOutputFormat={imagenOutputFormat}
            onImagenOutputFormatChange={setImagenOutputFormat}
            fluxOutputFormat={fluxOutputFormat}
            onFluxOutputFormatChange={setFluxOutputFormat}
            fluxPromptUpsampling={fluxPromptUpsampling}
            onFluxPromptUpsamplingChange={setFluxPromptUpsampling}
            fluxSafetyTolerance={fluxSafetyTolerance}
            onFluxSafetyToleranceChange={setFluxSafetyTolerance}
        />
      )}
      {isReportModalOpen && generatedReportContent && activeImageForReport && (
        <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
                setIsReportModalOpen(false);
                setGeneratedReportContent(null);
                setActiveImageForReport(null);
                setReportError(null); 
            }}
            reportContent={generatedReportContent}
            imageForReport={activeImageForReport}
            onDownloadReport={downloadReport}
        />
      )}

    </div>
  );
};

export default App;
