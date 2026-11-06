'use client';

import React, { useState } from 'react';
import type { ContentsChapter } from '@/lib/textbook/book';
import { useHydrated, useLtiSession } from '@/components/textbook/useLtiSession';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const DeepLinkPicker: React.FC<{ chapters: ContentsChapter[] }> = ({ chapters }) => {
  const lti = useLtiSession();
  const hydrated = useHydrated();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  if (!hydrated) return null;
  if (!lti) {
    return (
      <p className="max-w-xl text-steel-300">
        Open this page from Canvas: add an assignment or module item and choose Pumping Llama as the external tool.
      </p>
    );
  }

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <form
      method="post"
      action={`${BASE_PATH}/api/lti/deep-link`}
      className="max-w-2xl flex flex-col gap-6"
      onSubmit={(e) => {
        if (selected.length === 0) {
          e.preventDefault();
          setError('Choose at least one section.');
        }
      }}
    >
      <header>
        <h1 className="text-2xl font-bold text-white">Add textbook sections</h1>
        <p className="text-sm text-steel-400 mt-1">
          Each section becomes its own Canvas link. In an assignment it&apos;s graded out of the section&apos;s points, and
          students&apos; grades update as they complete activities.
        </p>
      </header>
      <input type="hidden" name="token" value={lti.token} />

      {chapters.map((chapter) => (
        <fieldset key={chapter.id} className="flex flex-col gap-1">
          <legend className="text-sm font-semibold text-white mb-2">
            <span className="font-mono text-gold-400 mr-2">{chapter.number}</span>
            {chapter.title}
          </legend>
          {chapter.sections.map((s) => (
            <label key={s.key} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-steel-900 cursor-pointer">
              <input
                type="checkbox"
                name="section"
                value={s.key}
                checked={selected.includes(s.key)}
                onChange={() => {
                  toggle(s.key);
                  setError('');
                }}
                className="accent-crimson-600"
              />
              <span className="font-mono text-xs text-steel-500 w-8">{s.number}</span>
              <span className="text-sm text-steel-200 flex-1">{s.title}</span>
              <span className="text-xs text-steel-500">
                {s.activities > 0 ? `${s.activities} activities` : 'reading only'}
              </span>
            </label>
          ))}
        </fieldset>
      ))}

      <div className="flex items-center gap-4 sticky bottom-0 bg-steel-950 py-4 border-t border-steel-800">
        <button className="px-5 py-2.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white font-semibold transition">
          Add {selected.length || ''} {selected.length === 1 ? 'section' : 'sections'} to Canvas
        </button>
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </form>
  );
};
