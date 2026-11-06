'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Responses } from './types';

// Answers live in localStorage per section, so reading progress survives reloads without an account.
// Canvas grades are computed on the server from these answers (see app/api/lti/score).

const responsesKey = (sectionKey: string) => `pumping-llama:responses:${sectionKey}`;
const scoreKey = (sectionKey: string) => `pumping-llama:score:${sectionKey}`;
const CHANGE_EVENT = 'pumping-llama:progress';

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows and blocked storage: progress just won't persist
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

const parse = <T,>(raw: string, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function useSectionResponses(sectionKey: string) {
  const raw = useSyncExternalStore(subscribe, () => read(responsesKey(sectionKey)), () => '');
  const responses = useMemo(() => parse<Responses>(raw, {}), [raw]);

  const setResponse = useCallback(
    (activityId: string, value: unknown) => {
      const current = parse<Responses>(read(responsesKey(sectionKey)), {});
      write(responsesKey(sectionKey), JSON.stringify({ ...current, [activityId]: value }));
    },
    [sectionKey]
  );

  return [responses, setResponse] as const;
}

export type StoredScore = { earned: number; total: number };

export function saveSectionScore(sectionKey: string, score: StoredScore) {
  const next = JSON.stringify(score);
  if (read(scoreKey(sectionKey)) !== next) write(scoreKey(sectionKey), next);
}

// Every section's last computed score, for the table of contents
export function useAllScores(sectionKeys: string[]): Record<string, StoredScore | undefined> {
  const raw = useSyncExternalStore(
    subscribe,
    () => sectionKeys.map((k) => read(scoreKey(k))).join('\n'),
    () => ''
  );
  return useMemo(() => {
    const lines = raw.split('\n');
    return Object.fromEntries(sectionKeys.map((k, i) => [k, parse<StoredScore | undefined>(lines[i] ?? '', undefined)]));
  }, [raw, sectionKeys]);
}
