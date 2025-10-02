import {
  vi,
  describe,
  it,
  beforeEach,
  expect,
} from "vitest";
import request from "supertest";

// Mock prisma module with plain functions. We'll replace them with vi.fn()
// in beforeEach so we don't reference `vi` during the mock factory execution.
vi.mock("../src/prisma", () => ({
  default: {
    question: {
      create: () => {},
      findMany: () => {},
      findUnique: () => {},
      update: () => {},
      delete: () => {},
    },
  },
}));

import prisma from "../src/prisma";
import app from "../src/index";

describe("Questions CRUD (mocked Prisma)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Replace the plain functions from the mock factory with vi.fn() so
    // tests can set mockResolvedValue / assertions on them.
    (prisma as any).question.create = vi.fn();
    (prisma as any).question.findMany = vi.fn();
    (prisma as any).question.findUnique = vi.fn();
    (prisma as any).question.update = vi.fn();
    (prisma as any).question.delete = vi.fn();
  });

  it("POST /api/questions - creates a question", async () => {
    const created = {
      id: "q1",
      question: "Q?",
      addedAt: new Date(),
      editedAt: new Date(),
      meta: null,
    };
    (
      prisma as any
    ).question.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/questions")
      .send({ question: "Q?" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: "q1",
      question: "Q?",
    });
    expect(
      (prisma as any).question.create,
    ).toHaveBeenCalledWith({
      data: { question: "Q?", meta: undefined },
    });
  });

  it("GET /api/questions - returns list", async () => {
    const list = [{ id: "q1", question: "Q1" }];
    (
      prisma as any
    ).question.findMany.mockResolvedValue(list);
    const res = await request(app).get(
      "/api/questions",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual(list);
    expect(
      (prisma as any).question.findMany,
    ).toHaveBeenCalled();
  });

  it("GET /api/questions/:id - 404 when not found", async () => {
    (
      prisma as any
    ).question.findUnique.mockResolvedValue(null);
    const res = await request(app).get(
      "/api/questions/missing",
    );
    expect(res.status).toBe(404);
  });

  it("PUT /api/questions/:id - updates and returns updated", async () => {
    const updated = {
      id: "q1",
      question: "Updated",
    };
    (
      prisma as any
    ).question.update.mockResolvedValue(updated);
    const res = await request(app)
      .put("/api/questions/q1")
      .send({ question: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(
      (prisma as any).question.update,
    ).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { question: "Updated" },
    });
  });

  it("DELETE /api/questions/:id - returns 204 on success", async () => {
    (
      prisma as any
    ).question.delete.mockResolvedValue({});
    const res = await request(app).delete(
      "/api/questions/q1",
    );
    expect(res.status).toBe(204);
    expect(
      (prisma as any).question.delete,
    ).toHaveBeenCalledWith({
      where: { id: "q1" },
    });
  });
});
