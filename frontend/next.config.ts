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
  allowedDevOrigins: ['baskets-ranks-use-gets.trycloudflare.com', 'necessary-doc-knights-dana.trycloudflare.com', 'sig-after-vampire-sitting.trycloudflare.com', 'need-glasgow-everything-ocean.trycloudflare.com', '192.168.1.6', '10.19.107.83', 'deepness-computer-batboy.ngrok-free.dev'],
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
