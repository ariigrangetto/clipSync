/**
 * Lightweight JWT payload decoder to extract user claims (sub, email)
 * on the client without requiring external dependencies or separate ID tokens.
 */
export interface JwtClaims {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwtPayload(jwt: string): JwtClaims | null {
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

export function getUserIdFromJwt(jwt: string): string {
  const claims = decodeJwtPayload(jwt);
  return typeof claims?.sub === "string" ? claims.sub : "";
}
