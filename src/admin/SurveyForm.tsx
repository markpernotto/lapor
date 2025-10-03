import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  questions: z.array(z.string()).optional(),
  meta: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SurveyForm({
  initial,
  questions,
  onSubmit,
  onCancel,
}: {
  initial?: {
    name: string;
    questions?: string[];
    meta?: string;
  };
  questions?: { id: string; question: string }[];
  onSubmit: (values: FormData) => void;
  onCancel?: () => void;
}) {
  const { register, handleSubmit, reset } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: initial as any,
    });

  useEffect(
    () => reset(initial as any),
    [initial, reset],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...register("name")} />
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
                  {...register("questions")}
                />
                {q.question}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label>Meta (JSON)</label>
        <textarea {...register("meta")} />
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
