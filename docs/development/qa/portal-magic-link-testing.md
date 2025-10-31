# Portal Magic Link QA Procedure

Tokens for the customer portal are no longer returned in API responses. This prevents unintended disclosure in production. Use the following workflow while testing in local or staging environments:

1. **Explicitly enable debug mode (non-production only).**
   - Add `PORTAL_MAGIC_LINK_EXPOSE_DEBUG=true` to `.env.local` for the API service.
   - Restart `pnpm --filter @brisa/api dev` so the flag is applied.
   - The `/api/portal/auth/request` response will include a `debugToken` only when `NODE_ENV !== "production"` and this flag is present.

2. **Generate a magic link as usual.**
   - Call the request endpoint or use the customer portal form.
   - Use the returned `debugToken` when posting to `/api/portal/auth/verify`.

3. **Alternative without exposing the token.**
   - Point the SMTP configuration to a local catcher (for example MailHog or Mailpit) so you can copy the link directly from the email instead of returning it via the API.
   - Update `.env.local` for the API with:
     ```env
     PORTAL_MAGIC_LINK_SMTP_HOST=127.0.0.1
     PORTAL_MAGIC_LINK_SMTP_PORT=1025
     PORTAL_MAGIC_LINK_SMTP_USER=
     PORTAL_MAGIC_LINK_SMTP_PASSWORD=
     PORTAL_MAGIC_LINK_FROM="qa@brisacubanacleanintelligence.test"
     ```
   - Start the catcher, trigger a magic link request, and open the message in the UI of the catcher to grab the raw URL.

4. **Cleanup.**
   - Remove the debug flag when you finish QA.
   - Tokens can be invalidated with `pnpm --filter @brisa/api db:seed` or by deleting records via Prisma Studio.

> ⚠️ Mantén `ENABLE_TEST_UTILS` en `false` en producción. El modo de utilidades de prueba está pensado únicamente para entornos locales o de staging controlados.
