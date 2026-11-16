'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLtiSession } from '@/components/textbook/useLtiSession';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

type AuthState = { enabled: boolean; user: { name: string } | null };

// "Log in with Canvas" in the site nav, or the signed-in user's name with a way to log out
export function CanvasAccount() {
  const pathname = usePathname();
  const lti = useLtiSession();
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_PATH}/api/auth/session`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: AuthState | null) => !cancelled && setAuth(body))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Opened from a Canvas assignment: the launch already says who this is
  if (lti) {
    return lti.userName ? <span className="px-3 text-sm text-steel-400 truncate max-w-40">{lti.userName}</span> : null;
  }
  if (!auth?.enabled) return null;

  if (auth.user) {
    const logOut = async () => {
      await fetch(`${BASE_PATH}/api/auth/session`, { method: 'DELETE' }).catch(() => {});
      setAuth({ ...auth, user: null });
    };
    return (
      <div className="flex items-center gap-1 pl-2">
        <span className="text-sm text-steel-300 truncate max-w-40" title={auth.user.name}>
          {auth.user.name}
        </span>
        <button
          type="button"
          onClick={logOut}
          className="whitespace-nowrap px-3 py-1.5 rounded-md text-sm text-steel-400 hover:text-white hover:bg-steel-900 transition"
        >
          Log out
        </button>
      </div>
    );
  }

  const href = `${BASE_PATH}/api/auth/canvas/login?returnTo=${encodeURIComponent(pathname || '/book')}`;
  return (
    <a
      href={href}
      className="ml-2 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium text-white bg-crimson-600 hover:bg-crimson-500 transition"
    >
      Log in with Canvas
    </a>
  );
}
