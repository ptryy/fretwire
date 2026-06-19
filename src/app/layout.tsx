import type { Metadata } from 'next';

import { CartProvider } from '@/components/cart-provider';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

export const metadata: Metadata = {
  title: 'Crypto Shop — NextPayments Demo',
  description: 'A demo storefront that accepts crypto payments via NextPayments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
