import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="auth-page mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Your FabBazaar account</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-brand-900 sm:text-6xl">
          Welcome to a more personal way to shop.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-brand-700">
          Sign in to continue to your account, or use the secure administrator portal for store management.
        </p>
        <div className="glass-panel mt-10 flex items-center gap-4 rounded-2xl p-5">
          <div className="login-diya flex h-14 w-14 shrink-0 items-center justify-center rounded-full" role="img" aria-label="A softly burning diya">
            <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeOpacity=".35" strokeWidth=".8" />
              <path d="m24 4 1.6 2.5L24 9l-1.6-2.5L24 4ZM5 24l2.5-1.6L10 24l-2.5 1.6L5 24Zm33 0 2.5-1.6L43 24l-2.5 1.6L38 24ZM24 39l1.6 2.5L24 44l-1.6-2.5L24 39Z" fill="currentColor" fillOpacity=".6" />
              <path d="M24 9c-1.2 4.6-6.5 6.5-6.5 11.3 0 3.7 2.7 6.2 6.5 6.2s6.5-2.5 6.5-6.2C30.5 15.5 25.2 13.6 24 9Z" fill="currentColor" className="diya-flame" />
              <path d="M24 27c-2.8-2.1-6.7-3.5-11.8-3.5 1.1 7.6 5.4 12.2 11.8 12.2s10.7-4.6 11.8-12.2C30.7 23.5 26.8 24.9 24 27Z" fill="currentColor" />
              <path d="M17 29.5c1.6 2.1 4 3.2 7 3.2s5.4-1.1 7-3.2M13 38h22M18 41h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-brand-900">A beautiful home starts with thoughtful details.</p>
            <p className="mt-1 text-sm text-brand-600">Explore the Riwaz 93 × 108 collection.</p>
          </div>
        </div>
      </div>
      <LoginForm />
    </div>
  );
}
