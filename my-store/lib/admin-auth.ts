
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_COOKIE_NAME = "ss-admin-session";
export const ADMIN_SESSION_DURATION = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or invalid");
  }

  return secret;
}

export function createAdminToken(adminId: string) {
  const payload = {
    adminId,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_DURATION,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

export function verifyAdminRequest(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const cookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${ADMIN_COOKIE_NAME}=`));

    if (!cookie) return null;

    const token = cookie.slice(ADMIN_COOKIE_NAME.length + 1);
    const parts = token.split(".");

    if (parts.length !== 2) return null;

    const [data, signature] = parts;

    const expectedSignature = createHmac("sha256", getSecret())
      .update(data)
      .digest();

    const actualSignature = Buffer.from(signature, "base64url");

    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    );

    if (
      typeof payload.adminId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}
