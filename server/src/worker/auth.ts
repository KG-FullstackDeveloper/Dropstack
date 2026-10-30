import type { Context, MiddlewareHandler } from "hono";
import type { WorkerEnvironment } from "./types";

interface JwtPayload {
  sub?: string;
  email?: string;
  exp?: number;
  iat?: number;
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");

  const binary = atob(normalized);

  return Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );
}

export async function createWorkerToken(
  payload: JwtPayload,
  secret: string,
  lifetimeSeconds = 3600,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const claims = {
    ...payload,
    iat: now,
    exp: now + lifetimeSeconds,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(claims));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const key = await importSigningKey(secret);

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(unsignedToken),
  );

  const signatureBytes = new Uint8Array(signature);
  let binary = "";

  for (const byte of signatureBytes) {
    binary += String.fromCharCode(byte);
  }

  const encodedSignature = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${encodedSignature}`;
}

export async function verifyWorkerToken(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const header = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedHeader)),
    ) as { alg?: string; typ?: string };

    if (header.alg !== "HS256") {
      return null;
    }

    const key = await importSigningKey(secret);

    const signature = decodeBase64Url(encodedSignature);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as BufferSource,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= now
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export const workerAuthMiddleware: MiddlewareHandler<WorkerEnvironment> =
  async (c, next) => {
    const authorization = c.req.header("Authorization") ?? "";
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      return c.json(
        { success: false, error: "Authentication required." },
        401,
      );
    }

    const secret = c.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return c.json(
        { success: false, error: "Authentication is not configured." },
        503,
      );
    }

    const payload = await verifyWorkerToken(match[1], secret);

    if (!payload?.sub || !payload.email) {
      return c.json(
        { success: false, error: "Invalid or expired session." },
        401,
      );
    }

    c.set("adminId", payload.sub);
    c.set("adminEmail", payload.email);

    await next();
  };

export function getAuthenticatedAdmin(
  c: Context<WorkerEnvironment>,
) {
  return {
    id: c.get("adminId"),
    email: c.get("adminEmail"),
  };
}