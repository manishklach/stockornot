import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const socialImage = '/og.png';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      'https://stockornot.abc123xyza.chatgpt.site',
  ),
  title: 'StockOrNot — Market Sentiment Intelligence',
  description:
    'Compare ticker-specific news sentiment with community Hot or Not opinion across US stocks and ETFs.',
  openGraph: {
    title: 'StockOrNot — Market Sentiment Intelligence',
    description:
      'Compare ticker-specific news sentiment with community Hot or Not opinion across US stocks and ETFs.',
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: 'StockOrNot — Market Sentiment Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StockOrNot — Market Sentiment Intelligence',
    description:
      'Compare ticker-specific news sentiment with community Hot or Not opinion across US stocks and ETFs.',
    images: [socialImage],
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
