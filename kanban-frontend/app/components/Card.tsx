import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CardProps {
  card: {
    id: number;
    title: string;
    description: string | null;
    column_key: string;
    position: number;
    version: number;
  };
  onEdit: () => void;
  hasConflict: boolean;
}

export function Card({ card, onEdit, hasConflict }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--panel)] rounded p-3 select-none transition-shadow ${
        isDragging ? "shadow-lg shadow-black/30" : "shadow-none"
      } ${hasConflict ? "ring-2 ring-[var(--accent-rust)]" : ""}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <p className="font-body text-sm font-medium text-[var(--text-ink)]">
          {card.title}
        </p>
        {card.description && (
          <p className="font-body text-xs text-[var(--text-muted)] mt-1">
            {card.description}
          </p>
        )}
      </div>
      {hasConflict && (
        <p className="font-body text-[10px] text-[var(--accent-rust)] mt-2 font-medium">
          Updated by someone else
        </p>
      )}
      <button
        onClick={onEdit}
        className="font-body text-[10px] text-[var(--text-muted)] mt-2 hover:text-[var(--accent)]"
      >
        Edit
      </button>
    </div>
  );
}
