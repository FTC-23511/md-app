/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    // 2F media uploads post through a server action. Default limit is 1 MB; lift
    // it just above the per-file cap (4 MB, enforced in lib/media/save-entry-media.ts)
    // so a legitimate photo gets through and larger files are rejected with our
    // own "use YouTube" message rather than a generic 413.
    serverActions: { bodySizeLimit: '6mb' },
  },
  images: {
    remotePatterns: [
      // Supabase Storage public URLs
      { protocol: 'https', hostname: '*.supabase.co' },
      // Google Drive direct image URLs (for hero shots / photo references)
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
