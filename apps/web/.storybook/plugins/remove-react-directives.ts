type VitePlugin = {
  name: string;
  enforce?: "pre" | "post";
  transform?: (
    code: string,
    id: string,
  ) => { code: string; map: null } | null | undefined;
};

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
} = {}): VitePlugin {
  return {
    name: "remove-react-directives",
    enforce: "pre",
    transform(code: string, id: string) {
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
