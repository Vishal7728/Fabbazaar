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
        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-soft">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl text-brand-700">✦</div>
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
