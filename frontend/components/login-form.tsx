'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';

type LoginRole = 'customer' | 'admin';
type AuthMode = 'login' | 'register';

type AuthResponse = {
  token: string;
  user: {
    id: string;
    customerId?: string;
    name: string;
    email: string;
    phone?: string;
    role: LoginRole;
  };
};

const apiBaseUrl = (() => {
  const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
  if (typeof window !== 'undefined' && (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1')) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.toString().replace(/\/+$/, '');
})();

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== 'object') return false;

  const response = value as Partial<AuthResponse>;
  return Boolean(
    typeof response.token === 'string' &&
    response.user &&
    typeof response.user.id === 'string' &&
    typeof response.user.name === 'string' &&
    typeof response.user.email === 'string' &&
    (response.user.role === 'customer' || response.user.role === 'admin')
  );
}

function getErrorMessage(value: unknown) {
  if (value && typeof value === 'object' && 'error' in value && typeof value.error === 'string') {
    return value.error;
  }
  return 'We could not sign you in. Please check your details and try again.';
}

export function LoginForm({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>('customer');
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isRegistering = role === 'customer' && mode === 'register';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const endpoint = isRegistering ? 'register' : 'login';
      const response = await fetch(`${apiBaseUrl}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegistering ? { name, email, phone, password } : { email, password })
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result));
      }
      if (!isAuthResponse(result)) {
        throw new Error('The sign-in service returned an invalid response. Please try again.');
      }
      if (result.user.role !== role) {
        throw new Error(
          role === 'admin'
            ? 'This account does not have administrator access. Use an authorized admin account.'
            : 'Please use the administrator portal for this account.'
        );
      }

      sessionStorage.setItem('fabbazaar-token', result.token);
      sessionStorage.setItem('fabbazaar-user', JSON.stringify(result.user));
      window.dispatchEvent(new Event('fabbazaar-auth-change'));
      router.push(role === 'admin' ? '/admin' : '/account');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeRole(nextRole: LoginRole) {
    setRole(nextRole);
    setMode('login');
    setErrorMessage('');
  }

  return (
    <section className="mx-auto w-full max-w-lg rounded-[2rem] border border-brand-100 bg-white p-4 shadow-soft sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-900 text-brand-100">
          {role === 'admin' ? <ShieldCheck className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-500">Secure sign in</p>
          <h2 className="mt-1 font-serif text-2xl leading-tight text-brand-900 sm:text-3xl">
            {role === 'admin' ? 'Admin portal' : isRegistering ? 'Create your account' : 'Welcome back'}
          </h2>
        </div>
      </div>

      {!isRegistering && <div className="mt-5 grid grid-cols-2 rounded-2xl bg-brand-50 p-1.5" role="tablist" aria-label="Choose account type">
        <button
          type="button"
          role="tab"
          aria-selected={role === 'customer'}
          onClick={() => changeRole('customer')}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium ${
            role === 'customer' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-900'
          }`}
        >
          <UserRound className="h-4 w-4" /> Customer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'admin'}
          onClick={() => changeRole('admin')}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium ${
            role === 'admin' ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-600 hover:text-brand-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Administrator
        </button>
      </div>}

      {!isRegistering && <p className="mt-4 text-sm leading-6 text-brand-600">
        {role === 'admin'
          ? 'Administrator access is restricted to authorized FabBazaar staff.'
          : 'Access your account to continue shopping with FabBazaar.'}
      </p>}

      {role === 'customer' && (
        <div className="mt-3 flex gap-5 border-b border-brand-100 text-sm">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(''); }}
            className={`border-b-2 pb-3 font-medium ${mode === 'login' ? 'border-brand-900 text-brand-900' : 'border-transparent text-brand-500 hover:text-brand-900'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(''); }}
            className={`border-b-2 pb-3 font-medium ${mode === 'register' ? 'border-brand-900 text-brand-900' : 'border-transparent text-brand-500 hover:text-brand-900'}`}
          >
            Create account
          </button>
        </div>
      )}

      <form className={isRegistering ? 'mt-3 grid grid-cols-2 gap-x-3 gap-y-2' : 'mt-4 space-y-3 sm:space-y-4'} onSubmit={handleSubmit}>
        {isRegistering && (
          <div className="contents">
            <div>
              <label htmlFor="account-name" className="mb-1 block text-xs font-medium text-brand-800 sm:text-sm">Full name</label>
              <input
                id="account-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-brand-200 px-4 py-2.5 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label htmlFor="account-phone" className="mb-1 block text-xs font-medium text-brand-800 sm:text-sm">Phone number</label>
              <input
                id="account-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                minLength={8}
                maxLength={16}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+919876543210"
                className="w-full rounded-xl border border-brand-200 px-4 py-2.5 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="account-email" className="mb-1 block text-xs font-medium text-brand-800 sm:text-sm">Email address</label>
          <input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-brand-200 px-4 py-2.5 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2">
            <label htmlFor="account-password" className="text-xs font-medium text-brand-800 sm:text-sm">Password</label>
            <span className="text-[10px] text-brand-500">{role === 'admin' ? 'Admin credentials' : isRegistering ? '8+ characters' : 'At least 6 characters'}</span>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <input
              id="account-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              minLength={isRegistering ? 8 : 6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-brand-200 py-2.5 pl-11 pr-12 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-brand-500 hover:bg-brand-50 hover:text-brand-900"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${isRegistering ? 'col-span-2' : ''}`}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-2 font-medium text-brand-50 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 ${isRegistering ? 'col-span-2' : ''}`}
        >
          {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <>{isRegistering ? 'Create account' : 'Continue securely'} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      {!isRegistering && <p className="mt-3 text-center text-xs leading-5 text-brand-500">Your password is protected and is never stored in your browser.</p>}
    </section>
  );
}
