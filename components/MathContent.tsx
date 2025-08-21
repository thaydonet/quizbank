
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    renderMathInElement?: (element: HTMLElement, options?: any) => void;
  }
}

interface MathContentProps {
  content: string;
  className?: string;
}

const MathContent: React.FC<MathContentProps> = ({ content, className }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
    console.log("MathContent content:", content);
        ref.current.innerHTML = content;
        try {
            if (window.renderMathInElement) {
                window.renderMathInElement(ref.current, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError : false
                });
            }
        } catch (error) {
            console.error("KaTeX auto-render error:", error);
            // Fallback to raw text is handled by innerHTML
        }
    }
  }, [content]);

  return <span ref={ref} className={className}></span>;
};

export default MathContent;
