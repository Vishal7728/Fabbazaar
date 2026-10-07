'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
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
    </section>
  );
}
