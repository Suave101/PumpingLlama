import React from 'react';
import Link from 'next/link';
import { LogoMark } from './Logo';
import { CanvasAccount } from './CanvasAccount';

type NavPage = 'home' | 'book' | 'problems' | 'instructors';

export const SiteNav: React.FC<{ current?: NavPage; wide?: boolean }> = ({ current, wide = false }) => {
  const linkClass = (active: boolean) =>
    `whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition ${
      active ? 'text-white bg-steel-800' : 'text-steel-400 hover:text-white hover:bg-steel-900'
    }`;

  return (
    <nav className={`${wide ? 'max-w-7xl' : 'max-w-6xl'} mx-auto flex items-center justify-between gap-4 py-5`}>
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <LogoMark className="w-8 h-8" />
        <span className="text-lg font-extrabold text-white tracking-tight hidden sm:inline">Pumping Llama</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link href="/book" className={linkClass(current === 'book')}>
          Textbook
        </Link>
        <Link href="/problems" className={linkClass(current === 'problems')}>
          Labs
        </Link>
        <Link href="/instructors" className={linkClass(current === 'instructors')}>
          Instructors
        </Link>
        <CanvasAccount />
      </div>
    </nav>
  );
};
