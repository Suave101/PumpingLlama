import React from 'react';
import Link from 'next/link';
import { Problem } from '@/types/automata';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface WorkspaceHeaderProps {
  problem: Problem;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ problem }) => {
  return (
    <header className="flex justify-between items-start border-b border-steel-800 pb-4">
      <div>
        <Link href="/problems" className="text-xs font-semibold text-gold-400 hover:text-gold-300">
          &larr; Back to Problems
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-steel-900 border border-steel-700 text-gold-400 font-mono">
            {problem.type}
          </span>
          <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
        </div>
        <div className="text-steel-400 text-sm mt-1">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {problem.description}
          </ReactMarkdown>
        </div>
      </div>
    </header>
  );
};