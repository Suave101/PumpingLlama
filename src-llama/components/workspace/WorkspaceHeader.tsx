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
    <header className="flex justify-between items-start border-b border-slate-800 pb-4">
      <div>
        <Link href="/" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
          &larr; Back to Problem Overview
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono">
            {problem.type}
          </span>
          <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
        </div>
        <div className="text-slate-400 text-sm mt-1">
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