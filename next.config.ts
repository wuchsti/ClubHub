import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (PPR) requires every cookie/session read to sit behind
  // a Suspense boundary with explicit `use cache` directives. Almost every
  // route here is an authenticated Supabase session read, so we opt out for
  // now and render dynamically like a classic SSR app; revisit in Phase 5.
  // Self-contained server bundle for the Docker image (see Dockerfile);
  // has no effect on Vercel deployments.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
