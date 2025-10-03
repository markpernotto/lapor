import { useEffect, useState } from "react";

type FormData = {
  name: string;
  description?: string;
  synopsis?: string;
  questions?: string[];
  meta?: string;
};

export default function SurveyForm({
  initial,
  questions,
  onSubmit,
  onCancel,
}: {
  initial?: {
    name: string;
    description?: string;
    synopsis?: string;
    questions?: string[];
    meta?: string;
  };
  questions?: { id: string; question: string }[];
  onSubmit: (values: FormData) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(
    initial?.name || "",
  );
  const [description, setDescription] = useState(
    initial?.description || "",
  );
  const [synopsis, setSynopsis] = useState(
    initial?.synopsis || "",
  );
  const [
    selectedQuestions,
    setSelectedQuestions,
  ] = useState<string[]>(
    initial?.questions || [],
  );
  const [meta, setMeta] = useState(
    initial?.meta || "",
  );

  useEffect(() => {
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setSynopsis(initial?.synopsis || "");
    setSelectedQuestions(
      initial?.questions || [],
    );
    setMeta(initial?.meta || "");
  }, [initial]);

  function toggleQuestion(id: string) {
    setSelectedQuestions((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id],
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      synopsis: synopsis || undefined,
      questions: selectedQuestions,
      meta: meta || undefined,
    });
  }

  return (
    <form onSubmit={handleSave}>
      <div>
        <label>Name</label>
        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />
      </div>
      <div>
        <label>Description</label>
        <input
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />
      </div>
      <div>
        <label>Synopsis</label>
        <input
          value={synopsis}
          onChange={(e) =>
            setSynopsis(e.target.value)
          }
        />
      </div>
      <div>
        <label>Questions</label>
        <div>
          {(questions || []).map((q) => (
            <div key={q.id}>
              <label>
                <input
                  type="checkbox"
                  value={q.id}
                  checked={selectedQuestions.includes(
                    q.id,
                  )}
                  onChange={() =>
                    toggleQuestion(q.id)
                  }
                />
                {q.question}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label>Meta (JSON)</label>
        <textarea
          value={meta}
          onChange={(e) =>
            setMeta(e.target.value)
          }
        />
      </div>
      <div>
        <button type="submit">Save</button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
