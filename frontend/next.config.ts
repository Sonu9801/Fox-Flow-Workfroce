import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // TEMPORARILY ENABLED for mobile PWA install testing
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['assembled-skip-tvs-yrs.trycloudflare.com', 'virtue-donor-intake-gadgets.trycloudflare.com', 'singing-norfolk-serve-rehabilitation.trycloudflare.com', 'tim-computers-throat-associations.trycloudflare.com', '192.168.1.6', 'ids-sydney-anchor-hammer.trycloudflare.com', '10.19.107.83', 'last-resist-redeem-professionals.trycloudflare.com', 'deepness-computer-batboy.ngrok-free.dev', 'papers-manager-indicated-opened.trycloudflare.com', 'mainstream-anderson-jerry-terry.trycloudflare.com', 'quality-parts-den-referring.trycloudflare.com', 'programs-tagged-flexibility-proc.trycloudflare.com'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*'
      },
      {
        source: '/ws/:path*',
        destination: 'http://127.0.0.1:8000/ws/:path*'
      }
    ];
  },
};

export default withPWA(nextConfig);

// trigger restart
