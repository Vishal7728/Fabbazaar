'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Copy, LogOut, UserRound } from 'lucide-react';

type AccountUser = {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};
type RecentOrder = { orderId: string; total: number; paymentStatus: string; fulfillmentStatus: string; createdAt: string };
type OrderListResponse = { data: RecentOrder[] };

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [accountCounts, setAccountCounts] = useState({ wishlist: 0, addresses: 0, reviews: 0 });

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }

    let active = true;
    fetch(`${apiBaseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load account details';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load account details');
        }
        if (!result || typeof result !== 'object' || !('user' in result)) {
          throw new Error('The account service returned an invalid response');
        }
        const account = result.user as AccountUser;
        if (account.role !== 'customer' || typeof account.name !== 'string' || typeof account.email !== 'string') {
          throw new Error('The account service returned invalid customer details');
        }
        if (!active) return;
        setUser(account);
        setName(account.name);
        sessionStorage.setItem('fabbazaar-user', JSON.stringify(account));
        const headers = { Authorization: `Bearer ${token}` };
        const results = await Promise.all([
          fetch(`${apiBaseUrl}/orders?limit=3`, { headers }),
          fetch(`${apiBaseUrl}/auth/me/addresses`, { headers }),
          fetch(`${apiBaseUrl}/auth/me/wishlist`, { headers }),
          fetch(`${apiBaseUrl}/reviews/me`, { headers })
        ]);
        const [orderResult, addressResult, wishlistResult, reviewResult] = await Promise.all(results.map(async (response) => {
          const body: unknown = await response.json();
          if (!response.ok) {
            const detail = body && typeof body === 'object' && 'error' in body ? body.error : 'Unable to load account activity';
            throw new Error(typeof detail === 'string' ? detail : 'Unable to load account activity');
          }
          return body;
        }));
        if (
          !orderResult || typeof orderResult !== 'object' || !('data' in orderResult) || !Array.isArray(orderResult.data) ||
          !addressResult || typeof addressResult !== 'object' || !('data' in addressResult) || !Array.isArray(addressResult.data) ||
          !wishlistResult || typeof wishlistResult !== 'object' || !('data' in wishlistResult) || !Array.isArray(wishlistResult.data) ||
          !reviewResult || typeof reviewResult !== 'object' || !('data' in reviewResult) || !Array.isArray(reviewResult.data)
        ) {
          throw new Error('The account activity service returned invalid data');
        }
        if (!active) return;
        setRecentOrders((orderResult as OrderListResponse).data.slice(0, 3));
        setAccountCounts({
          wishlist: wishlistResult.data.length,
          addresses: addressResult.data.length,
          reviews: reviewResult.data.length
        });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load account details');
      });

    return () => { active = false; };
  }, [router]);

  function signOut() {
    sessionStorage.removeItem('fabbazaar-token');
    sessionStorage.removeItem('fabbazaar-user');
    window.dispatchEvent(new Event('fabbazaar-auth-change'));
    window.location.assign('/login');
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== 'object' || !('user' in result)) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to update your profile';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to update your profile');
      }
      const updated = result.user as AccountUser;
      setUser(updated);
      setName(updated.name);
      sessionStorage.setItem('fabbazaar-user', JSON.stringify(updated));
      setMessage('Your profile has been updated.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update your profile');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!response.ok) {
        const result: unknown = await response.json();
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to change your password';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to change your password');
      }
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Your password has been changed.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to change your password');
    } finally {
      setSaving(false);
    }
  }

  async function requestAccountDeletion() {
    if (!window.confirm('Submit a request to delete your FabBazaar account?')) return;
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me/delete-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to submit your deletion request';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to submit your deletion request');
      }
      setDeletionRequested(true);
      setMessage('Your account deletion request has been submitted.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit your deletion request');
    }
  }

  if (error && !user) {
    return <div role="alert" className="mx-auto max-w-5xl px-4 py-24 text-center text-red-300">{error}</div>;
  }
  if (!user) {
    return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-brand-600">Opening your account…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-brand-100 bg-white p-8 shadow-soft sm:p-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-500">Customer account</p>
              <h1 className="mt-1 font-serif text-4xl text-brand-900">Welcome, {user.name}</h1>
            </div>
          </div>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-5 py-2.5 text-sm font-medium text-brand-800 hover:border-brand-400">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-50 p-6">
            <p className="text-sm font-medium text-brand-700">FabBazaar customer ID</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-lg text-brand-900">{user.customerId || 'Not assigned'}</p>
              {user.customerId && (
                <button
                  type="button"
                  aria-label="Copy customer ID"
                  title="Copy customer ID"
                  onClick={() => navigator.clipboard.writeText(user.customerId || '').then(() => setMessage('Customer ID copied.')).catch(() => setError('Could not copy the customer ID.'))}
                  className="rounded-lg border border-brand-200 p-2 text-brand-700 hover:border-brand-400"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-brand-500">Your customer ID is an identifier, not a sign-in credential.</p>
          </div>
          <div className="rounded-2xl bg-brand-50 p-6">
            <p className="text-sm font-medium text-brand-700">Contact details</p>
            <p className="mt-2 text-brand-900">{user.email}</p>
            <p className="mt-1 text-brand-700">{user.phone || 'Phone not provided'}</p>
          </div>
        </div>

        {(error || message) && (
          <p role={error ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-emerald-900 bg-emerald-950/30 text-emerald-200'}`}>
            {error || message}
          </p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <form id="profile" onSubmit={saveProfile} className="rounded-2xl border border-brand-100 p-6">
            <h2 className="font-serif text-2xl text-brand-900">Profile</h2>
            <label htmlFor="profile-name" className="mb-2 mt-5 block text-sm font-medium text-brand-800">Full name</label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required className="w-full rounded-xl border border-brand-200 px-4 py-3" />
            <p className="mt-3 text-xs text-brand-500">Phone number changes require verification and are not enabled until a verification service is configured.</p>
            <button type="submit" disabled={saving} className="mt-5 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              Save profile
            </button>
          </form>

          <form id="security" onSubmit={changePassword} className="rounded-2xl border border-brand-100 p-6">
            <h2 className="font-serif text-2xl text-brand-900">Security</h2>
            <label htmlFor="current-password" className="mb-2 mt-5 block text-sm font-medium text-brand-800">Current password</label>
            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="w-full rounded-xl border border-brand-200 px-4 py-3" />
            <label htmlFor="new-password" className="mb-2 mt-4 block text-sm font-medium text-brand-800">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={128} required className="w-full rounded-xl border border-brand-200 px-4 py-3" />
            <button type="submit" disabled={saving} className="mt-5 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              Change password
            </button>
          </form>
        </div>

        <section className="mt-8 rounded-2xl border border-brand-100 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-brand-900">Recent orders</h2>
              <p className="mt-1 text-sm text-brand-600">Your latest order and payment updates.</p>
            </div>
            <Link href="/account/orders" className="text-sm font-medium text-brand-500 hover:text-brand-900">All orders</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-5 text-sm text-brand-600">No recent orders. Your completed orders will appear here.</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-100">
              {recentOrders.map((order) => (
                <li key={order.orderId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/account/orders/${encodeURIComponent(order.orderId)}`} className="font-mono text-sm text-brand-700 hover:text-brand-500">{order.orderId}</Link>
                    <p className="mt-1 text-xs capitalize text-brand-500">{order.fulfillmentStatus} · payment {order.paymentStatus}</p>
                  </div>
                  <span className="font-medium text-brand-900">₹{(order.total / 100).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-brand-100 pt-4 text-center">
            <Link href="/account/wishlist" className="rounded-xl bg-brand-50 p-3 hover:bg-brand-100"><span className="block font-serif text-xl text-brand-900">{accountCounts.wishlist}</span><span className="mt-1 block text-xs text-brand-500">Wishlist</span></Link>
            <Link href="/account/addresses" className="rounded-xl bg-brand-50 p-3 hover:bg-brand-100"><span className="block font-serif text-xl text-brand-900">{accountCounts.addresses}</span><span className="mt-1 block text-xs text-brand-500">Addresses</span></Link>
            <Link href="/account/reviews" className="rounded-xl bg-brand-50 p-3 hover:bg-brand-100"><span className="block font-serif text-xl text-brand-900">{accountCounts.reviews}</span><span className="mt-1 block text-xs text-brand-500">Reviews</span></Link>
          </div>
        </section>

        <Link href="/account/orders" className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 px-6 py-3 font-medium text-brand-900 hover:border-brand-400">
          View your orders <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/account/addresses" className="ml-3 mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 px-6 py-3 font-medium text-brand-900 hover:border-brand-400">
          Manage saved addresses <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/account/wishlist" className="ml-3 mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 px-6 py-3 font-medium text-brand-900 hover:border-brand-400">
          View wishlist <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/account/reviews" className="ml-3 mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 px-6 py-3 font-medium text-brand-900 hover:border-brand-400">
          Review history <ArrowRight className="h-4 w-4" />
        </Link>

        <Link href="/products" className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 px-6 py-3 font-medium text-brand-900 hover:border-brand-400">
          Browse the collection <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="mt-10 border-t border-brand-100 pt-6">
          <button type="button" disabled={deletionRequested} onClick={requestAccountDeletion} className="text-sm text-red-300 underline underline-offset-4 disabled:opacity-50">
            {deletionRequested ? 'Account deletion requested' : 'Request account deletion'}
          </button>
          <p className="mt-2 text-xs text-brand-500">A request is recorded for review; your account is not immediately erased.</p>
        </div>
      </div>
    </div>
  );
}
