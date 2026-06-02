import withPWA from 'next-pwa';

// PWA configuration per README: cache-first shell, offline support.
const withPWAMiddleware = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const baseConfig = {
  reactStrictMode: true
};

export default withPWAMiddleware(baseConfig);

