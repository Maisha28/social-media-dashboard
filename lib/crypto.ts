/**
 * Small crypto helpers built on Web Crypto so the same code runs in the Node
 * runtime (route handlers) and the Edge runtime (middleware).
 *
 * These sign and encrypt with AUTH_SECRET. If AUTH_SECRET is unset the caller
 * falls back to a development key — see lib/session.ts.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Copies a view into a standalone ArrayBuffer.
 *
 * Web Crypto's BufferSource parameters reject `Uint8Array<ArrayBufferLike>`,
 * which is what typed-array constructors widen to. Copying gives us a concrete
 * ArrayBuffer that every overload accepts.
 */
function toBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

function utf8(value: string): ArrayBuffer {
  return toBuffer(encoder.encode(value));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function aesKey(secret: string): Promise<CryptoKey> {
  // AES-GCM needs exactly 256 bits; hashing the secret makes any length work.
  const digest = await crypto.subtle.digest("SHA-256", utf8(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Signs a JSON payload into a `<payload>.<signature>` token. */
export async function sign(payload: unknown, secret: string): Promise<string> {
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, utf8(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** Verifies a token produced by `sign`. Returns null on any tampering. */
export async function verify<T>(token: string, secret: string): Promise<T | null> {
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      utf8(body),
    );
    if (!valid) return null;

    return JSON.parse(decoder.decode(base64UrlDecode(body))) as T;
  } catch {
    return null;
  }
}

/** Encrypts a string (used for third-party access tokens at rest). */
export async function encryptString(plaintext: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(secret);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBuffer(iv) },
    key,
    utf8(plaintext),
  );
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
}

export async function decryptString(payload: string, secret: string): Promise<string | null> {
  try {
    const [ivPart, dataPart] = payload.split(".");
    if (!ivPart || !dataPart) return null;
    const key = await aesKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlDecode(ivPart) },
      key,
      base64UrlDecode(dataPart),
    );
    return decoder.decode(plaintext);
  } catch {
    return null;
  }
}

export function randomToken(bytes = 24): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}
