import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getQuestions,
} from "../api/client";
import type { Survey } from "../api/client";
import SurveyForm from "./SurveyForm";

type SurveyFormValues = {
  name: string;
  questions?: string[];
  meta?: string;
};

export default function SurveysPage(): JSX.Element {
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery(
    ["surveys"],
    getSurveys,
  );

  const { data: questions } = useQuery(
    ["questions"],
    getQuestions,
  );

  const createM = useMutation(
    (input: {
      name: string;
      questions: string[];
      meta?: unknown;
    }) => createSurvey(input),
    {
      onSuccess: () =>
        qc.invalidateQueries(["surveys"]),
    },
  );
  const updateM = useMutation(
    (params: {
      id: string;
      input: {
        name: string;
        questions: string[];
        meta?: unknown;
      };
    }) => updateSurvey(params.id, params.input),
    {
      onSuccess: () =>
        qc.invalidateQueries(["surveys"]),
    },
  );
  const deleteM = useMutation(
    (id: string) => deleteSurvey(id),
    {
      onSuccess: () =>
        qc.invalidateQueries(["surveys"]),
    },
  );

  const [editing, setEditing] =
    useState<Survey | null>(null);

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading surveys</div>;

  return (
    <div>
      <h2>Surveys</h2>
      <div>
        <h3>Create</h3>
        <SurveyForm
          questions={questions}
          onSubmit={(v: SurveyFormValues) =>
            createM.mutate({
              name: v.name,
              questions: v.questions || [],
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
          {data!.map((s: Survey) => (
            <li key={s.id}>
              {s.name} — {s.questions.length}{" "}
              questions
              <button
                onClick={() => setEditing(s)}
              >
                Edit
              </button>
              <button
                onClick={() =>
                  deleteM.mutate(s.id)
                }
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
          <SurveyForm
            initial={{
              name: editing.name,
              questions: editing.questions,
              meta: JSON.stringify(
                editing.meta || {},
              ),
            }}
            questions={questions}
            onSubmit={(v: SurveyFormValues) => {
              updateM.mutate({
                id: editing.id,
                input: {
                  name: v.name,
                  questions: v.questions || [],
                  meta: v.meta
                    ? JSON.parse(v.meta)
                    : undefined,
                },
              });
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
    </div>
  );
}
