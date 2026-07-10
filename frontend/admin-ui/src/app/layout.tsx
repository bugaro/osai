import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { EventStreamProvider } from '@/shared/api/EventStreamProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OSAI Autonomous Operations Terminal',
  description:
    'Real-time operator dashboard for the OSAI AI compensation engine with deterministic guardrails.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <EventStreamProvider>
          <div className="relative flex h-auto min-h-screen w-full flex-col bg-background">
            {children}
          </div>
        </EventStreamProvider>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
