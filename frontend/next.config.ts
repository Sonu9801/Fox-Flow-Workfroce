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
  allowedDevOrigins: ['192.168.1.6', 'ids-sydney-anchor-hammer.trycloudflare.com', '10.19.107.83', 'last-resist-redeem-professionals.trycloudflare.com', 'deepness-computer-batboy.ngrok-free.dev', 'papers-manager-indicated-opened.trycloudflare.com', 'mainstream-anderson-jerry-terry.trycloudflare.com', 'quality-parts-den-referring.trycloudflare.com', 'programs-tagged-flexibility-proc.trycloudflare.com'],
};

export default withPWA(nextConfig);
