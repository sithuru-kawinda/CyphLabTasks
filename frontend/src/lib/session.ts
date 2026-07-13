import type { Role } from "@/types";

export interface SessionPayload {
  sub: string;
  role: Role;
  exp: number;
}

/**
 * Decodes (does not cryptographically verify) the JWT payload for optimistic,
 * UX-level route gating in proxy.ts. The backend independently re-verifies the
 * signature and re-checks role/ownership on every request, so an unverified
 * decode here carries no security risk — worst case is a redirect skipped,
 * never an unauthorized action performed.
 */
export function decodeToken(token: string): SessionPayload | null {
  try {
    const payloadSegment = token.split(".")[1];
    const json = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;

    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
