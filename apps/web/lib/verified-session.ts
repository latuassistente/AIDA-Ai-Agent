import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type VerifiedAidaSession = {
  sub: string;
  tenantId: string;
  role: "owner" | "admin";
  exp: number;
};

const COOKIE_NAME = "aida_session";

/**
 * Verifies a session cookie signed by the trusted authentication layer.
 * Cookie value: base64url(JSON({sub, tenantId, role, exp})).base64url(HMAC-SHA256(payload, AIDA_SESSION_SECRET)).
 * The signing secret must be server-only and at least 32 characters long.
 */
export async function getVerifiedAidaSession(): Promise<VerifiedAidaSession | null> {
  const secret = process.env.AIDA_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [encodedPayload, encodedSignature, extra] = value.split(".");
  if (!encodedPayload || !encodedSignature || extra !== undefined) return null;

  const expected = createHmac("sha256", secret).update(encodedPayload).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const session = parsed as Record<string, unknown>;
    if (typeof session.sub !== "string" || !session.sub.trim()) return null;
    if (typeof session.tenantId !== "string" || !session.tenantId.trim()) return null;
    if (session.role !== "owner" && session.role !== "admin") return null;
    if (typeof session.exp !== "number" || !Number.isSafeInteger(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return { sub: session.sub, tenantId: session.tenantId, role: session.role, exp: session.exp };
  } catch {
    return null;
  }
}
