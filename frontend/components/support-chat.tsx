'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Headset, Send, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

type Topic = 'product' | 'shipping' | 'cancellation' | 'damaged' | 'other';
const topics: Array<{ value: Topic; label: string }> = [
  { value: 'product', label: 'Product question' },
  { value: 'shipping', label: 'Shipping or delivery' },
  { value: 'cancellation', label: 'Cancellation or return' },
  { value: 'damaged', label: 'Damaged or faulty parcel' },
  { value: 'other', label: 'Something else' }
];
const quickReplies: Record<Topic, string> = {
  product: 'Tell us which product or collection you’re looking at. Our team can help with fabric, size, care and availability.',
  shipping: 'Share your order number and PIN code so the support team can check delivery progress.',
  cancellation: 'Please share your order number. We’ll review its current status and explain the available cancellation or return options.',
  damaged: 'We’re sorry this happened. Please include your order number and describe the issue. Keep the packaging until our team replies.',
  other: 'Tell us what you need help with and we’ll pass your message to the FabBazaar team.'
};

export function SupportChat() {
  const [topic, setTopic] = useState<Topic>('other');
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('Choose a topic or ask a question. I can help with product details, shipping, cancellations and damaged parcels, any time.');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [ticket, setTicket] = useState<{ id: string; emailSent: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.toLowerCase();
    const found = text.includes('ship') || text.includes('deliver') || text.includes('track') ? 'shipping'
      : text.includes('cancel') || text.includes('return') || text.includes('refund') ? 'cancellation'
      : text.includes('fault') || text.includes('damage') || text.includes('broken') ? 'damaged'
      : text.includes('product') || text.includes('fabric') || text.includes('size') || text.includes('bedsheet') ? 'product' : topic;
    setTopic(found);
    setReply(quickReplies[found]);
    setMessage((current) => current ? `${current}\n\n${question}` : question);
    setQuestion('');
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${getApiBaseUrl()}/support/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, topic, orderId, message }) });
      const result = await response.json() as { data?: { ticketId: string; email: string; emailSent: boolean }; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error || 'We could not save your support request. Please try again.');
      setTicket({ id: result.data.ticketId, emailSent: result.data.emailSent });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not save your support request.'); }
    finally { setBusy(false); }
  }

  const emailSubject = encodeURIComponent(`FabBazaar support ${ticket?.id}${orderId ? ` · Order ${orderId}` : ''}`);
  const emailBody = encodeURIComponent(`Ticket: ${ticket?.id}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nTopic: ${topics.find((item) => item.value === topic)?.label}\nOrder: ${orderId || 'Not provided'}\n\n${message}`);

  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="self-start rounded-[2rem] border border-brand-200 bg-brand-900 p-7 text-brand-50 sm:p-9">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/50 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200"><Headset className="h-4 w-4"/> Here 24×7</span>
        <p className="mt-7 text-xs uppercase tracking-[0.25em] text-brand-300">FabBazaar care</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">How can we help?</h1>
        <p className="mt-4 leading-7 text-brand-100">Get an instant answer for common questions or send our Jaipur team a support request at any hour.</p>
        <div className="mt-7 space-y-3">{topics.map((item) => <button key={item.value} type="button" onClick={() => { setTopic(item.value); setReply(quickReplies[item.value]); }} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${topic === item.value ? 'border-amber-300 bg-white/15 text-white' : 'border-white/15 text-brand-100 hover:bg-white/10'}`}>{item.label}<span aria-hidden="true">›</span></button>)}</div>
        <a href="mailto:support@fabbazaar.com" className="mt-7 inline-block text-sm text-amber-200 underline underline-offset-4">support@fabbazaar.com</a>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-brand-200 bg-white shadow-soft">
        <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50 px-5 py-4 sm:px-7"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-amber-200"><Sparkles className="h-5 w-5"/></span><div><h2 className="font-serif text-xl text-brand-900">FabBazaar assistant</h2><p className="text-xs text-brand-600">Automated help · available 24 hours</p></div><span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500"/></div>
        <div className="p-5 sm:p-7">
          <div aria-live="polite" className="rounded-2xl rounded-tl-sm bg-brand-50 p-4 text-sm leading-6 text-brand-800">{reply}</div>
          <form onSubmit={askQuestion} className="mt-4 flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your order or a product…" aria-label="Ask the FabBazaar assistant" className="min-w-0 flex-1 rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm"/><button type="submit" disabled={!question.trim()} aria-label="Send question" className="rounded-xl bg-brand-900 px-4 text-white disabled:opacity-50"><Send className="h-4 w-4"/></button></form>
          <div className="my-7 border-t border-brand-100"/>
          {ticket ? <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-700"/><h3 className="mt-2 font-serif text-xl text-emerald-950">Request saved · {ticket.id}</h3><p className="mt-2 text-sm leading-6 text-emerald-900">{ticket.emailSent ? 'Your request was emailed to the FabBazaar support team and saved in our queue.' : 'Your request is saved in our support queue. Email delivery is not configured on the server yet; use the prepared message below to send it to our team.'}</p>{!ticket.emailSent && <a href={`mailto:support@fabbazaar.com?subject=${emailSubject}&body=${emailBody}`} className="mt-4 inline-flex rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white">Email support@fabbazaar.com</a>}</div> : <form onSubmit={submitTicket} className="space-y-4">
            <div><h3 className="font-serif text-2xl text-brand-900">Send us a message</h3><p className="mt-1 text-sm text-brand-600">Tell us what happened and we’ll create a trackable support request.</p></div>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-brand-700">Your name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm"/></label><label className="text-xs font-medium text-brand-700">Email for reply<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm"/></label><label className="text-xs font-medium text-brand-700">Phone (optional)<input type="tel" maxLength={24} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 block w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm"/></label><label className="text-xs font-medium text-brand-700">Order number (if applicable)<input maxLength={80} value={orderId} onChange={(event) => setOrderId(event.target.value)} className="mt-1 block w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm"/></label></div>
            <label className="block text-xs font-medium text-brand-700">Topic<select value={topic} onChange={(event) => setTopic(event.target.value as Topic)} className="mt-1 block w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm">{topics.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label className="block text-xs font-medium text-brand-700">How can we help?<textarea required minLength={10} maxLength={3000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Include the details that will help us resolve your issue." className="mt-1 block w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm"/></label>
            <button disabled={busy} type="submit" className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving your request…' : 'Create support request'}</button>
          </form>}
        </div>
      </section>
    </div>
  </main>;
}
