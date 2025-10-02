import express, {
  Request,
  Response,
} from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = express.Router();

const createSurveySchema = z.object({
  name: z.string().min(1),
  questions: z.array(z.string()).optional(),
  meta: z.unknown().optional(),
});

const updateSurveySchema = z.object({
  name: z.string().min(1).optional(),
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

    const survey = await prisma.survey.create({
      data: {
        name: parsed.data.name,
        meta: parsed.data.meta as any,
      },
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
    const { id, name, addedAt, editedAt, meta } =
      full;
    const payload: SurveyResponse = {
      id,
      name,
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
          addedAt,
          editedAt,
          meta,
        } = s;
        return {
          id,
          name,
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
    const { id, name, addedAt, editedAt, meta } =
      s;
    const mapped: SurveyResponse = {
      id,
      name,
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
      await prisma.survey.update({
        where: { id: req.params.id },
        data: {
          name: parsed.data.name,
          meta: parsed.data.meta as any,
        },
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
        addedAt,
        editedAt,
        meta,
      } = full;
      const mapped: SurveyResponse = {
        id,
        name,
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
      await prisma.survey.delete({
        where: { id: req.params.id },
      });
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
