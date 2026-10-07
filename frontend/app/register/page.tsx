import { LoginForm } from '@/components/login-form';

export default function RegisterPage() {
  return (
    <div className="auth-page mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-6 px-5 py-6 sm:px-8 sm:py-10 lg:grid-cols-[1fr_0.85fr] lg:gap-12 lg:px-10">
      <div className="hidden max-w-xl lg:block">
        <p className="text-xs uppercase tracking-[0.28em] text-brand-500">Join FabBazaar</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-brand-900 sm:text-6xl">Create your customer account.</h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-brand-700">Save your details for a more personal shopping experience and keep your FabBazaar customer ID close at hand.</p>
      </div>
      <LoginForm initialMode="register" />
    </div>
  );
}
