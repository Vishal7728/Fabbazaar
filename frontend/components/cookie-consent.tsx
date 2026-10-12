'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type CookieChoice = 'all' | 'essential';
const consentCookie = 'fabbazaar-cookie-consent';
const preferencesKey = 'fabbazaar-shopping-preferences';

type ShoppingPreferences = {
  language: string;
  timeZone: string;
  region?: { latitude: number; longitude: number };
  updatedAt: string;
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const savedChoice = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${consentCookie}=`))
      ?.split('=')[1];

    setVisible(savedChoice !== 'all' && savedChoice !== 'essential');
  }, []);

  function saveChoice(choice: CookieChoice) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${consentCookie}=${choice}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;

    if (choice === 'essential') {
      try {
        window.localStorage.removeItem(preferencesKey);
      } catch {
        // Some browser privacy modes can disable local storage.
      }
    } else {
      const preferences: ShoppingPreferences = {
        language: navigator.language || 'en',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        updatedAt: new Date().toISOString(),
      };
      const savePreferences = () => {
        try {
          window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
        } catch {
          // Consent still takes effect when browser storage is unavailable.
        }
      };

      // Location is optional and remains on this device. The browser asks the
      // visitor separately; declining it does not affect the other preferences.
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            preferences.region = {
              latitude: Math.round(coords.latitude * 100) / 100,
              longitude: Math.round(coords.longitude * 100) / 100,
            };
            savePreferences();
          },
          savePreferences,
          { maximumAge: 24 * 60 * 60 * 1000, timeout: 8000 },
        );
      } else {
        savePreferences();
      }
    }

    setVisible(false);
  }

  function openSettings() {
    setVisible(true);
  }

  return (
    <>
      {visible ? (
        <aside
          aria-labelledby="cookie-consent-title"
          className="cookie-consent-panel fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-2xl border p-5 shadow-2xl sm:bottom-6 sm:left-6 sm:right-auto sm:p-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-500">Your privacy</p>
          <h2 id="cookie-consent-title" className="mt-1 font-serif text-xl text-brand-900">Cookie preferences</h2>
          <p className="mt-2 text-sm leading-6 text-brand-700">
            Essential cookies keep your cart and sign-in working. If you accept optional cookies, we save your language and time zone on this device. Your browser may separately ask to share an approximate location for shopping personalization. We do not send these details to our servers. You can change your choice here at any time.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => saveChoice('all')}
              className="rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Accept optional
            </button>
            <button
              type="button"
              onClick={() => saveChoice('essential')}
              className="rounded-full border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Reject optional
            </button>
            <Link href="/privacy" className="px-2 py-2 text-sm font-medium text-brand-600 underline underline-offset-4 hover:text-brand-900">
              Privacy policy
            </Link>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={openSettings}
          className="cookie-settings fixed bottom-4 left-4 z-[90] rounded-full border px-3 py-2 text-xs font-semibold shadow-lg sm:bottom-6 sm:left-6"
          aria-label="Open cookie preferences"
        >
          Cookie settings
        </button>
      )}
    </>
  );
}
