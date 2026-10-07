'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';

type Promotion = { _id: string; code: string; type: 'percent' | 'fixed'; value: number; minimumOrder: number; maximumDiscount: number | null; expiresAt: string | null; active: boolean };
type FormState = { code: string; type: 'percent' | 'fixed'; value: string; minimumOrder: string; maximumDiscount: string; expiresAt: string };
const blank: FormState = { code: '', type: 'percent', value: '', minimumOrder: '0', maximumDiscount: '', expiresAt: '' };

export function AdminPromotionsManager() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<FormState>(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (auth: string) => {
    const response = await fetch(`${getApiBaseUrl()}/promotions/admin`, { headers: { Authorization: `Bearer ${auth}` } });
    const result = await response.json() as { data?: Promotion[]; error?: string };
    if (!response.ok || !result.data) throw new Error(result.error || 'Unable to load promotion codes.');
    setPromotions(result.data);
  }, []);
  useEffect(() => {
    const auth = sessionStorage.getItem('fabbazaar-token');
    const user = sessionStorage.getItem('fabbazaar-user');
    if (!auth || !user || JSON.parse(user).role !== 'admin') { router.replace('/login'); return; }
    setToken(auth); load(auth).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load promotions.'));
  }, [load, router]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${getApiBaseUrl()}/promotions/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: form.code, type: form.type, value: Number(form.value), minimumOrder: Number(form.minimumOrder), maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : null, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null, active: true }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to create this promotion.');
      setForm(blank); await load(token);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create this promotion.'); }
    finally { setBusy(false); }
  }
  async function remove(promotion: Promotion) {
    if (!window.confirm(`Delete promotion ${promotion.code}?`)) return;
    const response = await fetch(`${getApiBaseUrl()}/promotions/admin/${promotion._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setPromotions((items) => items.filter((item) => item._id !== promotion._id));
    else setError('Unable to delete this promotion.');
  }
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
    <a href="/admin" className="text-sm text-brand-600 hover:text-brand-900">← Admin dashboard</a><p className="mt-5 text-xs uppercase tracking-[0.25em] text-brand-500">Checkout offers</p><h1 className="mt-2 font-serif text-4xl text-brand-900">Promotion codes</h1><p className="mt-2 text-sm text-brand-600">Create discounts that customers can redeem at checkout.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={create} className="mt-6 grid gap-4 rounded-3xl border border-brand-200 bg-white p-5 sm:grid-cols-2 sm:p-7">
      <label className="text-sm text-brand-700">Code<input required minLength={3} maxLength={32} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="JAIPUR10" className="mt-1 block w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 uppercase"/></label>
      <label className="text-sm text-brand-700">Discount type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as FormState['type'] })} className="mt-1 block w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"><option value="percent">Percent</option><option value="fixed">Fixed amount (₹)</option></select></label>
      <label className="text-sm text-brand-700">Discount {form.type === 'percent' ? '(%)' : '(₹)'}<input required type="number" min="1" max={form.type === 'percent' ? 90 : undefined} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="mt-1 block w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
      <label className="text-sm text-brand-700">Minimum order (₹)<input type="number" min="0" value={form.minimumOrder} onChange={(event) => setForm({ ...form, minimumOrder: event.target.value })} className="mt-1 block w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
      {form.type === 'percent' && <label className="text-sm text-brand-700">Maximum discount (₹, optional)<input type="number" min="1" value={form.maximumDiscount} onChange={(event) => setForm({ ...form, maximumDiscount: event.target.value })} className="mt-1 block w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>}
      <label className="text-sm text-brand-700">Expires (optional)<input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="mt-1 block w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
      <div className="sm:col-span-2"><button disabled={busy} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Create promotion code'}</button></div>
    </form>
    <section className="mt-7 overflow-hidden rounded-3xl border border-brand-200 bg-white"><div className="border-b border-brand-100 p-5"><h2 className="font-serif text-2xl text-brand-900">Current codes</h2></div><div className="divide-y divide-brand-100">{promotions.map((offer) => <article key={offer._id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-mono text-lg font-bold tracking-wider text-brand-900">{offer.code}</p><p className="mt-1 text-sm text-brand-600">{offer.type === 'percent' ? `${offer.value}% off` : `₹${offer.value} off`} · Minimum ₹{offer.minimumOrder}{offer.maximumDiscount ? ` · Cap ₹${offer.maximumDiscount}` : ''}{offer.expiresAt ? ` · Expires ${new Date(offer.expiresAt).toLocaleDateString()}` : ''}</p></div><button type="button" onClick={() => remove(offer)} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50">Delete</button></article>)}{promotions.length === 0 && <p className="p-8 text-center text-sm text-brand-600">No promotion codes yet.</p>}</div></section>
  </main>;
}
