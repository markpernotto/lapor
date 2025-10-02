import { z } from "zod";

const API = "/api";

export async function fetchJSON<T>(
  path: string,
  opts?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...opts,
  });
  if (!res.ok)
    throw new Error(
      `Request failed: ${res.status}`,
    );
  return res.json();
}

export const questionSchema = z.object({
  uuid: z.string().uuid(),
  question: z.string(),
  addedAt: z.string(),
  editedAt: z.string().nullable(),
  meta: z.any(),
});

export const surveySchema = z.object({
  uuid: z.string().uuid(),
  name: z.string(),
  addedAt: z.string(),
  editedAt: z.string().nullable(),
  questions: z.array(z.string().uuid()),
  meta: z.any(),
});

export type Question = z.infer<
  typeof questionSchema
>;
export type Survey = z.infer<typeof surveySchema>;

export async function getQuestions(): Promise<
  Question[]
> {
  return fetchJSON<Question[]>("/questions");
}

export async function getSurveys(): Promise<
  Survey[]
> {
  return fetchJSON<Survey[]>("/surveys");
}
