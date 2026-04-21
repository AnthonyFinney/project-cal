import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIResponseRendererProps {
  content: string;
  className?: string;
}

const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;
  
  return (
    <div className={`ai-response-content prose prose-black max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Personalización de elementos para la estética Neobrutalista
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-black text-sm md:text-base font-medium">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold text-black mb-4 mt-6 uppercase border-b-2 border-black pb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-black mb-3 mt-5 uppercase">{children}</h2>,
          h3: ({ children }) => <h3 className="text-md font-bold text-black mb-2 mt-4">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-black font-bold">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-black font-bold">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children }) => (
            <code className="bg-white px-1.5 py-0.5 rounded-none border-2 border-black font-mono text-xs text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-black pl-4 italic my-4 text-black font-bold bg-gray-50 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border-2 border-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => <th className="border-2 border-black bg-primary p-2 text-left font-bold text-black">{children}</th>,
          td: ({ children }) => <td className="border-2 border-black p-2 bg-white text-black font-medium">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AIResponseRenderer;
