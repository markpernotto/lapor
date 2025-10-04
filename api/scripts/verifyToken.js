const {
  createRemoteJWKSet,
  jwtVerify,
} = require("jose");
const fs = require("fs");

async function main() {
  const token = process.env.TOKEN;
  if (!token) {
    console.error(
      "Usage: TOKEN=<token> node scripts/verifyToken.js",
    );
    process.exit(2);
  }
  // Load api/.env relative to this script so the verifier can be run from any cwd
  const path = require("path");
  const envPath = path.resolve(
    __dirname,
    "..",
    ".env",
  );
  let envRaw;
  try {
    envRaw = fs.readFileSync(envPath, "utf8");
  } catch (e) {
    console.error(
      `failed to read ${envPath}:`,
      e.message,
    );
    process.exit(2);
  }

  // parse key=value lines, ignore comments and empty lines, trim whitespace
  const kv = Object.fromEntries(
    envRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        if (idx === -1) return [l, ""];
        const k = l.slice(0, idx).trim();
        const v = l.slice(idx + 1).trim();
        return [k, v];
      }),
  );

  const tenant = kv.AZURE_TENANT_ID;
  const clientId = kv.AZURE_CLIENT_ID;
  const appIdUri = kv.AZURE_APP_ID_URI;
  if (!tenant) {
    console.error(
      `no AZURE_TENANT_ID in ${envPath}`,
    );
    process.exit(2);
  }

  const jwksUrl = `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys`;
  const jwks = createRemoteJWKSet(
    new URL(jwksUrl),
  );

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
    console.error(
      err && err.name,
      err && err.message,
    );
    try {
      const parts = token.split(".");
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
