import type { MetadataRoute } from 'next';

// Web app manifest — Next.js generates /manifest.webmanifest from this.
// Replaces the stale public/site.webmanifest (empty name/short_name,
// white-on-white theme) with values that match the editorial rebrand.
//
// Icons point at the dynamic routes (app/icon.tsx, app/apple-icon.tsx)
// so Android / iOS home-screen installs get the Fraunces "G" at the
// appropriate sizes without a separate PNG pipeline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gotcha',
    short_name: 'Gotcha',
    description: 'Developer-first contextual feedback SDK for React.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F4',
    theme_color: '#1A1714',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
