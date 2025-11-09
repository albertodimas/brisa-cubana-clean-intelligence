import type { Plugin } from "vite";

const DIRECTIVE_REGEX = /^\s*(?:(["'])use (?:client|server)\1;?\s*)+/u;

export function removeReactDirectives({
  include = [
    /components\//,
    /app\//,
    /hooks\//,
    /lib\//,
    /node_modules\/@radix-ui\//,
    /node_modules\/framer-motion\//,
  ],
}: {
  include?: Array<string | RegExp>;
} = {}): Plugin {
  return {
    name: "remove-react-directives",
    enforce: "pre",
    transform(code, id) {
      const shouldProcess = include.some((pattern) =>
        typeof pattern === "string" ? id.includes(pattern) : pattern.test(id),
      );

      if (!shouldProcess || !DIRECTIVE_REGEX.test(code)) {
        return null;
      }

      const transformed = code.replace(DIRECTIVE_REGEX, "");
      return {
        code: transformed,
        map: null,
      };
    },
  };
}
