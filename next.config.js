/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import createJiti from "jiti";
import process from "node:process";
import { fileURLToPath } from "node:url";

createJiti(fileURLToPath(import.meta.url))("./src/env.ts");

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    serverComponentsExternalPackages: ["ably"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default config;
