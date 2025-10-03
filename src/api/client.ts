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
  // read the body as text once so we can handle empty responses
  const raw = await res.text().catch(() => "");

  if (!res.ok) {
    // try to surface useful error information from the body
    try {
      const body = raw ? JSON.parse(raw) : null;
      const msg =
        body?.error ||
        body?.message ||
        JSON.stringify(body);
      throw new Error(
        `Request failed: ${res.status} - ${msg}`,
      );
    } catch (_err) {
      throw new Error(
        `Request failed: ${res.status} - ${raw}`,
      );
    }
  }

  // Handle 204 No Content or empty bodies for endpoints like DELETE
  if (res.status === 204 || raw.trim() === "") {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(
      `Invalid JSON response: ${String(err)}`,
    );
  }
}

export const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  addedAt: z.string(),
  editedAt: z.string().nullable(),
  meta: z.any(),
});

export const surveySchema = z.object({
  id: z.string(),
  name: z.string(),
  addedAt: z.string(),
  editedAt: z.string().nullable(),
  questions: z.array(z.string()),
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

export async function getSurvey(
  id: string,
): Promise<Survey> {
  return fetchJSON<Survey>(`/surveys/${id}`);
}

export async function createQuestion(input: {
  question: string;
  meta?: unknown;
}) {
  return fetchJSON<Question>("/questions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateQuestion(
  id: string,
  input: { question: string; meta?: unknown },
) {
  return fetchJSON<Question>(`/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteQuestion(id: string) {
  return fetchJSON<void>(`/questions/${id}`, {
    method: "DELETE",
  });
}

export async function createSurvey(input: {
  name: string;
  questions: string[];
  meta?: unknown;
}) {
  return fetchJSON<Survey>("/surveys", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSurvey(
  id: string,
  input: {
    name: string;
    questions: string[];
    meta?: unknown;
  },
) {
  return fetchJSON<Survey>(`/surveys/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteSurvey(id: string) {
  return fetchJSON<void>(`/surveys/${id}`, {
    method: "DELETE",
  });
}
