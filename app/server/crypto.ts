import {
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  scrypt as scryptCallback,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString("hex");
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const csrf = (value: string, secret: string) =>
  createHmac("sha256", secret).update(`csrf:${value}`).digest("hex");
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function seal(value: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}.${cipher.getAuthTag().toString("hex")}.${data.toString("hex")}`;
}
export function unseal(value: string, key: string) {
  const [iv, tag, data] = value.split(".");
  if (!iv || !tag || !data) throw new Error("Encrypted credential is invalid");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
// Versioned scrypt parameters follow the OWASP 32 MiB / p=3 profile.
const passwordPrefix = "scrypt-v1";
async function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
  });
}
export async function passwordHash(password: string) {
  const salt = token();
  const result = await derivePassword(password, salt);
  return `${passwordPrefix}:${salt}:${result.toString("hex")}`;
}
export async function passwordMatches(password: string, stored: string) {
  const parts = stored.split(":");
  const modern = parts[0] === passwordPrefix;
  const [salt, digest] = modern ? parts.slice(1) : parts;
  if (
    parts.length !== (modern ? 3 : 2) ||
    !salt ||
    !digest ||
    !/^[a-f0-9]{64}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(digest)
  )
    return false;
  const result = modern
    ? await derivePassword(password, salt)
    : ((await scrypt(password, salt, 64)) as Buffer);
  return equal(result.toString("hex"), digest);
}
