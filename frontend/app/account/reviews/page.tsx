'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { products } from '@/lib/products';

type Review = {
  productId: string;
  productSlug: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function AccountReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews(token: string) {
    const response = await fetch(`${apiBaseUrl}/reviews/me`, { headers: { Authorization: `Bearer ${token}` } });
    const result: unknown = await response.json();
    if (!response.ok || !result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
      const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load reviews';
      throw new Error(typeof detail === 'string' ? detail : 'Unable to load reviews');
    }
    setReviews(result.data as Review[]);
  }

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadReviews(token)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load reviews'))
      .finally(() => setLoading(false));
  }, [router]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token || !productId) return;
    const product = products.find((entry) => entry.id === productId);
    if (!product) return setError('Choose a valid product.');
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/reviews/${encodeURIComponent(product.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment })
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to submit review';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to submit review');
      }
      await loadReviews(token);
      setComment('');
      setProductId('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm text-brand-600 hover:text-brand-900">← Account</Link>
      <h1 className="mt-3 font-serif text-5xl text-brand-900">Your reviews</h1>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
      <form onSubmit={submitReview} className="mt-8 rounded-2xl border border-brand-100 bg-white p-6">
        <h2 className="font-serif text-2xl text-brand-900">Review a delivered purchase</h2>
        <p className="mt-2 text-sm text-brand-600">Only products from paid, delivered orders can be reviewed.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
          <select value={productId} onChange={(event) => setProductId(event.target.value)} required aria-label="Product to review" className="rounded-xl border border-brand-200 p-3">
            <option value="">Select a product</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <select value={rating} onChange={(event) => setRating(Number(event.target.value))} aria-label="Rating" className="rounded-xl border border-brand-200 p-3">
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5 stars</option>)}
          </select>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} required minLength={5} maxLength={2000} rows={4} placeholder="Share your experience" aria-label="Review comment" className="rounded-xl border border-brand-200 p-3 sm:col-span-2" />
        </div>
        <button type="submit" disabled={submitting} className="mt-4 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit review'}</button>
      </form>
      <section className="mt-8 space-y-4">
        <h2 className="font-serif text-2xl text-brand-900">Review history</h2>
        {loading ? <p className="text-brand-600">Loading your reviews…</p> : reviews.length === 0 && !error ? (
          <p className="rounded-2xl border border-brand-100 bg-white p-6 text-brand-600">You have not posted any reviews yet.</p>
        ) : reviews.map((review) => (
          <article key={`${review.productId}-${review.createdAt}`} className="rounded-2xl border border-brand-100 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Link href={`/products/${review.productSlug}`} className="font-serif text-xl text-brand-900 hover:text-brand-500">{review.productName}</Link>
              <span className="text-sm text-amber-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-brand-700">{review.comment}</p>
            <p className="mt-3 text-xs text-brand-500">{new Date(review.createdAt).toLocaleDateString()}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
