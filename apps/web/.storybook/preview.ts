import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    actions: { argTypesRegex: "^on[A-Z].*" },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#030b17" },
        { name: "light", value: "#f4f6f8" },
      ],
    },
  },
};

export default preview;
