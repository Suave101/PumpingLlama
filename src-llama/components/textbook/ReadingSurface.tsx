'use client';

import React, { useSyncExternalStore } from 'react';

// Textbook pages read like a printed page by default ("paper"); readers can switch back to the
// site's dark look ("night"). The palettes for each mode live in globals.css under [data-reading].

type ReadingMode = 'paper' | 'night';

const STORAGE_KEY = 'pumping-llama:reading-mode';
const CHANGE_EVENT = 'pumping-llama:reading-mode';

function readMode(): ReadingMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'night' ? 'night' : 'paper';
  } catch {
    return 'paper';
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function setMode(mode: ReadingMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Without storage the choice lasts until the page reloads
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const ReadingSurface: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useSyncExternalStore(subscribe, readMode, () => 'paper' as const);

  return (
    <main data-reading={mode} className="min-h-screen bg-steel-950 text-steel-100 px-4 sm:px-8 font-sans">
      {children}
      <button
        type="button"
        onClick={() => setMode(mode === 'paper' ? 'night' : 'paper')}
        aria-label={mode === 'paper' ? 'Switch to night reading mode' : 'Switch to paper reading mode'}
        className="fixed bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full border border-steel-700 bg-steel-900 text-steel-300 hover:text-white text-xs font-medium shadow-lg"
      >
        <span aria-hidden="true">{mode === 'paper' ? '☾' : '☀'}</span>
        {mode === 'paper' ? 'Night' : 'Paper'}
      </button>
    </main>
  );
};
