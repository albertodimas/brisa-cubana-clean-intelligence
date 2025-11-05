import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(ts|tsx)",
    "../app/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/test",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    const aliases = [
      { find: "@", replacement: path.resolve(__dirname, "..") },
      { find: "@/", replacement: `${path.resolve(__dirname, "..")}/` },
      {
        find: "next/image",
        replacement: path.resolve(__dirname, "./mocks/next-image.tsx"),
      },
      {
        find: "next/link",
        replacement: path.resolve(__dirname, "./mocks/next-link.tsx"),
      },
    ];

    if (!config.resolve) {
      config.resolve = {};
    }

    if (Array.isArray(config.resolve.alias)) {
      config.resolve.alias.push(...aliases);
    } else {
      config.resolve.alias = [
        ...(typeof config.resolve.alias === "object"
          ? Object.entries(config.resolve.alias).map(([find, replacement]) => ({
              find,
              replacement: replacement as string,
            }))
          : []),
        ...aliases,
      ];
    }
    return config;
  },
  staticDirs: ["../public"],
};

export default config;
