import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CartProvider } from '@/components/cart-provider';
import { SystemTheme } from '@/components/system-theme';
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
          {`(() => { const savedTheme = window.localStorage.getItem('fabbazaar-theme'); document.documentElement.dataset.theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; })();`}
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
      </body>
    </html>
  );
}
