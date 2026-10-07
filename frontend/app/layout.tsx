import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CartProvider } from '@/components/cart-provider';
import { ClockTheme } from '@/components/clock-theme';

export const metadata: Metadata = {
  title: 'FabBazaar | Celebrating Tradition',
  description: 'Premium Indian home textiles and handcrafted bedsheets.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClockTheme />
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
