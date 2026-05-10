import type { StorybookConfig } from "@storybook/nextjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)", "../stories/**/*.mdx"],

  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-themes",
      options: {
        list: [
          { name: "Default (Violet)", class: "", color: "#7c3aed" },
          { name: "Zinc", class: "theme-zinc", color: "#71717a" },
          { name: "Slate", class: "theme-slate", color: "#64748b" },
          { name: "Stone", class: "theme-stone", color: "#78716c" },
          { name: "Gray", class: "theme-gray", color: "#6b7280" },
          { name: "Neutral", class: "theme-neutral", color: "#737373" },
          { name: "Red", class: "theme-red", color: "#ef4444" },
          { name: "Rose", class: "theme-rose", color: "#f43f5e" },
          { name: "Orange", class: "theme-orange", color: "#f97316" },
          { name: "Green", class: "theme-green", color: "#22c55e" },
          { name: "Blue", class: "theme-blue", color: "#3b82f6" },
          { name: "Yellow", class: "theme-yellow", color: "#eab308" },
          { name: "Violet", class: "theme-violet", color: "#8b5cf6" },
        ],
      },
    },
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  docs: {
    autodocs: "tag",
  },

  staticDirs: ["../public"],

  webpackFinal: async (config) => {
    // 1. 路径别名：@/* -> 项目根目录
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../"),
      "@copilotkit/react-core": path.resolve(__dirname, "./mocks/copilotkit.tsx"),
      "@copilotkit/react-ui": path.resolve(__dirname, "./mocks/copilotkit.tsx"),
    };

    // 2. SVG 处理：对齐 next.config.js 的 @svgr/webpack 规则
    // Find the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(
      (rule: any) => rule.test?.test?.(".svg")
    );

    if (fileLoaderRule) {
      // Exclude SVG from the file loader rule
      (fileLoaderRule as any).exclude = /\.svg$/i;
    }

    // Add @svgr/webpack rule for SVG as React components
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: { not: [/url/] },
      use: ["@svgr/webpack"],
    });

    // Add file loader rule for SVG with ?url query
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: /url/,
      type: "asset/resource",
    });

    return config;
  },
};

export default config;
