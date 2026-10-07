'use client';

import { ChangeEvent, DragEvent, FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { categories } from '@/lib/categories';
import type { Product } from '@/lib/products';
import { getApiBaseUrl } from '@/lib/api';

const collectionNames = ['Rivaaz', 'Jaipuri Collection', 'Bazaar Exclusive'] as const;
type Listing = Product & { stock?: number; collection?: typeof collectionNames[number]; newArrival?: boolean; colors?: string[]; sizes?: string[] };
type EditorForm = { id?: string; name: string; slug: string; category: string; collection: typeof collectionNames[number]; price: string; originalPrice: string; stock: string; images: string[]; shortDescription: string; description: string; tags: string };
const emptyForm: EditorForm = { name: '', slug: '', category: 'Bedsheet', collection: 'Bazaar Exclusive', price: '', originalPrice: '', stock: '0', images: [], shortDescription: '', description: '', tags: '' };
const apiBase = getApiBaseUrl();
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function AdminProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(productId));
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('fabbazaar-token');
    const userText = sessionStorage.getItem('fabbazaar-user');
    if (!savedToken || !userText) { router.replace('/login'); return; }
    try { if ((JSON.parse(userText) as { role?: string }).role !== 'admin') { router.replace('/login'); return; } }
    catch { router.replace('/login'); return; }
    setToken(savedToken);
    if (!productId) return;
    fetch(`${apiBase}/admin/products/${encodeURIComponent(productId)}`, { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(async (response) => {
        const result = await response.json() as { data?: Listing; error?: string };
        if (!response.ok || !result.data) throw new Error(result.error || 'Unable to load this product.');
        const product = result.data;
        setForm({ id: product.id, name: product.name, slug: product.slug, category: product.category, collection: product.collection ?? 'Bazaar Exclusive', price: String(product.price), originalPrice: product.originalPrice ? String(product.originalPrice) : '', stock: String(product.stock ?? 0), images: [...new Set([product.image, ...(product.gallery ?? [])])].slice(0, 6), shortDescription: product.shortDescription, description: product.description, tags: product.tags.join(', ') });
      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load this product.')).finally(() => setLoading(false));
  }, [productId, router]);

  function update<K extends keyof EditorForm>(key: K, value: EditorForm[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function addImages(files: FileList | File[]) {
    const selected = Array.from(files);
    if (form.images.length + selected.length > 6) { setError('A product can have up to six images. Remove one before adding more.'); return; }
    const invalid = selected.find((file) => !imageTypes.includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0);
    if (invalid) { setError(`${invalid.name}: use JPEG, PNG, WebP or AVIF, up to 10 MB per image.`); return; }
    setError('');
    setBusy(true);
    Promise.all(selected.map(async (file) => {
      const response = await fetch(`${apiBase}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type }, body: file });
      const result = await response.json() as { data?: { path: string }; error?: string };
      if (!response.ok || !result.data?.path) throw new Error(result.error || `Unable to upload ${file.name}.`);
      return result.data.path;
    })).then((uploaded) => setForm((current) => ({ ...current, images: [...current.images, ...uploaded].slice(0, 6) })))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Image upload failed.'))
      .finally(() => setBusy(false));
  }
  function onFileChange(event: ChangeEvent<HTMLInputElement>) { if (event.target.files?.length) addImages(event.target.files); event.target.value = ''; }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragActive(false); if (event.dataTransfer.files.length) addImages(event.dataTransfer.files); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.images.length === 0) { setError('Add at least one product image.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { slug: form.slug, name: form.name, category: form.category, collection: form.collection, price: Number(form.price), ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}), stock: Number(form.stock), image: form.images[0], gallery: form.images, shortDescription: form.shortDescription, description: form.description, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), featured: false };
      const response = await fetch(`${apiBase}/admin/products${form.id ? `/${encodeURIComponent(form.id)}` : ''}`, { method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to save this listing.');
      router.push('/admin/products'); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save this listing.'); }
    finally { setBusy(false); }
  }

  if (loading) return <p className="mx-auto max-w-5xl px-5 py-20 text-center text-brand-600">Loading listing…</p>;
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
    <Link href="/admin/products" className="text-sm font-medium text-brand-600 hover:text-brand-900">← All listings</Link>
    <p className="mt-5 text-xs uppercase tracking-[0.25em] text-brand-500">Product catalogue</p><h1 className="mt-2 font-serif text-4xl text-brand-900">{form.id ? 'Edit product listing' : 'Create a listing'}</h1><p className="mt-2 text-sm text-brand-600">Manage up to six product photos and keep each collection easy to find.</p>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={save} className="mt-7 space-y-7 rounded-3xl border border-brand-200 bg-white p-5 shadow-soft sm:p-8">
      <section><h2 className="font-serif text-2xl text-brand-900">Product photos</h2><p className="mt-1 text-sm text-brand-600">Drop files here or browse. JPEG, PNG, WebP, AVIF · maximum 10 MB each · up to 6 photos.</p>
        <div onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop} className={`mt-4 flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center ${dragActive ? 'border-brand-600 bg-brand-100' : 'border-brand-300 bg-brand-50'}`}>
          {busy && form.images.length < 6 ? <LoaderCircle className="h-7 w-7 animate-spin text-brand-600"/> : <ImagePlus className="h-7 w-7 text-brand-500"/>}
          <p className="mt-2 text-sm text-brand-700">Drag images here</p>
          <label className="mt-2 cursor-pointer rounded-full border border-brand-300 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-white">Choose images<input type="file" accept={imageTypes.join(',')} multiple className="sr-only" onChange={onFileChange} disabled={busy || form.images.length >= 6}/></label>
          <p className="mt-2 text-xs text-brand-500">{form.images.length}/6 images</p>
        </div>
        {form.images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{form.images.map((src, index) => <figure key={`${src}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-brand-200 bg-brand-50"><Image src={src} alt={`Product photo ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 50vw, 33vw" className="object-cover"/><span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-brand-900">{index === 0 ? 'Main image' : `Image ${index + 1}`}</span><button type="button" onClick={() => update('images', form.images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-700 shadow" aria-label={`Remove image ${index + 1}`}><Trash2 className="h-4 w-4"/></button></figure>)}</div>}
      </section>
      <section><h2 className="font-serif text-2xl text-brand-900">Listing details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-brand-700">Product name<input required minLength={2} maxLength={140} value={form.name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, name, ...(!current.id ? { slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) })); }} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700">Listing slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => update('slug', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700">Category<select value={form.category} onChange={(event) => update('category', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">{categories.map(({ name }) => <option key={name}>{name}</option>)}</select></label>
        <label className="text-sm font-medium text-brand-700">Collection<select value={form.collection} onChange={(event) => update('collection', event.target.value as EditorForm['collection'])} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">{collectionNames.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="text-sm font-medium text-brand-700">Selling price (₹)<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700">Original price (₹)<input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(event) => update('originalPrice', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700">Stock quantity<input required type="number" min="0" step="1" value={form.stock} onChange={(event) => update('stock', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700 sm:col-span-2">Short description<input required maxLength={240} value={form.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700 sm:col-span-2">Product description<textarea required minLength={5} maxLength={4000} rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
        <label className="text-sm font-medium text-brand-700 sm:col-span-2">Search tags <span className="font-normal text-brand-500">(separate with commas)</span><input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="floral, cotton, blue" className="mt-1.5 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5"/></label>
      </div></section>
      <div className="flex flex-wrap justify-end gap-3 border-t border-brand-100 pt-5"><Link href="/admin/products" className="rounded-full border border-brand-200 px-5 py-2.5 text-sm font-medium text-brand-700">Cancel</Link><button type="submit" disabled={busy} className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{busy ? 'Saving…' : form.id ? 'Save changes' : 'Publish listing'}</button></div>
    </form>
  </main>;
}
