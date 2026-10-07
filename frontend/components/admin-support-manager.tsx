'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Mail } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

type SupportTicket = { ticketId: string; name: string; email: string; phone: string; topic: string; orderId: string; message: string; status: 'open' | 'resolved'; createdAt: string };

export function AdminSupportManager() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async (auth: string) => {
    const response = await fetch(`${getApiBaseUrl()}/support/tickets`, { headers: { Authorization: `Bearer ${auth}` } });
    const result = await response.json() as { data?: SupportTicket[]; error?: string };
    if (!response.ok || !result.data) throw new Error(result.error || 'Unable to load support requests.');
    setTickets(result.data);
  }, []);
  useEffect(() => {
    const auth = sessionStorage.getItem('fabbazaar-token');
    try { if (!auth || JSON.parse(sessionStorage.getItem('fabbazaar-user') || 'null')?.role !== 'admin') { router.replace('/login'); return; } }
    catch { router.replace('/login'); return; }
    setToken(auth); load(auth).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load support requests.'));
  }, [load, router]);
  async function update(ticket: SupportTicket) {
    const status = ticket.status === 'open' ? 'resolved' : 'open';
    const response = await fetch(`${getApiBaseUrl()}/support/tickets/${encodeURIComponent(ticket.ticketId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
    if (!response.ok) { setError('Unable to update this support request.'); return; }
    setTickets((items) => items.map((item) => item.ticketId === ticket.ticketId ? { ...item, status } : item));
  }
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10"><a href="/admin" className="text-sm text-brand-600 hover:text-brand-900">← Admin dashboard</a><p className="mt-5 text-xs uppercase tracking-[0.25em] text-brand-500">Customer care · around the clock</p><h1 className="mt-2 font-serif text-4xl text-brand-900">Support inbox</h1><p className="mt-2 text-sm text-brand-600">Customer questions and issue reports saved from the 24×7 support page.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}<div className="mt-6 space-y-4">{tickets.map((ticket) => <article key={ticket.ticketId} className="rounded-2xl border border-brand-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs text-brand-500">{ticket.ticketId} · {new Date(ticket.createdAt).toLocaleString()}</p><h2 className="mt-2 font-serif text-xl text-brand-900">{ticket.name} <span className="font-sans text-sm font-normal text-brand-600">· {ticket.topic}</span></h2><p className="mt-1 text-sm text-brand-700">{ticket.email}{ticket.phone ? ` · ${ticket.phone}` : ''}{ticket.orderId ? ` · Order ${ticket.orderId}` : ''}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${ticket.status === 'open' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>{ticket.status}</span></div><p className="mt-4 whitespace-pre-wrap rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-800">{ticket.message}</p><div className="mt-4 flex flex-wrap gap-3"><a href={`mailto:${encodeURIComponent(ticket.email)}?subject=${encodeURIComponent(`FabBazaar support ${ticket.ticketId}`)}&body=${encodeURIComponent(`Hello ${ticket.name},\n\nRegarding your request ${ticket.ticketId}:\n`)}`} className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm text-brand-800"><Mail className="h-4 w-4"/> Reply by email</a><button type="button" onClick={() => void update(ticket)} className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm text-white">{ticket.status === 'open' ? <><Check className="h-4 w-4"/> Mark resolved</> : 'Reopen'}</button></div></article>)}{tickets.length === 0 && <p className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-brand-600">No support requests yet.</p>}</div></main>;
}
