import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://stockornot.abc123xyza.chatgpt.site'),
  title: 'StockOrNot — Rate the Market',
  description: 'Vote hot or not on US stocks and ETFs, then see what the crowd thinks.',
  openGraph: {
    title: 'StockOrNot — Rate the Market',
    description: 'Vote hot or not on US stocks and ETFs, then see what the crowd thinks.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'StockOrNot — Rate the Market' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StockOrNot — Rate the Market',
    description: 'Vote hot or not on US stocks and ETFs, then see what the crowd thinks.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
