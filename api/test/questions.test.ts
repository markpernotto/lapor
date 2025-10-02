import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index";

describe("Questions API (smoke)", () => {
  it("GET /api/questions returns 200 and JSON array", async () => {
    const res = await request(app).get(
      "/api/questions",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
