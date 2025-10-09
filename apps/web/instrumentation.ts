export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: {
      referer?: string;
      "user-agent"?: string;
    };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    revalidateReason: "on-demand" | "stale" | undefined;
    renderSource:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering"
      | undefined;
  },
) => {
  const Sentry = await import("@sentry/nextjs");

  Sentry.withScope((scope) => {
    scope.setExtra("requestPath", request.path);
    scope.setExtra("requestMethod", request.method);
    scope.setExtra("referer", request.headers.referer);
    scope.setExtra("userAgent", request.headers["user-agent"]);
    scope.setExtra("routerKind", context.routerKind);
    scope.setExtra("routePath", context.routePath);
    scope.setExtra("routeType", context.routeType);
    scope.setContext("nextjs", {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    });

    Sentry.captureException(err);
  });
};
