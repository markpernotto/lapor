import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSurvey } from "./api/client";
import type { Survey } from "./api/client";

function SurveyRenderer({
  survey,
}: {
  survey: Survey;
}) {
  return (
    <div
      style={{
        background: "#fff",
        color: "#000",
        padding: "2rem",
        borderRadius: 8,
        maxWidth: 800,
        margin: "2rem auto",
        textAlign: "left",
      }}
    >
      <h2 style={{ fontSize: "1.6rem" }}>
        {survey.name || "(no name)"}
      </h2>
      <h3>Questions (ordered)</h3>
      <ol>
        {survey.questions.map((qId, index) => (
          <li key={index + 1}>{qId.question}</li>
        ))}
      </ol>
      {survey.meta && (
        <div>
          <h3>Meta</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(survey.meta, null, 2)}
          </pre>
        </div>
      )}
      <details style={{ marginTop: 16 }}>
        <summary>Raw survey JSON</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(survey, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function SurveyView() {
  const { surveyId } = useParams<{
    surveyId: string;
  }>();

  console.log("SurveyView surveyId", surveyId);

  const { data, error, isLoading } = useQuery(
    ["survey", surveyId],
    () => {
      if (!surveyId)
        throw new Error("missing survey id");
      return getSurvey(surveyId);
    },
  );

  if (isLoading)
    return <div>Loading survey...</div>;
  if (error)
    return (
      <div>
        Error loading survey:{" "}
        {(error as Error).message}
      </div>
    );
  if (!data) return <div>Survey not found</div>;

  return <SurveyRenderer survey={data} />;
}
