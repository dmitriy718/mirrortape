import { createHmac } from "node:crypto";
import {
  createRemoteJWKSet,
  customFetch,
  jwtVerify,
  SignJWT,
  importPKCS8,
} from "jose";
import { z } from "zod";
import type { Config } from "../config.js";
import { equal } from "../crypto.js";
import { AppError, unavailable } from "../errors.js";
export const providers = ["google", "apple", "facebook"] as const;
export type SocialProvider = (typeof providers)[number];
export type SocialProfile = {
  subject: string;
  email: string | null;
  verified: boolean;
};
export function providerAvailable(config: Config, provider: SocialProvider) {
  return provider === "google"
    ? Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET)
    : provider === "apple"
      ? Boolean(
          config.APPLE_CLIENT_ID &&
          config.APPLE_TEAM_ID &&
          config.APPLE_KEY_ID &&
          config.APPLE_PRIVATE_KEY_BASE64,
        )
      : Boolean(
          config.FACEBOOK_CLIENT_ID &&
          config.FACEBOOK_CLIENT_SECRET &&
          config.FACEBOOK_GRAPH_VERSION,
        );
}
async function json(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (!response.ok) throw unavailable("Social sign-in");
  const reader = response.body?.getReader();
  if (!reader) throw unavailable("Social sign-in");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      if (size > 65536) {
        await reader.cancel();
        throw unavailable("Social sign-in");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
export function socialProviderClient(config: Config) {
  const keys = {
    google: createRemoteJWKSet(
      new URL("https://www.googleapis.com/oauth2/v3/certs"),
      { timeoutDuration: 5000, [customFetch]: (...args) => fetch(...args) },
    ),
    apple: createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"), {
      timeoutDuration: 5000,
      [customFetch]: (...args) => fetch(...args),
    }),
  };
  const redirect = (provider: SocialProvider) =>
    `${config.APP_ORIGIN}/api/auth/social/${provider}/callback`;
  function authorize(
    provider: SocialProvider,
    state: string,
    nonce: string,
    challenge: string,
  ) {
    if (!providerAvailable(config, provider))
      throw unavailable(`${provider} sign-in`);
    const url = new URL(
      provider === "google"
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : provider === "apple"
          ? "https://appleid.apple.com/auth/authorize"
          : `https://www.facebook.com/${config.FACEBOOK_GRAPH_VERSION}/dialog/oauth`,
    );
    url.search = new URLSearchParams({
      client_id: (provider === "google"
        ? config.GOOGLE_CLIENT_ID
        : provider === "apple"
          ? config.APPLE_CLIENT_ID
          : config.FACEBOOK_CLIENT_ID)!,
      redirect_uri: redirect(provider),
      response_type: "code",
      state,
      scope:
        provider === "google"
          ? "openid email"
          : provider === "apple"
            ? "email"
            : "email,public_profile",
    }).toString();
    if (provider !== "facebook") url.searchParams.set("nonce", nonce);
    if (provider === "apple")
      url.searchParams.set("response_mode", "form_post");
    if (provider === "google") {
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("prompt", "select_account");
    }
    return url.toString();
  }
  async function exchange(
    provider: SocialProvider,
    code: string,
    nonce: string,
    verifier: string,
  ): Promise<SocialProfile> {
    if (!providerAvailable(config, provider))
      throw unavailable("Social sign-in");
    if (provider === "facebook") {
      const base = `https://graph.facebook.com/${config.FACEBOOK_GRAPH_VERSION}`;
      const body = new URLSearchParams({
        client_id: config.FACEBOOK_CLIENT_ID!,
        client_secret: config.FACEBOOK_CLIENT_SECRET!,
        redirect_uri: redirect(provider),
        code,
      });
      const result = z.object({ access_token: z.string().min(1) }).parse(
        await json(`${base}/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }),
      );
      const debug = new URL(`${base}/debug_token`);
      debug.searchParams.set("input_token", result.access_token);
      const inspected = z
        .object({
          data: z.object({
            is_valid: z.boolean(),
            app_id: z.string(),
            user_id: z.string(),
            expires_at: z.number(),
            data_access_expires_at: z.number().optional(),
          }),
        })
        .parse(
          await json(debug.toString(), {
            headers: {
              Authorization: `Bearer ${config.FACEBOOK_CLIENT_ID}|${config.FACEBOOK_CLIENT_SECRET}`,
            },
          }),
        ).data;
      if (
        !inspected.is_valid ||
        inspected.app_id !== config.FACEBOOK_CLIENT_ID ||
        inspected.expires_at * 1000 <= Date.now() ||
        (inspected.data_access_expires_at &&
          inspected.data_access_expires_at * 1000 <= Date.now())
      )
        throw unavailable("Social sign-in");
      const me = new URL(`${base}/me`);
      me.search = new URLSearchParams({
        fields: "id,email",
        appsecret_proof: createHmac("sha256", config.FACEBOOK_CLIENT_SECRET!)
          .update(result.access_token)
          .digest("hex"),
      }).toString();
      const profile = z
        .object({
          id: z.string().min(1).max(255),
          email: z.email().max(254).optional(),
        })
        .parse(
          await json(me.toString(), {
            headers: { Authorization: `Bearer ${result.access_token}` },
          }),
        );
      if (profile.id !== inspected.user_id) throw unavailable("Social sign-in");
      return {
        subject: profile.id,
        email: profile.email?.toLowerCase() ?? null,
        verified: false,
      };
    }
    let secret = config.GOOGLE_CLIENT_SECRET!;
    const clientId = (
      provider === "google" ? config.GOOGLE_CLIENT_ID : config.APPLE_CLIENT_ID
    )!;
    if (provider === "apple") {
      const key = await importPKCS8(
        Buffer.from(config.APPLE_PRIVATE_KEY_BASE64!, "base64").toString(
          "utf8",
        ),
        "ES256",
      );
      secret = await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: config.APPLE_KEY_ID! })
        .setIssuer(config.APPLE_TEAM_ID!)
        .setSubject(clientId)
        .setAudience("https://appleid.apple.com")
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(key);
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: secret,
      redirect_uri: redirect(provider),
    });
    if (provider === "google") body.set("code_verifier", verifier);
    const result = z.object({ id_token: z.string().min(1) }).parse(
      await json(
        provider === "google"
          ? "https://oauth2.googleapis.com/token"
          : "https://appleid.apple.com/auth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        },
      ),
    );
    const { payload } = await jwtVerify(result.id_token, keys[provider], {
      issuer:
        provider === "google"
          ? ["https://accounts.google.com", "accounts.google.com"]
          : "https://appleid.apple.com",
      audience: clientId,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "exp", "iat", "nonce"],
      clockTolerance: 5,
      maxTokenAge: "10m",
    });
    if (
      typeof payload.nonce !== "string" ||
      !equal(payload.nonce, nonce) ||
      typeof payload.sub !== "string" ||
      payload.sub.length > 255 ||
      (payload.azp !== undefined && payload.azp !== clientId)
    )
      throw new AppError(
        400,
        "SOCIAL_INVALID",
        "This sign-in could not be verified. Start again.",
      );
    const address = z.email().max(254).safeParse(payload.email);
    return {
      subject: payload.sub,
      email: address.success ? address.data.toLowerCase() : null,
      verified:
        address.success &&
        (payload.email_verified === true || payload.email_verified === "true"),
    };
  }
  return { authorize, exchange };
}
