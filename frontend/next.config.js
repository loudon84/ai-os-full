/** @type {import('next').NextConfig} */

const path = require("path");

const nextConfig = {
  transpilePackages: ["@portal/shared"],
  webpack(config) {
    // @univerjs/engine-render 仍 deep-import 旧路径；opentype.js 1.3+ 已改为 dist/opentype.mjs
    const opentypePkg = path.dirname(require.resolve("opentype.js/package.json"));
    config.resolve.alias = {
      ...(config.resolve.alias && typeof config.resolve.alias === "object" && !Array.isArray(config.resolve.alias)
        ? config.resolve.alias
        : {}),
      "opentype.js/dist/opentype.module.js": path.join(opentypePkg, "dist", "opentype.mjs"),
    };
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.lorem.space",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};


module.exports = nextConfig;