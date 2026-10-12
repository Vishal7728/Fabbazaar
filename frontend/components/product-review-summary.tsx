'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Star } from 'lucide-react';

type ReviewSummaryData = {
  averageRating: number;
  totalReviews: number;
  reviews: Array<{ customerName: string; rating: number; comment: string; createdAt: string }>;
};
const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export function ProductReviewSummary({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<ReviewSummaryData | null>(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setSubmitError('');
    try {
      const response = await fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(slug)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rating, comment }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to post your review');
      setMessage('Thanks — your review is live.'); setComment('');
      const refreshed = await fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(slug)}`);
      const data = await refreshed.json() as { data: ReviewSummaryData };
      setSummary(data.data);
    } catch (reason) { setSubmitError(reason instanceof Error ? reason.message : 'Unable to post your review'); }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('fabbazaar-token');
    const user = sessionStorage.getItem('fabbazaar-user');
    if (saved && user) { try { if (JSON.parse(user).role === 'customer') setToken(saved); } catch { /* Ignore malformed session data. */ } }
    fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok || !result || typeof result !== 'object' || !('data' in result)) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load reviews';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load reviews');
        }
        setSummary(result.data as ReviewSummaryData);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load reviews'));
  }, [slug]);

  if (error) return <p role="status" className="mt-4 text-sm text-brand-500">{error}</p>;
  if (!summary) return <p className="mt-4 text-sm text-brand-500">Loading reviews…</p>;

  return (
    <section className="mt-5" aria-label="Customer reviews">
      <div className="flex items-center gap-2 text-brand-700">
        {summary.totalReviews > 0 ? (
          <>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>{summary.averageRating.toFixed(1)}</span>
            <span className="text-sm text-brand-500">({summary.totalReviews} verified reviews)</span>
          </>
        ) : <span className="text-sm text-brand-500">No verified reviews yet</span>}
      </div>
      {summary.reviews.length > 0 && (
        <div className="mt-4 space-y-3">
          {summary.reviews.slice(0, 3).map((review) => (
            <article key={`${review.customerName}-${review.createdAt}`} className="rounded-xl border border-brand-100 bg-white p-4">
              <p className="text-sm text-amber-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
              <p className="mt-2 text-sm text-brand-700">{review.comment}</p>
              <p className="mt-2 text-xs text-brand-500">{review.customerName} · {new Date(review.createdAt).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      )}
      {token && <form onSubmit={submitReview} className="mt-5 max-w-2xl rounded-2xl border border-brand-200 bg-white p-4"><h3 className="font-medium text-brand-900">Share your experience</h3><p className="mt-1 text-xs text-brand-600">Reviews are available after a paid order has been delivered.</p><div className="mt-3 flex gap-3"><label className="text-xs text-brand-600">Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block rounded-lg border border-brand-200 bg-brand-50 px-2 py-2 text-sm">{[5,4,3,2,1].map((value)=><option key={value} value={value}>{value} stars</option>)}</select></label><label className="min-w-0 flex-1 text-xs text-brand-600">Comment<textarea required minLength={5} maxLength={2000} value={comment} onChange={(event)=>setComment(event.target.value)} rows={2} placeholder="What did you think?" className="mt-1 block w-full rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm"/></label></div><button className="mt-3 rounded-full bg-brand-900 px-4 py-2 text-xs font-medium text-white">Post review</button>{message && <p role="status" className="mt-2 text-xs text-emerald-700">{message}</p>}{submitError && <p role="alert" className="mt-2 text-xs text-red-700">{submitError}</p>}</form>}
    </section>
  );
}
