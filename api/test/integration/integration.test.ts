import { describe, it, expect } from "vitest";
import { execSync, spawn } from "child_process";
import fs from "fs";
import request from "supertest";
import net from "net";

async function waitForPort(
  host: string,
  port: number,
  timeoutMs = 30000,
) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      const sock = new net.Socket();
      sock.setTimeout(1000);
      sock.on("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs)
          reject(new Error("timeout"));
        else setTimeout(check, 500);
      });
      sock.on("timeout", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs)
          reject(new Error("timeout"));
        else setTimeout(check, 500);
      });
      sock.connect(port, host);
    };
    check();
  });
}

describe("Integration tests (docker + real Postgres)", () => {
  it("brings up db and runs a smoke flow", async () => {
    // Quick check: skip the integration test if Docker is not available to avoid hangs.
    try {
      execSync("docker info", {
        stdio: "ignore",
        timeout: 5000,
      });
    } catch {
      // Docker not available — skip integration test by making it a no-op
      // (Vitest will count this as a passing test)
      console.warn(
        "Docker not available, skipping integration test.",
      );
      return;
    }

    // Determine which docker compose command is available: prefer the legacy
    // `docker-compose` binary, fall back to `docker compose` (Docker CLI v2).
    let composeUpCmd = "docker-compose up -d db";
    let composeDownCmd = "docker-compose down";
    try {
      execSync("docker-compose --version", {
        stdio: "ignore",
        timeout: 2000,
      });
    } catch {
      // Try the newer `docker compose` subcommand
      try {
        execSync("docker compose version", {
          stdio: "ignore",
          timeout: 2000,
        });
        composeUpCmd = "docker compose up -d db";
        composeDownCmd = "docker compose down";
      } catch {
        // No docker compose available — skip integration test
        console.warn(
          "docker-compose and 'docker compose' not available, skipping integration test.",
        );
        return;
      }
    }

    // Start Postgres if the Postgres port isn't already in use. In some CI
    // environments a postgres service may already be running and binding
    // 5432; attempting `docker compose up` would then fail with "port is
    // already allocated". Check the port first and only run compose when
    // necessary. Track whether we started the compose-managed container so
    // we only tear it down when we started it.
    let broughtUp = false;
    // Allow overriding the Postgres host port used for integration tests via
    // INTEGRATION_PG_PORT (useful in CI where we bind to a non-standard host
    // port to avoid collisions). Defaults to 5432.
    const pgPort = Number(
      process.env.INTEGRATION_PG_PORT || "5432",
    );
    let portInUse = false;
    try {
      // quick check: treat a successful connection as port-in-use
      // (waitForPort resolves if the port is open).
      // Use a short timeout so this doesn't delay the test too long.
      await waitForPort(
        "127.0.0.1",
        pgPort,
        1000,
      );
      portInUse = true;
    } catch {
      portInUse = false;
    }

    if (portInUse) {
      console.warn(
        `Postgres port ${pgPort} appears to be in use; skipping docker compose up and reusing existing Postgres for integration test.`,
      );
    } else {
      // Start Postgres
      execSync(composeUpCmd, {
        cwd: process.cwd(),
        stdio: "inherit",
        timeout: 120000,
      });
      broughtUp = true;

      // Wait for Postgres port
      await waitForPort(
        "127.0.0.1",
        pgPort,
        30000,
      );
    }

    // Run migrations. Ensure DATABASE_URL points at the integration Postgres
    // instance (container or pre-existing). Prisma reads DATABASE_URL from
    // environment.
    const dbUrl =
      process.env.DATABASE_URL ||
      `postgresql://postgres:password@127.0.0.1:${pgPort}/lapor_dev`;
    execSync(`npx prisma migrate deploy`, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
      stdio: "inherit",
      timeout: 120000,
    });

    // Start the server in background using spawn so logs are captured
    // reliably and we avoid shell timeouts. Record the PID so we can kill
    // it in teardown.
    const logPath = "/tmp/lapor_integration.log";
    fs.writeFileSync(logPath, "", { flag: "w" });
    let serverPid: number | undefined;
    try {
      const child = spawn(
        "node",
        ["dist/index.js"],
        {
          cwd: process.cwd(),
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      serverPid = child.pid;
      const outStream = fs.createWriteStream(
        logPath,
        { flags: "a" },
      );
      if (child.stdout)
        child.stdout.pipe(outStream);
      if (child.stderr)
        child.stderr.pipe(outStream);
      child.unref();

      // Wait for server to listen
      await waitForPort("127.0.0.1", 4000, 20000);

      // Run a simple API flow
      const res = await request(
        "http://localhost:4000",
      ).get("/api/questions");
      expect(res.status).toBe(200);
    } catch (err) {
      // If starting the server or the flow failed, include the log tail and
      // rethrow for CI to surface.
      try {
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(
            logPath,
            "utf8",
          );
          console.error(
            "--- /tmp/lapor_integration.log (tail) ---\n" +
              content
                .split("\n")
                .slice(-200)
                .join("\n"),
          );
        }
      } catch (readErr) {
        console.error(
          `(failed to read log: ${readErr})`,
        );
      }
      throw err;
    } finally {
      // Teardown: only stop the compose stack if we started it.
      if (
        typeof broughtUp !== "undefined" &&
        broughtUp
      ) {
        try {
          execSync(composeDownCmd, {
            cwd: process.cwd(),
            stdio: "inherit",
            timeout: 120000,
          });
        } catch (downErr) {
          console.error(
            `Error tearing down compose stack: ${downErr}`,
          );
        }
      }
      // Kill spawned server process if we started it
      try {
        if (typeof serverPid !== "undefined")
          process.kill(serverPid);
      } catch (killErr) {
        console.error(
          `Failed to kill server process ${serverPid}: ${killErr}`,
        );
      }
    }
  }, 180000);
});
