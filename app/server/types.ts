import type { Database } from "./db.js";
import type { Config } from "./config.js";
export type Context = { db: Database; config: Config };
export type Identity = {
  userId: string;
  sessionHash: string;
  sessionToken: string;
  email: string | null;
  verified: boolean;
  authenticated: boolean;
};
declare module "fastify" {
  interface FastifyRequest {
    identity: Identity;
  }
}
