import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Book prose: GitHub-flavored Markdown with KaTeX math, styled by .book-prose in globals.css
export const Markdown: React.FC<{ children: string; inline?: boolean }> = ({ children, inline = false }) => (
  <div className={inline ? 'book-prose book-prose-inline' : 'book-prose'}>
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  </div>
);
