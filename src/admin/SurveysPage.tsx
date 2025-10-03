import { useState } from "react";
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

function EmbedSnippet({
  surveyId,
}: {
  surveyId: string;
}) {
  const [visible, setVisible] = useState(false);
  const snippet = `<!-- Embed survey ${surveyId} -->\n<script>(function(){var root=document.currentScript.parentNode;var ifr=document.createElement('iframe');ifr.src=window.location.origin+"/survey/${surveyId}";ifr.style.border='0';ifr.style.width='100%';ifr.style.height='600px';root.appendChild(ifr);})();</script>`;
  return (
    <div>
      <a
        href={`/survey/${surveyId}`}
        target="_blank"
        rel="noreferrer"
      >
        Preview
      </a>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        style={{ marginLeft: 8 }}
      >
        {visible
          ? "Hide embed"
          : "Show embed script"}
      </button>
      {visible ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <small>
              Copy and paste this snippet into
              your site to embed the survey
              (iframe):
            </small>
          </div>
          <div>
            <textarea
              readOnly
              value={snippet}
              style={{ width: 600, height: 120 }}
            />
          </div>
          <div style={{ marginTop: 6 }}>
            <button
              onClick={async () => {
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(
                    snippet,
                  );
                  alert(
                    "Copied embed snippet to clipboard",
                  );
                } else {
                  // fallback: select the textarea and copy
                  const ta =
                    document.querySelector(
                      "textarea",
                    );
                  if (
                    ta instanceof
                    HTMLTextAreaElement
                  ) {
                    ta.select();
                    document.execCommand("copy");
                    alert(
                      "Copied embed snippet to clipboard",
                    );
                  }
                }
              }}
            >
              Copy snippet
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type SurveyFormValues = {
  name: string;
  description?: string;
  synopsis?: string;
  active?: boolean;
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
      description?: string | null;
      synopsis?: string | null;
      active?: boolean;
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
        description?: string | null;
        synopsis?: string | null;
        active?: boolean;
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
              description: v.description,
              synopsis: v.synopsis,
              active: v.active,
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
            <li
              key={s.id}
              style={{ marginBottom: 12 }}
            >
              <div>
                <strong>{s.name}</strong> —{" "}
                {s.questions.length} questions
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  gap: 8,
                }}
              >
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
                {s.active ? (
                  <EmbedSnippet surveyId={s.id} />
                ) : null}
              </div>
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
              description:
                editing.description || undefined,
              synopsis:
                editing.synopsis || undefined,
              active: editing.active ?? true,
              questions: editing.questions.map(
                (q) => q.id,
              ),
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
                  description: v.description,
                  synopsis: v.synopsis,
                  active: v.active,
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
