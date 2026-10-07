'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};
type AddressForm = Omit<Address, 'id'>;

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();
const emptyAddress: AddressForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false
};

export default function AccountAddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyAddress);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAddresses(token: string) {
    const response = await fetch(`${apiBaseUrl}/auth/me/addresses`, { headers: { Authorization: `Bearer ${token}` } });
    const result: unknown = await response.json();
    if (!response.ok || !result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
      const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load saved addresses';
      throw new Error(typeof detail === 'string' ? detail : 'Unable to load saved addresses');
    }
    setAddresses(result.data as Address[]);
  }

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadAddresses(token)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load saved addresses'))
      .finally(() => setLoading(false));
  }, [router]);

  function editAddress(address: Address) {
    const { id, ...values } = address;
    setEditingId(id);
    setForm(values);
    setError('');
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me/addresses${editingId ? `/${encodeURIComponent(editingId)}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to save address';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to save address');
      }
      await loadAddresses(token);
      setForm(emptyAddress);
      setEditingId('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save address');
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id: string) {
    if (!window.confirm('Remove this saved address?')) return;
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me/addresses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const result: unknown = await response.json();
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to remove address';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to remove address');
      }
      if (editingId === id) {
        setEditingId('');
        setForm(emptyAddress);
      }
      await loadAddresses(token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove address');
    }
  }

  async function makeDefault(address: Address) {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    const { id, ...values } = address;
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me/addresses/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...values, isDefault: true })
      });
      if (!response.ok) {
        const result: unknown = await response.json();
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to select default address';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to select default address');
      }
      await loadAddresses(token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to select default address');
    }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-brand-600">Loading saved addresses…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm text-brand-600 hover:text-brand-900">← Account</Link>
      <h1 className="mt-3 font-serif text-5xl text-brand-900">Saved addresses</h1>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl text-brand-900">{address.label}</h2>
                {address.isDefault && <span className="rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700">Default</span>}
              </div>
              <p className="mt-3 text-sm leading-6 text-brand-700">{address.fullName} · {address.phone}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city}, {address.state} {address.pincode}, {address.country}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => editAddress(address)} className="text-sm font-medium text-brand-500 hover:text-brand-900">Edit</button>
                {!address.isDefault && <button type="button" onClick={() => makeDefault(address)} className="text-sm font-medium text-brand-500 hover:text-brand-900">Make default</button>}
                <button type="button" onClick={() => removeAddress(address.id)} className="text-sm font-medium text-red-300 hover:text-red-200">Remove</button>
              </div>
            </article>
          ))}
          {addresses.length === 0 && <p className="rounded-2xl border border-brand-100 bg-white p-6 text-brand-600">No saved addresses yet.</p>}
        </section>

        <form onSubmit={saveAddress} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-soft">
          <h2 className="font-serif text-2xl text-brand-900">{editingId ? 'Edit address' : 'Add an address'}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([
              ['label', 'Address label'],
              ['fullName', 'Full name'],
              ['phone', 'Phone number'],
              ['line1', 'Address line 1'],
              ['line2', 'Address line 2 (optional)'],
              ['city', 'City'],
              ['state', 'State'],
              ['pincode', 'PIN code'],
              ['country', 'Country']
            ] as const).map(([field, label]) => (
              <input
                key={field}
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                required={field !== 'line2'}
                maxLength={field === 'line1' || field === 'line2' ? 160 : field === 'phone' ? 16 : field === 'pincode' ? 12 : 100}
                pattern={field === 'phone' ? '\\+?[1-9][0-9]{7,14}' : undefined}
                className={`rounded-xl border border-brand-200 p-3 ${field === 'line1' || field === 'line2' ? 'sm:col-span-2' : ''}`}
                placeholder={label}
                aria-label={label}
              />
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-brand-700">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
            Set as default address
          </label>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add address'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyAddress); }} className="rounded-full border border-brand-200 px-5 py-2.5 text-sm text-brand-800">Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
