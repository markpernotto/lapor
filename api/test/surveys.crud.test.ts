import {
  vi,
  describe,
  it,
  beforeEach,
  expect,
} from "vitest";
import request from "supertest";

let mockSurveyCreate: any;
let mockSurveyFindMany: any;
let mockSurveyFindUnique: any;
let mockSurveyUpdate: any;
let mockSurveyDelete: any;
let mockSurveyQuestionCreateMany: any;
let mockSurveyQuestionDeleteMany: any;

vi.mock("../src/prisma", () => ({
  default: {
    survey: {
      create: () => {},
      findMany: () => {},
      findUnique: () => {},
      update: () => {},
      delete: () => {},
    },
    surveyQuestion: {
      createMany: () => {},
      deleteMany: () => {},
    },
    question: {
      findMany: () => {},
    },
  },
}));

import prisma from "../src/prisma";
import app from "../src/index";

describe("Surveys CRUD (mocked Prisma)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSurveyCreate = vi.fn();
    mockSurveyFindMany = vi.fn();
    mockSurveyFindUnique = vi.fn();
    mockSurveyUpdate = vi.fn();
    mockSurveyDelete = vi.fn();
    mockSurveyQuestionCreateMany = vi.fn();
    mockSurveyQuestionDeleteMany = vi.fn();
    (prisma as any).survey.create =
      mockSurveyCreate;
    (prisma as any).survey.findMany =
      mockSurveyFindMany;
    (prisma as any).survey.findUnique =
      mockSurveyFindUnique;
    (prisma as any).survey.update =
      mockSurveyUpdate;
    (prisma as any).survey.delete =
      mockSurveyDelete;
    (prisma as any).surveyQuestion.createMany =
      mockSurveyQuestionCreateMany;
    (prisma as any).surveyQuestion.deleteMany =
      mockSurveyQuestionDeleteMany;
    (prisma as any).question.findMany = vi.fn();
    // the route now uses prisma.$transaction to delete surveyQuestion rows then survey
    (prisma as any).$transaction = vi
      .fn()
      .mockResolvedValue([]);
  });

  it("POST /api/surveys - creates a survey and surveyQuestion entries", async () => {
    (
      prisma as any
    ).survey.create.mockResolvedValue({
      id: "s1",
      name: "S1",
      meta: null,
    });
    (
      prisma as any
    ).surveyQuestion.createMany.mockResolvedValue(
      { count: 2 },
    );
    // After creation the route loads the full survey via findUnique; mock it
    (
      prisma as any
    ).survey.findUnique.mockResolvedValue({
      id: "s1",
      name: "S1",
      addedAt: new Date(),
      editedAt: new Date(),
      meta: null,
      questions: [
        {
          id: "sq1",
          surveyId: "s1",
          questionId: "q1",
          order: 0,
          question: {
            id: "q1",
            question: "Q1",
            addedAt: new Date(),
            editedAt: new Date(),
            meta: null,
          },
        },
        {
          id: "sq2",
          surveyId: "s1",
          questionId: "q2",
          order: 1,
          question: {
            id: "q2",
            question: "Q2",
            addedAt: new Date(),
            editedAt: new Date(),
            meta: null,
          },
        },
      ],
    });
    const res = await request(app)
      .post("/api/surveys")
      .send({
        name: "S1",
        questions: ["q1", "q2"],
      });
    expect(res.status).toBe(201);
    expect(
      (prisma as any).survey.create,
    ).toHaveBeenCalledWith({
      data: { name: "S1", meta: undefined },
    });
    // ensure the created SurveyQuestion rows preserve the requested order
    expect(
      (prisma as any).surveyQuestion.createMany,
    ).toHaveBeenCalledWith({
      data: [
        {
          surveyId: "s1",
          questionId: "q1",
          order: 0,
        },
        {
          surveyId: "s1",
          questionId: "q2",
          order: 1,
        },
      ],
    });
  });

  it("GET /api/surveys - returns list", async () => {
    (
      prisma as any
    ).survey.findMany.mockResolvedValue([]);
    const res = await request(app).get(
      "/api/surveys",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/surveys/:id - 404 when not found", async () => {
    (
      prisma as any
    ).survey.findUnique.mockResolvedValue(null);
    const res = await request(app).get(
      "/api/surveys/missing",
    );
    expect(res.status).toBe(404);
  });

  it("PUT /api/surveys/:id - updates survey and questions", async () => {
    (
      prisma as any
    ).survey.update.mockResolvedValue({
      id: "s1",
      name: "Updated",
    });
    (
      prisma as any
    ).surveyQuestion.deleteMany.mockResolvedValue(
      { count: 0 },
    );
    (
      prisma as any
    ).surveyQuestion.createMany.mockResolvedValue(
      { count: 1 },
    );
    // After update the route loads the survey; mock findUnique to return the updated survey
    (
      prisma as any
    ).survey.findUnique.mockResolvedValue({
      id: "s1",
      name: "Updated",
      addedAt: new Date(),
      editedAt: new Date(),
      meta: null,
      questions: [
        {
          id: "sq1",
          surveyId: "s1",
          questionId: "q1",
          order: 0,
          question: {
            id: "q1",
            question: "Q1",
            addedAt: new Date(),
            editedAt: new Date(),
            meta: null,
          },
        },
      ],
    });
    const res = await request(app)
      .put("/api/surveys/s1")
      .send({
        name: "Updated",
        questions: ["q1"],
      });
    expect(res.status).toBe(200);
    expect(
      (prisma as any).survey.update,
    ).toHaveBeenCalled();
    expect(
      (prisma as any).surveyQuestion.deleteMany,
    ).toHaveBeenCalledWith({
      where: { surveyId: "s1" },
    });
    // ensure SurveyQuestion.createMany was called with ordered positions
    expect(
      (prisma as any).surveyQuestion.createMany,
    ).toHaveBeenCalledWith({
      data: [
        {
          surveyId: "s1",
          questionId: "q1",
          order: 0,
        },
      ],
    });
  });

  it("DELETE /api/surveys/:id - returns 204 on success", async () => {
    (
      prisma as any
    ).survey.delete.mockResolvedValue({});
    const res = await request(app).delete(
      "/api/surveys/s1",
    );
    expect(res.status).toBe(204);
  });
});
