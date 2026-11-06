import type { Responses } from '@/lib/textbook/types';

// What the browser keeps after a Canvas launch (see handOffPage in lib/lti/html.ts)
export type LtiClientSession = {
  token: string;
  userName?: string;
  contextTitle?: string;
  sectionKey?: string;
  gradePassback: boolean;
  isStaff: boolean;
};

export const LTI_STORAGE_KEY = 'pumping-llama:lti';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function readLtiSession(): LtiClientSession | null {
  try {
    const raw = sessionStorage.getItem(LTI_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LtiClientSession) : null;
  } catch {
    return null;
  }
}

export type SyncResult = { ok: true; earned: number; total: number } | { ok: false; error: string };

// Send the section's answers; the server grades them and posts the score to Canvas
export async function syncScore(session: LtiClientSession, sectionKey: string, responses: Responses): Promise<SyncResult> {
  try {
    const res = await fetch(`${BASE_PATH}/api/lti/score`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionKey, responses }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body.error ?? `Canvas sync failed (${res.status})` };
    return { ok: true, earned: body.earned, total: body.total };
  } catch {
    return { ok: false, error: 'Could not reach the server to sync with Canvas.' };
  }
}
