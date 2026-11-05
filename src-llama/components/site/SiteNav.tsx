import React from 'react';
import Link from 'next/link';
import { LogoMark } from './Logo';

export const SiteNav: React.FC<{ current?: 'home' | 'problems' }> = ({ current }) => {
  const linkClass = (active: boolean) =>
    `whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition ${
      active ? 'text-white bg-steel-800' : 'text-steel-400 hover:text-white hover:bg-steel-900'
    }`;

  return (
    <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4 py-5">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <LogoMark className="w-8 h-8" />
        <span className="text-lg font-extrabold text-white tracking-tight">Pumping Llama</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link href="/problems" className={linkClass(current === 'problems')}>
          Problems
        </Link>
        <Link href="/admin/studio" className={linkClass(false)}>
          <span className="hidden sm:inline">Professor </span>Studio
        </Link>
      </div>
    </nav>
  );
};
