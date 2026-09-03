import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL('https://fbdowload.vercel.app'),
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
    'chuyen giong noi thanh van ban',
    'speech to text facebook',
  ],
  authors: [{ name: 'NDL Developer', url: 'https://longnd.vercel.app/' }],
  creator: 'NDL Developer',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'FB Video Downloader - NDL Developer | Tải Video Facebook HD Miễn Phí',
    description:
      'Tải video Facebook online miễn phí tốc độ cao HD/SD & Chuyển giọng nói thành văn bản. Phát triển bởi NDL Developer.',
    url: 'https://fbdowload.vercel.app',
    siteName: 'FB Video Downloader - NDL Developer',
    images: [
      {
        url: '/ndl-logo.png',
        width: 800,
        height: 800,
        alt: 'NDL Developer Logo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FB Video Downloader - NDL Developer | Tải Video Facebook HD Miễn Phí',
    description:
      'Tải video Facebook online miễn phí tốc độ cao HD/SD & Chuyển giọng nói thành văn bản. Phát triển bởi NDL Developer.',
    images: ['/ndl-logo.png'],
    creator: '@NDLDeveloper',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '2n_hKWDM5r9dlRixMDRAsSCW6hbadPKFb5ccKFfG3i0',
  },
  other: {
    'google-adsense-account': 'ca-pub-9166964727480227',
  },
};

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'FB Video Downloader - NDL Developer',
  url: 'https://fbdowload.vercel.app',
  description:
    'Công cụ tải video Facebook online nhanh nhất. Hỗ trợ tải Facebook Reels, Watch, Post Video chất lượng HD/SD và nhận dạng giọng nói Speech to Text miễn phí. Phát triển bởi NDL Developer.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'VND',
  },
  author: {
    '@type': 'Person',
    name: 'NDL Developer',
    url: 'https://longnd.vercel.app/',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Tính năng Speech-to-Text (Nhận dạng giọng nói) hoạt động như thế nào?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tính năng Speech-to-Text tích hợp trực tiếp bộ nhận dạng giọng nói AI giúp chuyển âm thanh/lời thoại trong video Facebook thành văn bản (chữ viết) theo thời gian thực hoặc trích xuất phụ đề tự động.',
      },
    },
    {
      '@type': 'Question',
      name: 'Công cụ hỗ trợ trích xuất giọng nói các ngôn ngữ nào?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hệ thống hỗ trợ nhận dạng tốt nhất đối với Tiếng Việt (vi-VN) và Tiếng Anh (en-US) cùng khả năng tự động bóc tách phụ đề đính kèm sẵn trên Facebook.',
      },
    },
    {
      '@type': 'Question',
      name: 'Công cụ do ai phát triển và có miễn phí không?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Công cụ được nghiên cứu & phát triển bởi NDL Developer (NDL Team), hoàn toàn miễn phí 100%. Bạn có thể xem thêm thông tin và các dự án tại website profile của NDL Developer: https://longnd.vercel.app/.',
      },
    },
    {
      '@type': 'Question',
      name: 'Công cụ hỗ trợ các định dạng liên kết Facebook nào?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hỗ trợ tất cả liên kết Facebook bao gồm: Facebook Reels, Facebook Watch, Video bài viết, Video Livestream đã kết thúc và Facebook Shorts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Video sau khi tải xuống sẽ được lưu ở đâu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'File video MP4 và file văn bản .TXT sẽ tự động lưu vào thư mục Tải về (Downloads) trên máy tính hoặc điện thoại thông minh của bạn.',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
