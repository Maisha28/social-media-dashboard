import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "scontent.xx.fbcdn.net" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
  },
  // Meta redirects users back over https; make sure generated URLs agree.
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
