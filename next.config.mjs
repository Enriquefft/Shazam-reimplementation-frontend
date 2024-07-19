/* eslint-disable jsdoc/check-tag-names */

import "./src/env.mjs";

import { NextPublicTsPlugin } from "next-public";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  webpack(config) {
    config.plugins.push(
      new NextPublicTsPlugin({
        autoDetect: true,
      }),
    );
    return config;
  },
};

export default nextConfig;
