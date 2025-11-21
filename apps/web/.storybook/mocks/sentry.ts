export const init = () => {};
export const captureMessage = () => {};
export const captureException = () => {};
export const addBreadcrumb = () => {};
export const withSentryConfig = <T>(config: T) => config;
export const startSpan = async <T>(
  options: unknown,
  callback: () => Promise<T> | T,
) => callback();
export const setContext = () => {};
export const setUser = () => {};
export const flush = async () => {};

export default {
  init,
  captureMessage,
  captureException,
  addBreadcrumb,
  withSentryConfig,
  startSpan,
  setContext,
  setUser,
  flush,
};
