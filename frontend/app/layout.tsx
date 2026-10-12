import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CartProvider } from '@/components/cart-provider';
import { SystemTheme } from '@/components/system-theme';
import { CookieConsent } from '@/components/cookie-consent';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'FabBazaar | Celebrating Tradition',
  description: 'Premium Indian home textiles and handcrafted bedsheets.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="system-theme-init" strategy="beforeInteractive">
          {`(() => { const hour = new Date().getHours(); document.documentElement.dataset.theme = hour >= 7 && hour < 19 ? 'light' : 'dark'; })();`}
        </Script>
      </head>
      <body>
        <SystemTheme />
        <div className="min-h-screen text-brand-900">
          <CartProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </div>
        <CookieConsent />
      </body>
    </html>
  );
}
