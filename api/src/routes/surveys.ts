import express, {
  Request,
  Response,
} from "express";
import { z } from "zod";
import prisma from "../prisma";
import { Prisma } from "@prisma/client";

const router = express.Router();

const createSurveySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  synopsis: z.string().optional(),
  questions: z.array(z.string()).optional(),
  meta: z.unknown().optional(),
});

const updateSurveySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  synopsis: z.string().optional(),
  questions: z.array(z.string()).optional(),
  meta: z.unknown().optional(),
});

// Local types that match the Prisma query include shapes
type QuestionRow = {
  id: string;
  question: string;
  addedAt: Date;
  editedAt: Date;
  meta: unknown | null;
};
type SurveyQuestionRow = {
  id: string;
  surveyId: string;
  questionId: string;
  order: number;
  question: QuestionRow;
};
type SurveyWithQuestions = {
  id: string;
  name: string;
  description?: string | null;
  synopsis?: string | null;
  addedAt: Date;
  editedAt: Date;
  meta: unknown | null;
  questions: SurveyQuestionRow[];
};
type SurveyResponse = Omit<
  SurveyWithQuestions,
  "questions"
> & { questions: QuestionRow[] };

router.post(
  "/",
  async (req: Request, res: Response) => {
    const parsed = createSurveySchema.safeParse(
      req.body,
    );
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.errors });

    const createData: Prisma.SurveyCreateInput = {
      name: parsed.data.name,
      description:
        parsed.data.description ?? null,
      synopsis: parsed.data.synopsis ?? null,
      meta: parsed.data.meta ?? null,
    } as unknown as Prisma.SurveyCreateInput;
    const survey = await prisma.survey.create({
      data: createData,
    });

    if (
      parsed.data.questions &&
      parsed.data.questions.length > 0
    ) {
      const createMany =
        parsed.data.questions.map(
          (qid: string, idx: number) => ({
            surveyId: survey.id,
            questionId: qid,
            order: idx,
          }),
        );
      await prisma.surveyQuestion.createMany({
        data: createMany,
      });
    }

    const full = (await prisma.survey.findUnique({
      where: { id: survey.id },
      include: {
        questions: {
          include: { question: true },
        },
      },
    })) as SurveyWithQuestions | null;
    if (!full)
      return res.status(500).json({
        error: "failed to load created survey",
      });

    const questions = full.questions
      .slice()
      .sort(
        (
          a: SurveyQuestionRow,
          b: SurveyQuestionRow,
        ) => a.order - b.order,
      )
      .map((q: SurveyQuestionRow) => q.question);
    const {
      id,
      name,
      description,
      synopsis,
      addedAt,
      editedAt,
      meta,
    } = full;
    const payload: SurveyResponse = {
      id,
      name,
      description: description ?? null,
      synopsis: synopsis ?? null,
      addedAt,
      editedAt,
      meta,
      questions,
    };
    res.status(201).json(payload);
  },
);

router.get(
  "/",
  async (_req: Request, res: Response) => {
    const list = (await prisma.survey.findMany({
      include: {
        questions: {
          include: { question: true },
        },
      },
    })) as SurveyWithQuestions[];
    const mapped: SurveyResponse[] = list.map(
      (s: SurveyWithQuestions) => {
        const questions = s.questions
          .slice()
          .sort(
            (
              a: SurveyQuestionRow,
              b: SurveyQuestionRow,
            ) => a.order - b.order,
          )
          .map(
            (q: SurveyQuestionRow) => q.question,
          );
        const {
          id,
          name,
          description,
          synopsis,
          addedAt,
          editedAt,
          meta,
        } = s;
        return {
          id,
          name,
          description: description ?? null,
          synopsis: synopsis ?? null,
          addedAt,
          editedAt,
          meta,
          questions,
        };
      },
    );
    res.json(mapped);
  },
);

router.get(
  "/:id",
  async (req: Request, res: Response) => {
    const s = (await prisma.survey.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          include: { question: true },
        },
      },
    })) as SurveyWithQuestions | null;
    if (!s)
      return res
        .status(404)
        .json({ error: "not found" });
    const questions = s.questions
      .slice()
      .sort(
        (
          a: SurveyQuestionRow,
          b: SurveyQuestionRow,
        ) => a.order - b.order,
      )
      .map((q: SurveyQuestionRow) => q.question);
    const {
      id,
      name,
      description,
      synopsis,
      addedAt,
      editedAt,
      meta,
    } = s;
    const mapped: SurveyResponse = {
      id,
      name,
      description: description ?? null,
      synopsis: synopsis ?? null,
      addedAt,
      editedAt,
      meta,
      questions,
    };
    res.json(mapped);
  },
);

router.put(
  "/:id",
  async (req: Request, res: Response) => {
    const parsed = updateSurveySchema.safeParse(
      req.body,
    );
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.errors });

    try {
      const updateData: Record<string, unknown> =
        {};
      if (parsed.data.name !== undefined)
        updateData.name = parsed.data.name;
      if (parsed.data.description !== undefined)
        updateData.description =
          parsed.data.description;
      if (parsed.data.synopsis !== undefined)
        updateData.synopsis =
          parsed.data.synopsis;
      if (parsed.data.meta !== undefined)
        updateData.meta = parsed.data.meta;
      await prisma.survey.update({
        where: { id: req.params.id },
        data: updateData as unknown as Prisma.SurveyUpdateInput,
      });

      if (parsed.data.questions) {
        await prisma.surveyQuestion.deleteMany({
          where: { surveyId: req.params.id },
        });
        const createMany =
          parsed.data.questions.map(
            (qid: string, idx: number) => ({
              surveyId: req.params.id,
              questionId: qid,
              order: idx,
            }),
          );
        if (createMany.length)
          await prisma.surveyQuestion.createMany({
            data: createMany,
          });
      }

      const full =
        (await prisma.survey.findUnique({
          where: { id: req.params.id },
          include: {
            questions: {
              include: { question: true },
            },
          },
        })) as SurveyWithQuestions | null;
      if (!full)
        return res
          .status(404)
          .json({ error: "not found" });

      const questions = full.questions
        .slice()
        .sort(
          (
            a: SurveyQuestionRow,
            b: SurveyQuestionRow,
          ) => a.order - b.order,
        )
        .map(
          (q: SurveyQuestionRow) => q.question,
        );
      const {
        id,
        name,
        description,
        synopsis,
        addedAt,
        editedAt,
        meta,
      } = full;
      const mapped: SurveyResponse = {
        id,
        name,
        description: description ?? null,
        synopsis: synopsis ?? null,
        addedAt,
        editedAt,
        meta,
        questions,
      };
      res.json(mapped);
    } catch (e) {
      console.error(e);
      res
        .status(404)
        .json({ error: "not found" });
    }
  },
);

router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      // remove any SurveyQuestion rows referencing this survey first
      await prisma.$transaction([
        prisma.surveyQuestion.deleteMany({
          where: { surveyId: req.params.id },
        }),
        prisma.survey.delete({
          where: { id: req.params.id },
        }),
      ]);
      res.status(204).end();
    } catch (e) {
      console.error(e);
      res
        .status(404)
        .json({ error: "not found" });
    }
  },
);

export default router;
