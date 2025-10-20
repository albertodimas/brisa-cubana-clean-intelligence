const config = {
  org: process.env.SENTRY_ORG ?? "brisacubana",
  project: process.env.SENTRY_PROJECT ?? "brisa-cubana-web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

export default config;
