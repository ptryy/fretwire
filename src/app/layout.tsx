import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';

import { CartProvider } from '@/components/cart-provider';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ToastProvider } from '@/components/ui/toast';
import { SITE } from '@/lib/site';

import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'guitars',
    'electric guitar',
    'classical guitar',
    'acoustic',
    'bass',
    'crypto payment',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <ToastProvider>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
