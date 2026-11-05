/**
 * Lightweight JWT payload decoder to extract user claims (sub, email, exp, amr)
 * on the client without requiring external dependencies or separate ID tokens.
 */
export interface JwtAmrEntry {
  method?: string;
  timestamp?: number;
}

export interface JwtClaims {
  sub?: string;
  email?: string;
  exp?: number;
  amr?: Array<JwtAmrEntry | string>;
  [key: string]: unknown;
}

function parseRawJwtPayload(jwt: string): JwtClaims | null {
  if (!jwt || typeof jwt !== "string") {
    return null;
  }

  const parts = jwt.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as JwtClaims;
  } catch {
    return null;
  }
}

export function isJwtExpired(jwt: string): boolean {
  const claims = parseRawJwtPayload(jwt);
  if (!claims) {
    return true;
  }
  if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
    return true;
  }
  return false;
}

export function decodeJwtPayload(jwt: string): JwtClaims | null {
  const claims = parseRawJwtPayload(jwt);
  if (!claims) {
    return null;
  }
  if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
    return null;
  }
  return claims;
}

export function isRecoveryJwt(jwt: string): boolean {
  const claims = decodeJwtPayload(jwt);
  if (!claims || !Array.isArray(claims.amr)) {
    return false;
  }
  return claims.amr.some((entry) => {
    if (typeof entry === "string") {
      return entry === "recovery";
    }
    return typeof entry === "object" && entry !== null && entry.method === "recovery";
  });
}

export function getUserIdFromJwt(jwt: string): string {
  const claims = decodeJwtPayload(jwt);
  return typeof claims?.sub === "string" ? claims.sub : "";
}
