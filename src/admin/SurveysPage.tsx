import { useQuery } from "@tanstack/react-query";
import { getSurveys } from "../api/client";
import type { Survey } from "../api/client";

export default function SurveysPage() {
  const { data, error, isLoading } = useQuery(
    ["surveys"],
    getSurveys,
  );

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading surveys</div>;

  return (
    <div>
      <h2>Surveys</h2>
      <ul>
        {data!.map((s: Survey) => (
          <li key={s.uuid}>
            {s.name} — {s.questions.length}{" "}
            questions
          </li>
        ))}
      </ul>
    </div>
  );
}
