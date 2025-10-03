import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../api/client";
import type { Question } from "../api/client";
import QuestionForm from "./QuestionForm";
import { useState } from "react";

export default function QuestionsPage() {
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery(
    ["questions"],
    getQuestions,
  );

  const createM = useMutation(createQuestion, {
    onSuccess: () =>
      qc.invalidateQueries(["questions"]),
  });
  const updateM = useMutation(
    (params: {
      id: string;
      input: { question: string; meta?: unknown };
    }) => updateQuestion(params.id, params.input),
    {
      onSuccess: () =>
        qc.invalidateQueries(["questions"]),
    },
  );
  const deleteM = useMutation(
    (id: string) => deleteQuestion(id),
    {
      onSuccess: () =>
        qc.invalidateQueries(["questions"]),
    },
  );

  const [errorMsg, setErrorMsg] = useState<
    string | null
  >(null);

  const [editing, setEditing] =
    useState<Question | null>(null);

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading questions</div>;

  return (
    <div>
      {errorMsg && (
        <div style={{ color: "red" }}>
          Error: {errorMsg}
        </div>
      )}
      <h2>Questions</h2>
      <div>
        <h3>Create</h3>
        <QuestionForm
          onSubmit={(v) =>
            createM.mutate({
              question: v.question,
              meta: v.meta
                ? JSON.parse(v.meta)
                : undefined,
            })
          }
        />
      </div>
      <div>
        <h3>Existing</h3>
        <ul>
          {data!.map((q: Question) => (
            <li key={q.id}>
              {q.question} <small>({q.id})</small>
              <button
                onClick={() => setEditing(q)}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    !confirm(
                      "Delete this question?",
                    )
                  )
                    return;
                  setErrorMsg(null);
                  deleteM.mutate(q.id, {
                    onError: (err: unknown) =>
                      setErrorMsg(
                        (err as Error)?.message ||
                          String(err),
                      ),
                  });
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      {editing && (
        <div>
          <h3>Edit</h3>
          <QuestionForm
            initial={{
              question: editing.question,
              meta: JSON.stringify(
                editing.meta || {},
              ),
            }}
            onSubmit={(v) => {
              setErrorMsg(null);
              updateM.mutate(
                {
                  id: editing.id,
                  input: {
                    question: v.question,
                    meta: v.meta
                      ? JSON.parse(v.meta)
                      : undefined,
                  },
                },
                {
                  onError: (err: unknown) =>
                    setErrorMsg(
                      (err as Error)?.message ||
                        String(err),
                    ),
                },
              );
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  );
}
