import {
  NextFunction,
  Request,
  Response,
} from "express";
import dotenv from "dotenv";
import prisma from "../prisma";
import {
  jwtVerify,
  createRemoteJWKSet,
  type JWTPayload,
  type JWTVerifyOptions,
} from "jose";

dotenv.config();

const tenant = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
// Optional: the App ID URI / audience that your API exposes. If you configured an App ID URI
// for your API in Azure AD, set AZURE_APP_ID_URI (for example: api://<client-id> or api://my-app)
const appIdUri = process.env.AZURE_APP_ID_URI;
// Optional: require a specific scope (for delegated tokens) or app role
const requiredScope =
  process.env.AZURE_REQUIRED_SCOPE;

if (!tenant) {
  // don't throw at import time in case some scripts don't need auth, but log to help debugging
  console.warn(
    "AZURE_TENANT_ID is not set. Azure token validation will fail until configured.",
  );
}

const issuer = tenant
  ? `https://login.microsoftonline.com/${tenant}/v2.0`
  : undefined;

/**
 * Returns a JWKS key resolver using jose.createRemoteJWKSet which handles caching
 * and key rotation automatically.
 */
function getJwks() {
  if (!issuer) return undefined;
  // The tenant JWKS lives at https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys
  // Note: `issuer` already contains the trailing `/v2.0`, so don't append another `/v2.0`.
  const jwksUrl = `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`;
  try {
    return createRemoteJWKSet(new URL(jwksUrl));
  } catch (err) {
    console.warn("createRemoteJWKSet error", err);
    return undefined;
  }
}

async function verifyAzureToken(token: string) {
  if (!issuer)
    throw new Error(
      "AZURE_TENANT_ID not configured",
    );
  const jwks = getJwks();
  if (!jwks)
    throw new Error(
      "unable to create JWKS resolver",
    );

  // Accept either the clientId or the App ID URI as the audience, if provided.
  const audiences = [clientId].filter(
    Boolean,
  ) as string[];
  if (appIdUri) audiences.push(appIdUri);

  const options: JWTVerifyOptions & {
    audience?: string | string[];
  } = { issuer };
  if (audiences.length > 0)
    options.audience = audiences;

  const { payload } = await jwtVerify(
    token,
    jwks,
    options,
  );
  return payload as JWTPayload;
}

export async function azureAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return res
        .status(401)
        .json({ error: "missing token" });
    const token = auth.slice("Bearer ".length);

    const payload = await verifyAzureToken(token);

    // typical email claim keys: preferred_username, email, upn
    const claims = payload as JWTPayload &
      Record<string, unknown>;
    const getStringClaim = (k: string) => {
      const v = claims[k];
      return typeof v === "string"
        ? v
        : undefined;
    };

    const email =
      getStringClaim("preferred_username") ??
      getStringClaim("email") ??
      getStringClaim("upn");
    const oid =
      getStringClaim("oid") ??
      getStringClaim("sub");

    if (!email && !oid)
      return res.status(401).json({
        error: "email/oid not found in token",
      });

    // Optional scope/role enforcement
    if (requiredScope) {
      // v2 tokens include 'scp' (space-separated) for delegated scopes and 'roles' for app roles
      const scp =
        (claims["scp"] as unknown) ?? undefined;
      const roles =
        (claims["roles"] as unknown) ?? undefined;
      const scpStr =
        typeof scp === "string" ? scp : undefined;
      const scpMatches = scpStr
        ? scpStr
            .split(" ")
            .includes(requiredScope)
        : false;
      const rolesArr = Array.isArray(roles)
        ? (roles as string[])
        : [];
      const roleMatches = rolesArr.includes(
        requiredScope,
      );
      if (!scpMatches && !roleMatches) {
        return res.status(403).json({
          error: "insufficient_scope_or_role",
        });
      }
    }

    // Attach minimal auth info to request (use a narrowed request type to avoid 'any')
    type AuthInfo = {
      email?: string;
      oid?: string;
      payload?: JWTPayload;
    };
    const reqWithAuth = req as Request & {
      auth?: AuthInfo;
    };
    reqWithAuth.auth = { email, oid, payload };
    next();
  } catch (e: unknown) {
    console.error("azureAuth error", String(e));
    return res
      .status(401)
      .json({ error: "invalid token" });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const reqWithAuth = req as Request & {
    auth?: { email?: string; oid?: string };
  };
  const auth = reqWithAuth.auth;
  if (!auth || (!auth.email && !auth.oid))
    return res
      .status(401)
      .json({ error: "not authenticated" });

  // Prefer mapping by azure oid -> AdminUser.azureId. Fallback to email if no azureId mapping exists.
  let user = null;
  if (auth.oid) {
    user = await prisma.adminUser.findUnique({
      where: { azureId: auth.oid },
    });
  }
  if (!user && auth.email) {
    user = await prisma.adminUser.findUnique({
      where: { email: auth.email },
    });
  }

  if (!user || !user.isAdmin || !user.active)
    return res
      .status(403)
      .json({ error: "forbidden" });

  const reqWithUser = req as Request & {
    user?: unknown;
  };
  reqWithUser.user = user;
  next();
}

export default azureAuthMiddleware;
