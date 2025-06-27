
"use client";

import { useEffect, useState } from "react";
import { cn } from "./Primitives"; // Adjusted import path

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
  onAnimationComplete?: () => void;
}

export function TypingAnimation({
  text,
  duration = 100, // Slightly faster default duration
  className,
  onAnimationComplete,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [i, setI] = useState<number>(0);

  useEffect(() => {
    setDisplayedText(""); // Reset on text change
    setI(0);
  }, [text]);

  useEffect(() => {
    if (i < text.length) {
      const typingEffect = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      }, duration);

      return () => {
        clearInterval(typingEffect);
      };
    } else if (i >= text.length && text.length > 0) {
      if (onAnimationComplete) {
        // Optional: add a slight delay before calling complete to ensure text is fully visible
        const completeTimeout = setTimeout(() => {
            onAnimationComplete();
        }, duration * 2); // Wait for two character durations
        return () => clearTimeout(completeTimeout);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, i, text, onAnimationComplete]); // Added text and onAnimationComplete to dependencies

  return (
    <h1
      className={cn(
        "font-display text-center font-bold tracking-[-0.02em] drop-shadow-sm", // Removed default text-4xl and leading-[5rem] to be set by consumer
        className,
      )}
      aria-label={text} // For accessibility
    >
      {displayedText}
      {/* Blinking cursor effect (optional) */}
      <span className={cn(
        "animate-blink ml-0.5 sm:ml-1 inline-block w-0.5 sm:w-1 bg-neutral-700 dark:bg-neutral-300", // Responsive cursor width
        // The height of the cursor will typically be inherited or match the line-height of the text.
        // For example, if text is text-3xl, cursor might need h-8 or h-9. If text-sm, h-4 or h-5.
        // This is tricky to make perfectly generic here. Assuming consumer class sets line-height or text height.
        // Example: if className is "text-3xl h-10", this cursor needs to align.
        // A common approach for cursor height matching text is to use `align-bottom` or `align-text-bottom` if it's a true inline element,
        // or ensure its height is relative to the font size (e.g. `h-[1em]`).
        // For simplicity with Tailwind, often the height of the container or line-height handles this.
        // Explicitly setting a height that scales with text-size is complex without JS to read font-size.
        // Here, we ensure the width scales. Height can be made more robust if needed.
        // Using `inline-block` and `bg-color` is fine.
        // Height example: `h-[0.8em]` could be a relative height. Or use Tailwind's text size classes directly like `h-8`.
        // For now, let's keep it simple and assume line-height/container handles it.
         i >= text.length && "opacity-0" // Hide cursor when typing is done, or make it continuously blink
      )}></span>
    </h1>
  );
}

// Add blink animation to global styles or a style tag if not using Tailwind JIT for animations
// In index.html or a global CSS file:
/*
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-end infinite;
}
*/
