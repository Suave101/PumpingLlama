import type { NextConfig } from "next";

// Runs as a Node server (`next start`): the Canvas LTI 1.3 routes under app/api/lti
// need server-side request handling, so this can't be a static export.
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
