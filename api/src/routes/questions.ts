import express, {
  Request,
  Response,
} from "express";
import { z } from "zod";
import prisma from "../prisma";

const router = express.Router();

const createQuestionSchema = z.object({
  question: z.string().min(1),
  meta: z.unknown().optional(),
});

router.post(
  "/",
  async (req: Request, res: Response) => {
    const parsed = createQuestionSchema.safeParse(
      req.body,
    );
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.errors });

    const q = await prisma.question.create({
      data: {
        question: parsed.data.question,
        meta: parsed.data.meta as any,
      },
    });
    res.status(201).json(q);
  },
);

router.get(
  "/",
  async (req: Request, res: Response) => {
    const list = await prisma.question.findMany();
    res.json(list);
  },
);

router.get(
  "/:id",
  async (req: Request, res: Response) => {
    const q = await prisma.question.findUnique({
      where: { id: req.params.id },
    });
    if (!q)
      return res
        .status(404)
        .json({ error: "not found" });
    res.json(q);
  },
);

const updateQuestionSchema = z.object({
  question: z.string().min(1).optional(),
  meta: z.unknown().optional(),
});

router.put(
  "/:id",
  async (req: Request, res: Response) => {
    const parsed = updateQuestionSchema.safeParse(
      req.body,
    );
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: parsed.error.errors });

    try {
      const updateData: Record<string, unknown> =
        {};
      if (parsed.data.question !== undefined)
        updateData.question =
          parsed.data.question;
      if (parsed.data.meta !== undefined)
        updateData.meta = parsed.data.meta as any;
      const updated =
        await prisma.question.update({
          where: { id: req.params.id },
          data: updateData,
        });
      res.json(updated);
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
      await prisma.question.delete({
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
