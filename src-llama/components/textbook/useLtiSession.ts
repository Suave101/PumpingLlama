'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { LTI_STORAGE_KEY, type LtiClientSession } from '@/lib/lti/client';

const noSubscribe = () => () => {};

const readRaw = () => {
  try {
    return sessionStorage.getItem(LTI_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

// The Canvas launch this tab came from, if any (null when the book is opened directly)
export function useLtiSession(): LtiClientSession | null {
  const raw = useSyncExternalStore(noSubscribe, readRaw, () => '');
  return useMemo(() => {
    try {
      return raw ? (JSON.parse(raw) as LtiClientSession) : null;
    } catch {
      return null;
    }
  }, [raw]);
}

// False during server rendering and hydration, true afterwards
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
