import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'FB Video Downloader - NDL Developer | Tải Video Facebook HD Miễn Phí',
  description:
    'Công cụ tải video Facebook online nhanh nhất. Hỗ trợ tải Facebook Reels, Watch, Post Video chất lượng HD/SD miễn phí. Được phát triển bởi NDL Developer.',
  keywords: [
    'NDL Developer',
    'NDL',
    'facebook video downloader',
    'tai video facebook',
    'tai reel fb',
    'facebook reels downloader',
    'download fb video hd',
    'tai video fb full hd',
  ],
  authors: [{ name: 'NDL Developer' }],
  creator: 'NDL Developer',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FB Video Downloader - NDL Developer',
    description: 'Tải video Facebook online miễn phí tốc độ cao HD/SD. Phát triển bởi NDL Developer.',
    images: [
      {
        url: '/ndl-logo.png',
        width: 800,
        height: 800,
        alt: 'NDL Developer Logo',
      },
    ],
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: '2n_hKWDM5r9dlRixMDRAsSCW6hbadPKFb5ccKFfG3i0',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} dark scroll-smooth`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
