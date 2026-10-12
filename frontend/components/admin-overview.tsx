'use client';

import { useEffect, useState } from 'react';

type MetricData = {
  totalRevenue: number;
  todaysSales: number;
  monthlySales: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refunds: number;
  totalRegisteredCustomers: number;
  newCustomers: number;
  totalProducts: number;
  lowStockProducts: number | null;
  averageOrderValue: number;
};
type ChartPoint = { _id: string; amount?: number; count?: number };
type OverviewData = {
  metrics: MetricData;
  charts: {
    revenue: ChartPoint[];
    orders: ChartPoint[];
    bestSellers: Array<{ name: string; units: number; revenue: number }>;
    customerGrowth: ChartPoint[];
  };
};

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();
const money = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function TrendChart({ title, points, valueKey, format }: {
  title: string;
  points: ChartPoint[];
  valueKey: 'amount' | 'count';
  format: (value: number) => string;
}) {
  const max = Math.max(...points.map((point) => point[valueKey] ?? 0), 0);
  return (
      <section className="rounded-2xl border border-brand-200 bg-white p-6">
      <h3 className="font-serif text-xl text-brand-900">{title}</h3>
      {points.length === 0 || max === 0 ? (
        <p className="mt-6 rounded-xl bg-brand-50 p-5 text-sm text-brand-600">No database activity in this period.</p>
      ) : (
        <div className="mt-6 flex h-40 items-end gap-1.5" role="img" aria-label={title}>
          {points.map((point) => {
            const value = point[valueKey] ?? 0;
            const height = value === 0 ? 2 : Math.max(6, Math.round((value / max) * 100));
            return (
              <div key={point._id} title={`${point._id}: ${format(value)}`} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="w-full rounded-t-sm bg-brand-400/80" style={{ height: `${height}%` }} />
              </div>
            );
          })}
        </div>
      )}
      {points.length > 0 && (
        <div className="mt-3 flex justify-between text-[10px] text-brand-500">
          <span>{new Date(`${points[0]._id}T00:00:00`).toLocaleDateString()}</span>
          <span>{new Date(`${points[points.length - 1]._id}T00:00:00`).toLocaleDateString()}</span>
        </div>
      )}
    </section>
  );
}

export function AdminOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('fabbazaar-token');
    if (!token) {
      setError('Administrator sign-in is required to load store analytics.');
      return;
    }
    let active = true;
    const loadOverview = () => fetch(`${apiBaseUrl}/admin/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const detail = result && typeof result === 'object' && 'error' in result ? result.error : 'Unable to load store analytics';
          throw new Error(typeof detail === 'string' ? detail : 'Unable to load store analytics');
        }
        if (!result || typeof result !== 'object' || !('metrics' in result) || !('charts' in result)) {
          throw new Error('The analytics service returned an invalid response');
        }
        if (active) { setOverview(result as OverviewData); setError(''); }
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load store analytics'); });
    loadOverview();
    const timer = window.setInterval(loadOverview, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (error) {
    return <p role="alert" className="mt-8 rounded-xl border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">Analytics unavailable: {error}</p>;
  }
  if (!overview) {
    return <p className="mt-8 rounded-xl border border-brand-100 bg-white px-5 py-4 text-sm text-brand-600">Loading database-backed store metrics…</p>;
  }

  const metricCards: Array<{ label: string; value: string }> = [
    { label: 'Total revenue', value: money(overview.metrics.totalRevenue) },
    { label: "Today's sales", value: money(overview.metrics.todaysSales) },
    { label: 'This month', value: money(overview.metrics.monthlySales) },
    { label: 'Average order value', value: money(overview.metrics.averageOrderValue) },
    { label: 'Total orders', value: overview.metrics.totalOrders.toLocaleString('en-IN') },
    { label: 'Pending', value: overview.metrics.pendingOrders.toLocaleString('en-IN') },
    { label: 'Processing', value: overview.metrics.processingOrders.toLocaleString('en-IN') },
    { label: 'Dispatched', value: overview.metrics.dispatchedOrders.toLocaleString('en-IN') },
    { label: 'Delivered', value: overview.metrics.deliveredOrders.toLocaleString('en-IN') },
    { label: 'Cancelled', value: overview.metrics.cancelledOrders.toLocaleString('en-IN') },
    { label: 'Refunds', value: overview.metrics.refunds.toLocaleString('en-IN') },
    { label: 'Registered customers', value: overview.metrics.totalRegisteredCustomers.toLocaleString('en-IN') },
    { label: 'New this month', value: overview.metrics.newCustomers.toLocaleString('en-IN') },
    { label: 'Catalog products', value: overview.metrics.totalProducts.toLocaleString('en-IN') },
    { label: 'Low-stock products', value: overview.metrics.lowStockProducts === null ? 'Not tracked' : overview.metrics.lowStockProducts.toLocaleString('en-IN') }
  ];

  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="font-serif text-2xl text-brand-900">Store overview</h2>
        <p className="mt-1 text-sm text-brand-600">Sales and customer metrics from persisted MongoDB records.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metricCards.slice(0, 5).map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-brand-200 bg-white p-5">
            <p className="text-xs text-brand-500">{metric.label}</p>
            <p className="mt-2 font-serif text-2xl text-brand-900">{metric.value}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TrendChart title="Revenue · 30 days" points={overview.charts.revenue} valueKey="amount" format={money} />
        <TrendChart title="Order trend · 30 days" points={overview.charts.orders} valueKey="count" format={(value) => `${value} orders`} />
        <TrendChart title="Customer growth · 30 days" points={overview.charts.customerGrowth} valueKey="count" format={(value) => `${value} customers`} />
        <section className="rounded-2xl border border-brand-100 bg-white p-6">
          <h3 className="font-serif text-xl text-brand-900">Sales mix · best sellers</h3>
          {overview.charts.bestSellers.length === 0 ? (
            <p className="mt-6 rounded-xl bg-brand-50 p-5 text-sm text-brand-600">No paid product sales recorded yet.</p>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: `conic-gradient(${overview.charts.bestSellers.map((product, index, all) => { const total = all.reduce((sum, item) => sum + item.revenue, 0) || 1; const start = all.slice(0, index).reduce((sum, item) => sum + item.revenue, 0) / total * 100; const end = start + product.revenue / total * 100; return `${['#244638','#78917e','#a8b9a0','#b9684d','#d9c8ab'][index % 5]} ${start}% ${end}%`; }).join(', ')})` }}><div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center"><span className="text-[10px] uppercase tracking-wide text-brand-500">Top products</span><span className="mt-1 text-xl font-semibold text-brand-900">{overview.charts.bestSellers.length}</span></div></div>
            <ol className="w-full divide-y divide-brand-100">
              {overview.charts.bestSellers.map((product, index) => (
                <li key={product.name} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                  <span className="text-brand-700"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ['#244638','#78917e','#a8b9a0','#b9684d','#d9c8ab'][index % 5] }}/>{product.name} <span className="text-brand-500">· {product.units} sold</span></span>
                  <span className="shrink-0 text-brand-900">{money(product.revenue)}</span>
                </li>
              ))}
            </ol>
            </div>
          )}
        </section>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-xs text-brand-600">{metricCards.slice(5).map((metric)=><span key={metric.label}><span className="text-brand-500">{metric.label}</span> <strong className="ml-1 text-brand-900">{metric.value}</strong></span>)}</div>
      {overview.metrics.lowStockProducts === null && <p className="mt-3 text-xs text-brand-500">Inventory levels are not configured in the current product catalog.</p>}
    </section>
  );
}
