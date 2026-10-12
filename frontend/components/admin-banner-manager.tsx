'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, LoaderCircle, Save } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

type ProductOption = { id: string; slug: string; name: string; image: string; shortDescription: string };
type BannerForm = { productId: string; image: string; eyebrow: string; title: string; description: string; buttonText: string };
type BannerResponse = BannerForm & { productSlug: string; productName: string };
const apiBase = getApiBaseUrl();

export function AdminBannerManager() {
  const [token, setToken] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState<BannerForm>({ productId: '', image: '', eyebrow: 'The featured collection', title: '', description: '', buttonText: 'Shop this design' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedToken = sessionStorage.getItem('fabbazaar-token');
    const savedUser = sessionStorage.getItem('fabbazaar-user');
    if (!savedToken || !savedUser) { setError('Administrator sign-in is required to manage the homepage banner.'); setLoading(false); return; }
    try {
      if ((JSON.parse(savedUser) as { role?: string }).role !== 'admin') { setError('Administrator access is required to manage the homepage banner.'); setLoading(false); return; }
    } catch { setError('Administrator sign-in is required to manage the homepage banner.'); setLoading(false); return; }
    setToken(savedToken);
    Promise.all([
      fetch(`${apiBase}/admin/products`, { headers: { Authorization: `Bearer ${savedToken}` } }),
      fetch(`${apiBase}/admin/banner`, { headers: { Authorization: `Bearer ${savedToken}` } })
    ]).then(async ([productsResponse, bannerResponse]) => {
      const [productsResult, bannerResult] = await Promise.all([productsResponse.json(), bannerResponse.json()]) as [
        { data?: ProductOption[]; error?: string }, { data?: BannerResponse | null; error?: string }
      ];
      if (!productsResponse.ok || !Array.isArray(productsResult.data)) throw new Error(productsResult.error || 'Unable to load catalogue products.');
      if (!bannerResponse.ok) throw new Error(bannerResult.error || 'Unable to load the saved homepage banner.');
      const catalogue = productsResult.data;
      setProducts(catalogue);
      const saved = bannerResult.data;
      if (saved) {
        setForm({ productId: saved.productId, image: saved.image, eyebrow: saved.eyebrow, title: saved.title, description: saved.description, buttonText: saved.buttonText });
      } else if (catalogue[0]) {
        setForm({ productId: catalogue[0].id, image: catalogue[0].image, eyebrow: 'The featured collection', title: catalogue[0].name, description: catalogue[0].shortDescription, buttonText: 'Shop this design' });
      }
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load homepage banner settings.'))
      .finally(() => setLoading(false));
  }, []);

  function chooseProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setForm((current) => ({ ...current, productId, image: product.image, title: product.name, description: product.shortDescription }));
    setError(''); setMessage('');
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, WebP or AVIF image up to 10 MB.'); return;
    }
    setUploading(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${apiBase}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type }, body: file });
      const result = await response.json() as { data?: { path: string }; error?: string };
      if (!response.ok || !result.data?.path) throw new Error(result.error || 'Unable to upload this banner image.');
      setForm((current) => ({ ...current, image: result.data!.path }));
      setMessage('Image uploaded. Save the banner to publish it.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to upload this banner image.'); }
    finally { setUploading(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const product = products.find((item) => item.id === form.productId);
    if (!product) { setError('Choose a product from the catalogue.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${apiBase}/admin/banner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, productSlug: product.slug, productName: product.name })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to save homepage banner settings.');
      setMessage('Homepage banner saved and published.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save homepage banner settings.'); }
    finally { setSaving(false); }
  }

  return <section className="admin-banner-manager mt-8 rounded-3xl border border-brand-200 bg-white p-5 shadow-soft sm:p-7">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-500">Homepage editor</p><h2 className="mt-1 font-serif text-2xl text-brand-900">Banner showcase</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-brand-600">Choose a product, customize the banner copy and image, then publish it to the homepage.</p></div>
      <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Homepage hero</span>
    </div>
    {loading ? <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-600">Loading banner settings…</p> : error && products.length === 0 ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : (
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium text-brand-800">Featured product
            <select value={form.productId} onChange={(event) => chooseProduct(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-3 py-3 text-brand-900">
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-brand-800">Banner image path or URL
            <input value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} required maxLength={2048} className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm text-brand-900" placeholder="/images/your-product.jpg" />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-200 px-4 py-2.5 text-sm font-medium text-brand-800 transition hover:border-brand-400">
            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{uploading ? 'Uploading…' : 'Upload a banner image'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadImage(event)} className="sr-only" disabled={uploading} />
          </label>
          <label className="block text-sm font-medium text-brand-800">Eyebrow text<input value={form.eyebrow} onChange={(event) => setForm((current) => ({ ...current, eyebrow: event.target.value }))} required maxLength={60} className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-3" /></label>
          <label className="block text-sm font-medium text-brand-800">Headline<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required maxLength={120} className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-3" /></label>
          <label className="block text-sm font-medium text-brand-800">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required maxLength={280} rows={3} className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-3" /></label>
          <label className="block text-sm font-medium text-brand-800">Button text<input value={form.buttonText} onChange={(event) => setForm((current) => ({ ...current, buttonText: event.target.value }))} required maxLength={40} className="mt-1.5 w-full rounded-xl border border-brand-200 px-3 py-3" /></label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
          <button type="submit" disabled={saving || loading || uploading || products.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Publishing…' : 'Save banner'}</button>
        </form>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Live preview</p>
          <div className="admin-banner-preview relative min-h-[300px] overflow-hidden rounded-2xl border border-brand-200 bg-brand-800 sm:min-h-[360px]">
            {form.image && <Image src={form.image} alt="Banner preview" fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/5" />
            <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-6 text-white sm:p-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">{form.eyebrow || 'Eyebrow text'}</p>
              <h3 className="mt-3 font-serif text-3xl italic leading-tight text-white sm:text-4xl">{form.title || 'Your banner headline'}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/90">{form.description || 'Your banner description'}</p>
              <span className="mt-5 inline-flex w-fit rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950">{form.buttonText || 'Button text'}</span>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-brand-500">The selected product determines the linked product detail page. The image and copy can be customized independently.</p>
        </div>
      </div>
    )}
  </section>;
}
