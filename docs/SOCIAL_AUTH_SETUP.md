# Account and social sign-in configuration

The private dashboard is `/app`. Email/password sign-in and registration are `/app/login` and `/app/register`. `/demo` is a separate browser-tab sandbox with clearly labelled example symbols, no balances or trade executions, and no writes to private account data. Existing users sign in to their existing account; no CodexStore database or credentials are reused.

Email/password registration creates an authenticated but email-unverified account. With SMTP configured, a verification email is queued. Without SMTP, the private research dashboard remains usable, but verification/recovery delivery and brokerage privileges remain unavailable. Provide `SMTP_URL` and `MAIL_FROM` in the server environment and verify domain authentication and delivery before promoting email-dependent flows.

## Provider setup

All three provider integrations are implemented, but buttons remain unavailable until their complete server-side configuration exists. Test fixtures are not live provider verification. The configured public origin is exactly `https://mirrortape.net`. Never paste provider credentials into chat or Git; edit `/etc/mirrortape/app.env` over your secure administration channel, then roll out the same tested image with updated environment.

| Provider | Required server variables | Exact redirect URL |
| --- | --- | --- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `https://mirrortape.net/api/auth/social/google/callback` |
| Apple | `APPLE_CLIENT_ID` (Services ID), `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_BASE64` | `https://mirrortape.net/api/auth/social/apple/callback` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_GRAPH_VERSION` | `https://mirrortape.net/api/auth/social/facebook/callback` |

Google: configure a web OAuth client, consent-screen branding, authorized domain and redirect URI; request only `openid email`. The server uses authorization code with PKCE, nonce/state, and verifies the signed ID token against Google's keys, issuer and client audience. See [Google's server-flow instructions](https://developers.google.com/identity/openid-connect/openid-connect).

Apple: associate a Services ID with your approved Sign in with Apple app, register the domain/return URL, and create a Sign in with Apple key. Store the .p8 key as base64 in the server configuration. The server generates a short-lived ES256 client-secret JWT and verifies Apple's signed identity token. Apple's cross-site form POST uses a separate short-lived Secure, HttpOnly, SameSite=None browser-binding cookie; the ordinary account cookie stays SameSite=Lax. Configure Apple private-email-relay sending domains if you will send mail to relay addresses. See [Apple's web configuration](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/).

Facebook: configure Facebook Login for the web, app domain, exact valid OAuth redirect URI, approved privacy/data-deletion information and the supported Graph API version selected in the app dashboard. Complete Meta's access/review requirements and switch out of development mode when approved. The server exchanges the code, validates the token with `debug_token` (application, user and expiration), and fetches the matching profile with `appsecret_proof`. Facebook email is not treated as email-verification proof. See [Meta's manual login flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/).

## Existing accounts and linking

The durable login identity is `(provider, subject)`, never just an email address. When a new social identity has the same email as an existing account, sign in with that account's existing method first. In **Account & billing → Sign-in methods**, connect the additional provider using a recently authenticated session. An identity already connected to another account cannot be transferred. Social logins rotate the application session and never expose provider tokens to frontend storage.

No external client database has been supplied. A new VPS database does not automatically contain clients from another application or the local test environment. Any real account import needs the source schema, password-hash compatibility, identity ownership and a reviewed migration; do not fabricate existing clients or copy unrelated application data.

## Acceptance before enabling each provider publicly

Verify successful registration and returning-client login against the actual provider; cancellation/denial, email collision/linking, expired state, logout/recovery, Apple form POST/private relay, and Facebook development/live permissions. Verify the public HTTPS certificate and exact callback URL first. Provider logos/branding and policy URLs must be reviewed against the current provider requirements. There are no third-party login scripts or SDKs injected into the page; redirects occur from server-generated provider URLs.
