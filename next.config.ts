import type { NextConfig } from "next";
import path from "path";
import webpack from "webpack";

const repoRoot = process.cwd();
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        buffer: require.resolve("buffer"),
        "process/browser": require.resolve("process/browser"),
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
