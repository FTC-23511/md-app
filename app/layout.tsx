import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maximum Documentation — FTC 23511',
  description: 'The team documentation system for FTC 23511.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
