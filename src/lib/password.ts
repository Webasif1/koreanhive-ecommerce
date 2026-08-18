import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

/** Stored as "salt:key", both hex. scrypt is memory-hard and ships with
 *  Node, so there is no native module to build on Vercel. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  // constant-time: a length mismatch must not short-circuit differently
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
