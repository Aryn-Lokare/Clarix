/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress hydration warnings for attributes added by browser extensions
  experimental: {
    // This can help with hydration mismatches caused by browser extensions
    suppressHydrationWarning: true,
  },
  // Additional configuration for better development experience
  reactStrictMode: true,
};

export default nextConfig;
