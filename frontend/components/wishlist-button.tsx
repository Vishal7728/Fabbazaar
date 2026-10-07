'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export function WishlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${apiBaseUrl}/auth/me/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok || !result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
          throw new Error('Unable to load your wishlist.');
        }
        setSaved(result.data.includes(productId));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load your wishlist.'))
      .finally(() => setLoading(false));
  }, [productId]);

  async function toggleWishlist() {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      window.location.assign('/login');
      return;
    }
    if (saving || loading) return;
    setError('');
    setSaving(true);
    try {
      const readResponse = await fetch(`${apiBaseUrl}/auth/me/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      const readResult: unknown = await readResponse.json();
      if (!readResponse.ok || !readResult || typeof readResult !== 'object' || !('data' in readResult) || !Array.isArray(readResult.data)) {
        throw new Error('Unable to update your wishlist.');
      }
      const nextIds = readResult.data.filter((id): id is string => typeof id === 'string');
      const updatedIds = saved ? nextIds.filter((id) => id !== productId) : [...new Set([...nextIds, productId])];
      const response = await fetch(`${apiBaseUrl}/auth/me/wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productIds: updatedIds })
      });
      const updateResult: unknown = await response.json();
      if (!response.ok || !updateResult || typeof updateResult !== 'object' || !('data' in updateResult) || !Array.isArray(updateResult.data)) {
        const detail = updateResult && typeof updateResult === 'object' && 'error' in updateResult ? updateResult.error : 'Unable to update your wishlist.';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to update your wishlist.');
      }
      setSaved(updateResult.data.includes(productId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update your wishlist.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={toggleWishlist} disabled={loading || saving} aria-busy={loading || saving} aria-pressed={saved} aria-label={loading ? 'Loading wishlist' : saving ? 'Updating wishlist' : saved ? 'Remove from wishlist' : 'Add to wishlist'} title={error || (loading ? 'Loading wishlist' : saving ? 'Updating wishlist' : saved ? 'Remove from wishlist' : 'Add to wishlist')} className={`rounded-full border border-brand-200 p-3 transition ${saved ? 'text-rose-500' : 'text-brand-700'} hover:border-brand-400 disabled:cursor-wait disabled:opacity-60`}>
        <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
      </button>
      {error && <span role="alert" className="ml-2 text-xs text-red-700">{error}</span>}
      {!error && saved && <span className="sr-only" aria-live="polite">Saved to your wishlist</span>}
    </span>
  );
}
