import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Crypto Shop — NextPayments Demo',
  description: 'A demo storefront that accepts crypto payments via NextPayments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
