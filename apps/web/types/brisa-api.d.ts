declare module "@brisa/api" {
  const app: {
    fetch(request: Request): Promise<Response>;
  };
  export default app;
}
