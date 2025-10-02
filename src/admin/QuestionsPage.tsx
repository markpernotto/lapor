import { useQuery } from "@tanstack/react-query";
import { getQuestions } from "../api/client";
import type { Question } from "../api/client";

export default function QuestionsPage() {
  const { data, error, isLoading } = useQuery(
    ["questions"],
    getQuestions,
  );

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading questions</div>;

  return (
    <div>
      <h2>Questions</h2>
      <ul>
        {data!.map((q: Question) => (
          <li key={q.uuid}>
            {q.question} <small>({q.uuid})</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
