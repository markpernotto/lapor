import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
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
    } catch (e) {
      // Docker not available — skip integration test by making it a no-op
      // (Vitest will count this as a passing test)
      // eslint-disable-next-line no-console
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

    // Start Postgres
    execSync(composeUpCmd, {
      cwd: process.cwd(),
      stdio: "inherit",
      timeout: 120000,
    });

    // Wait for Postgres port
    await waitForPort("127.0.0.1", 5432, 30000);

    // Run migrations
    execSync("npx prisma migrate deploy", {
      cwd: process.cwd(),
      stdio: "inherit",
      timeout: 120000,
    });

    // Start the server in background
    execSync(
      "nohup node dist/index.js &>/tmp/lapor_integration.log & echo $!",
      { cwd: process.cwd(), timeout: 5000 },
    );
    await waitForPort("127.0.0.1", 4000, 10000);

    // Run a simple API flow
    const res = await request(
      "http://localhost:4000",
    ).get("/api/questions");
    expect(res.status).toBe(200);

    // Teardown
    execSync(composeDownCmd, {
      cwd: process.cwd(),
      stdio: "inherit",
      timeout: 120000,
    });
  }, 180000);
});
