import { cookies } from "next/headers";
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "nova_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.SESSION_SECRET ?? "nova-tunnel-dev-secret-change-in-production";
}

/* ---------- password hashing (scrypt) ---------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ---------- signed session token ---------- */
export function createSessionToken(username: string) {
  const expiry = Date.now() + MAX_AGE * 1000;
  const payload = `${username}.${expiry}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return { token: `${payload}.${sig}`, maxAge: MAX_AGE };
}

export function verifySessionToken(token: string | undefined): { username: string; expiry: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [username, expiryStr, sig] = parts;
  const expiry = Number(expiryStr);
  if (!username || !Number.isFinite(expiry) || expiry < Date.now()) return null;
  const expected = createHmac("sha256", secret()).update(`${username}.${expiryStr}`).digest("hex");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { username, expiry };
}

export async function getSessionUser() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
