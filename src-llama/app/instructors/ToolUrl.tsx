'use client';

import React, { useState, useSyncExternalStore } from 'react';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const noSubscribe = () => () => {};

// A URL on this site, shown with the real origin and a copy button
export const ToolUrl: React.FC<{ path: string }> = ({ path }) => {
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => 'https://your-site');
  const [copied, setCopied] = useState(false);
  const url = `${origin}${BASE_PATH}${path}`;

  return (
    <div className="flex items-center gap-2 bg-steel-900 border border-steel-800 rounded-lg pl-3 pr-1 py-1">
      <code className="flex-1 min-w-0 truncate font-mono text-xs text-arc-200">{url}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => setCopied(true));
        }}
        className="shrink-0 text-xs px-2.5 py-1 rounded-md border border-steel-700 text-steel-300 hover:text-white"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};
