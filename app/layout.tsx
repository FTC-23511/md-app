import type { Metadata } from 'next';
import { Inter, Orbitron, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Brand fonts (see docs/UI_GUIDE.md §2 + skill Appendix A).
// Inter = body/UI (sanctioned brand override). Orbitron = display, used lightly.
// JetBrains Mono = in-app data only (entry codes, timestamps, IDs).
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Maximum Documentation — FTC 23511',
  description: 'The team documentation system for FTC 23511.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
