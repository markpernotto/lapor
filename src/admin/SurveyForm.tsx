import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

  // DnD handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedQuestions((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(
          prev,
          oldIndex,
          newIndex,
        );
      });
    }
  }

  function SortableItem({
    id,
    label,
  }: {
    id: string;
    label: string;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id });
    const style = {
      transform:
        CSS.Transform.toString(transform),
      transition,
      border: "1px solid #ddd",
      padding: "6px",
      marginBottom: "4px",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    } as const;
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <span>{label}</span>
        <span style={{ cursor: "grab" }}>☰</span>
      </div>
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
        {/* Draggable ordered list of selected questions */}
        <div style={{ marginTop: 8 }}>
          <label>Order Selected Questions</label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedQuestions}
              strategy={
                verticalListSortingStrategy
              }
            >
              <div>
                {selectedQuestions.map((id) => {
                  const q = (
                    questions || []
                  ).find((x) => x.id === id);
                  return (
                    <SortableItem
                      key={id}
                      id={id}
                      label={q ? q.question : id}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
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
