import fs from "fs";
import process from "process";
import {
  createRemoteJWKSet,
  jwtVerify,
} from "jose";

async function main() {
  const envRaw = fs.readFileSync(
    "./api/.env",
    "utf8",
  );
  const kv = Object.fromEntries(
    envRaw
      .split(/\n/)
      .filter(Boolean)
      .map((l) => l.split("=", 2)),
  );
  const tenant = kv.AZURE_TENANT_ID;
  const clientId = kv.AZURE_CLIENT_ID;
  const appIdUri = kv.AZURE_APP_ID_URI;
  if (!tenant) {
    console.error(
      "no AZURE_TENANT_ID in api/.env",
    );
    process.exit(2);
  }
  const jwksUrl = `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`;
  const jwks = createRemoteJWKSet(
    new URL(jwksUrl),
  );
  const token = process.env.TOKEN;
  if (!token) {
    console.error(
      "Pass the token in the TOKEN env var",
    );
    process.exit(2);
  }

  const options = {
    issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
    audience: [clientId].concat(
      appIdUri ? [appIdUri] : [],
    ),
  };

  console.log(
    "verifying token with options:",
    options,
  );
  try {
    const { payload } = await jwtVerify(
      token,
      jwks,
      options,
    );
    console.log(
      "verification succeeded; payload:",
    );
    console.log(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error("verification failed:");
    if (err instanceof Error) {
      console.error("name:", err.name);
      console.error("message:", err.message);
      console.error(err.stack);
    } else {
      console.error(err);
    }
    // Also decode payload without verification for inspection
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payloadRaw = parts[1];
        const b64 = payloadRaw
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        const pad = b64.length % 4;
        const padded =
          b64 + (pad ? "=".repeat(4 - pad) : "");
        const decoded = Buffer.from(
          padded,
          "base64",
        ).toString("utf8");
        console.log(
          "\ndecoded (unverified) payload:\n",
          JSON.stringify(
            JSON.parse(decoded),
            null,
            2,
          ),
        );
      }
    } catch (e) {
      console.error(
        "failed to decode payload",
        e,
      );
    }
    process.exit(1);
  }
}

main();
