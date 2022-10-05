function inline(value) {
  return value.replace(/\s{2,}/g, " ").trim();
}

const contentSecurityPolicy = `
      default-src 'self';
      base-uri 'self';
      block-all-mixed-content;
      font-src 'self' https: data:;
      frame-ancestors 'self';
      img-src 'self' data:;
      object-src 'none';
      script-src 'self' ${
        process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
      };
      script-src-attr 'none';
      style-src 'self' https: 'unsafe-inline';
      upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
