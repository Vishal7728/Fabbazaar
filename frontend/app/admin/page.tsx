'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, LogOut, Search, ShieldCheck, Users } from 'lucide-react';
import { AdminOrdersPanel } from '@/components/admin-orders-panel';
import { AdminOverview } from '@/components/admin-overview';

type AdminUser = { name: string; email: string; role: 'admin' };
type CustomerRow = {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'deactivated';
  createdAt: string;
};
type CustomerPage = { data: CustomerRow[]; pagination: { page: number; total: number; totalPages: number } };
type CustomerOrder = { orderId: string; items: Array<{ name: string; quantity: number }>; total: number; paymentStatus: string; fulfillmentStatus: string; createdAt: string };

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<CustomerOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customerError, setCustomerError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    const serializedUser = sessionStorage.getItem('fabbazaar-user');
    if (!token || !serializedUser) {
      router.replace('/login');
      return;
    }

    try {
      const accountUser: unknown = JSON.parse(serializedUser);
      if (
        accountUser &&
        typeof accountUser === 'object' &&
        'name' in accountUser &&
        typeof accountUser.name === 'string' &&
        'email' in accountUser &&
        typeof accountUser.email === 'string' &&
        'role' in accountUser &&
        accountUser.role === 'admin'
      ) {
        setUser({ name: accountUser.name, email: accountUser.email, role: 'admin' });
        return;
      }
    } catch {
      sessionStorage.removeItem('fabbazaar-user');
    }

    sessionStorage.removeItem('fabbazaar-token');
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setCustomerError('');
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (search.trim()) query.set('q', search.trim());
        if (statusFilter) query.set('status', statusFilter);
        if (dateFrom) query.set('from', dateFrom);
        if (dateTo) query.set('to', dateTo);
        const response = await fetch(`${apiBaseUrl}/customers?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load customers';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load customers');
        }
        if (!result || typeof result !== 'object' || !('data' in result) || !('pagination' in result)) {
          throw new Error('The customer service returned an invalid response');
        }
        const customerPage = result as CustomerPage;
        setCustomers(customerPage.data);
        setTotal(customerPage.pagination.total);
        setTotalPages(customerPage.pagination.totalPages);
      } catch (error) {
        if (!controller.signal.aborted) {
          setCustomerError(error instanceof Error ? error.message : 'Unable to load customers');
          setCustomers([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [dateFrom, dateTo, page, refreshKey, router, search, statusFilter, user]);

  function signOut() {
    sessionStorage.removeItem('fabbazaar-token');
    sessionStorage.removeItem('fabbazaar-user');
    window.dispatchEvent(new Event('fabbazaar-auth-change'));
    window.location.assign('/login');
  }

  async function toggleStatus(customer: CustomerRow) {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    setCustomerError('');
    try {
      const response = await fetch(`${apiBaseUrl}/customers/${encodeURIComponent(customer.customerId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: customer.status === 'active' ? 'deactivated' : 'active' })
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to update customer status';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to update customer status');
      }
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setCustomerError(error instanceof Error ? error.message : 'Unable to update customer status');
    }
  }

  async function showCustomer(customer: CustomerRow) {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) return router.replace('/login');
    try {
      setDetailLoading(true);
      const [customerResponse, orderResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/customers/${encodeURIComponent(customer.customerId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/orders?search=${encodeURIComponent(customer.customerId)}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const [customerResult, orderResult]: unknown[] = await Promise.all([customerResponse, orderResponse].map((response) => response.json()));
      if (!customerResponse.ok) {
        const detail = customerResult && typeof customerResult === 'object' && 'error' in customerResult ? customerResult.error : 'Unable to load customer details';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to load customer details');
      }
      if (!orderResponse.ok) {
        const detail = orderResult && typeof orderResult === 'object' && 'error' in orderResult ? orderResult.error : 'Unable to load customer order history';
        throw new Error(typeof detail === 'string' ? detail : 'Unable to load customer order history');
      }
      if (
        !customerResult || typeof customerResult !== 'object' || !('data' in customerResult) ||
        !orderResult || typeof orderResult !== 'object' || !('data' in orderResult) || !Array.isArray(orderResult.data)
      ) throw new Error('Invalid customer details response');
      setSelected(customerResult.data as CustomerRow);
      setSelectedOrders(orderResult.data as CustomerOrder[]);
    } catch (error) {
      setCustomerError(error instanceof Error ? error.message : 'Unable to load customer details');
    } finally {
      setDetailLoading(false);
    }
  }

  if (!user) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-brand-600">Verifying administrator session…</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-5 rounded-[2rem] bg-[#263b33] px-6 py-8 text-white sm:px-10 sm:py-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#c8d6bf]">FabBazaar · workspace</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Store operations</h1>
          <p className="mt-3 text-sm text-[#e0e8dd]">Welcome, {user.name} <span className="mx-1 text-[#9eaf9f]">·</span> {user.email}</p>
        </div>
        <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:border-white hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2d5] bg-[#f4f5ee] p-5 sm:px-7">
        <div><p className="font-medium text-brand-900">Catalogue</p><p className="mt-1 text-sm text-brand-600">Create product listings, update prices and photos, or remove products.</p></div>
        <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-full bg-[#263b33] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#385246]">Manage listings <ArrowRight className="h-4 w-4"/></Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/promotions" className="rounded-2xl border border-brand-200 bg-white p-5 hover:border-brand-400"><p className="font-serif text-xl text-brand-900">Promotion codes</p><p className="mt-1 text-sm text-brand-600">Create checkout discounts and set expiry or minimum order values.</p></Link>
        <Link href="/admin/support" className="rounded-2xl border border-brand-200 bg-white p-5 hover:border-brand-400"><p className="font-serif text-xl text-brand-900">Support inbox</p><p className="mt-1 text-sm text-brand-600">Review customer enquiries, shipping issues and damaged parcel reports.</p></Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-[0.7fr_1.3fr]">
        <article className="rounded-3xl border border-brand-200 bg-white p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-600">Customers matching this view</p>
              <p className="mt-3 font-serif text-4xl text-brand-900">{loading ? '—' : total.toLocaleString('en-IN')}</p>
              <p className="mt-2 text-sm text-brand-500">Live MongoDB customer records</p>
            </div>
            <Users className="h-8 w-8 text-brand-400" />
          </div>
        </article>
        <article className="rounded-3xl border border-brand-200 bg-white p-7">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-brand-400" />
            <h2 className="font-serif text-2xl text-brand-900">Store operations</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-brand-600">
            Customer search, profile access, and account activation are connected to the database. Sales and order reporting will appear when persistent order records are configured.
          </p>
          <Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900">
            View storefront catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </div>

      <AdminOverview />

      <section className="mt-8 overflow-hidden rounded-3xl border border-brand-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 p-6">
          <div>
            <h2 className="font-serif text-2xl text-brand-900">Registered customers</h2>
            <p className="mt-1 text-sm text-brand-600">Search by customer ID, name, email, or phone number.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <label className="relative sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search customers"
                aria-label="Search customers"
                className="w-full rounded-xl border border-brand-200 py-2.5 pl-10 pr-4"
              />
            </label>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter customers by status" className="rounded-xl border border-brand-200 px-3 py-2.5">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
            <label className="flex items-center gap-2 text-xs text-brand-600">
              From
              <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="Registration date from" className="rounded-xl border border-brand-200 px-2 py-2" />
            </label>
            <label className="flex items-center gap-2 text-xs text-brand-600">
              To
              <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="Registration date to" className="rounded-xl border border-brand-200 px-2 py-2" />
            </label>
          </div>
        </div>

        {customerError && (
          <p role="alert" className="m-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{customerError}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f1f3ec] text-xs uppercase tracking-wide text-[#526659]">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Phone</th>
                <th className="px-6 py-4 font-medium">Registration date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {customers.map((customer) => (
                <tr key={customer.customerId} className="hover:bg-brand-50/60">
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => showCustomer(customer)} className="text-left">
                      <span className="font-mono text-xs text-brand-500">{customer.customerId}</span>
                      <span className="mt-1 block font-medium text-brand-900">{customer.name}</span>
                      <span className="mt-0.5 block text-brand-600">{customer.email}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-brand-700">{customer.phone || '—'}</td>
                  <td className="px-6 py-4 text-brand-700">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${customer.status === 'active' ? 'bg-emerald-950 text-emerald-200' : 'bg-red-950 text-red-200'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => toggleStatus(customer)} className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-800 hover:border-brand-400">
                      {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && !customerError && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-brand-600">No customers found. New registrations will appear here.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-brand-600">Loading customer records…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-brand-100 px-6 py-4">
          <p className="text-sm text-brand-600">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Previous page" className="rounded-lg border border-brand-200 p-2 text-brand-700 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page" className="rounded-lg border border-brand-200 p-2 text-brand-700 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div role="presentation" onClick={() => setSelected(null)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="customer-detail-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-3xl border border-brand-200 bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-brand-500">{selected.customerId}</p>
                <h2 id="customer-detail-title" className="mt-2 font-serif text-3xl text-brand-900">{selected.name}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close customer details" className="rounded-lg border border-brand-200 px-3 py-1 text-brand-700">Close</button>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div><dt className="text-brand-500">Email</dt><dd className="mt-1 text-brand-900">{selected.email}</dd></div>
              <div><dt className="text-brand-500">Phone</dt><dd className="mt-1 text-brand-900">{selected.phone || 'Not provided'}</dd></div>
              <div><dt className="text-brand-500">Status</dt><dd className="mt-1 text-brand-900">{selected.status}</dd></div>
              <div><dt className="text-brand-500">Registered</dt><dd className="mt-1 text-brand-900">{new Date(selected.createdAt).toLocaleString()}</dd></div>
            </dl>
            <div className="mt-6 border-t border-brand-100 pt-5">
              <h3 className="font-serif text-xl text-brand-900">Order history</h3>
              {detailLoading ? <p className="mt-3 text-sm text-brand-600">Loading customer orders…</p> : selectedOrders.length === 0 ? (
                <p className="mt-3 text-sm text-brand-600">No orders recorded for this customer.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {selectedOrders.map((order) => (
                    <li key={order.orderId} className="rounded-xl bg-brand-50 p-3 text-sm">
                      <div className="flex justify-between gap-3"><span className="font-mono text-xs text-brand-500">{order.orderId}</span><span className="font-medium text-brand-900">₹{(order.total / 100).toLocaleString('en-IN')}</span></div>
                      <p className="mt-1 capitalize text-xs text-brand-600">{order.paymentStatus} · {order.fulfillmentStatus} · {new Date(order.createdAt).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
      <AdminOrdersPanel />
    </div>
  );
}
