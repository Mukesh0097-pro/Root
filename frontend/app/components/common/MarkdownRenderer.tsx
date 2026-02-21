import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 text-white">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <pre className="bg-root-bg border border-white/10 rounded-lg p-4 mb-3 overflow-x-auto">
                <code className="text-sm text-root-accent font-mono">{children}</code>
              </pre>
            );
          }
          return (
            <code className="bg-root-bg/80 text-root-accent px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        a: ({ href, children }) => (
          <a href={href} className="text-root-accent hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-root-accent/50 pl-4 my-3 text-root-muted italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse border border-white/10 rounded-lg">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-root-bg/50">{children}</thead>,
        th: ({ children }) => <th className="border border-white/10 px-3 py-2 text-left font-bold">{children}</th>,
        td: ({ children }) => <td className="border border-white/10 px-3 py-2">{children}</td>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        hr: () => <hr className="border-white/10 my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
