import type { Metadata } from 'next';
import { Noto_Sans_Malayalam, Noto_Serif_Malayalam } from 'next/font/google';
import './globals.css';

const notoSansMalayalam = Noto_Sans_Malayalam({
  variable: '--font-noto-sans-malayalam', subsets: ['malayalam'], display: 'swap',
});
const notoSerifMalayalam = Noto_Serif_Malayalam({
  variable: '--font-noto-serif-malayalam', subsets: ['malayalam'], display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sing-malayalam.vercel.app'),
  title: 'പാടുന്ന വേദപുസ്തകം | Sing Malayalam',
  description: 'മലയാള തിരുവെഴുത്തുകൾ പരമ്പരാഗത സ്തുതിഗീത ശൈലിയിൽ കേൾക്കൂ.',
  openGraph: {
    title: 'പാടുന്ന വേദപുസ്തകം',
    description: 'വചനം ഹൃദയത്തിൽ പാടട്ടെ — മലയാള തിരുവെഴുത്തുകളുടെ സംഗീതാനുഭവം.',
    type: 'website', locale: 'ml_IN', images: [{ url: '/og.png', width: 1729, height: 910, alt: 'പാടുന്ന വേദപുസ്തകം' }],
  },
  twitter: {
    card: 'summary_large_image', title: 'പാടുന്ന വേദപുസ്തകം',
    description: 'മലയാള തിരുവെഴുത്തുകളുടെ സംഗീതാനുഭവം.', images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ml"><body className={`${notoSansMalayalam.variable} ${notoSerifMalayalam.variable} antialiased`}>{children}</body></html>;
}
