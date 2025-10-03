import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(1, "Required"),
  meta: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function QuestionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { question: string; meta?: string };
  onSubmit: (values: FormData) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  useEffect(
    () => reset(initial),
    [initial, reset],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Question</label>
        <input {...register("question")} />
        {errors.question && (
          <div>{errors.question.message}</div>
        )}
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
