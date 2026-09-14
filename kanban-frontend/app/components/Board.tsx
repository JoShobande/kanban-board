"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Column } from "./Column";

interface CardProp {
  id: number;
  workspace_id: number;
  column_key: string;
  position: number;
  title: string;
  description: string | null;
  version: number;
}

interface BoardProps {
  cards: CardProp[];
  onMoveCard: (
    cardId: number,
    toColumn: string,
    toPosition: number,
    expectedVersion: number,
  ) => void;
  workspaceId: string;
  userId: string;
  onCardChanged: () => void;
  conflictCardId: number | null;
}

const COLUMN_DEFS = [
  { key: "backlog", label: "Backlog", accent: "#6B6F68" },
  { key: "in_progress", label: "In Progress", accent: "#E3A73E" },
  { key: "done", label: "Done", accent: "#3F8F79" },
];

const COLUMNS = COLUMN_DEFS.map((c) => c.key);

export function Board({
  cards,
  onMoveCard,
  workspaceId,
  userId,
  onCardChanged,
  conflictCardId,
}: BoardProps) {
  const columns = COLUMNS.reduce<Record<string, CardProp[]>>(
    (acc, columnKey) => {
      acc[columnKey] = cards
        .filter((card) => card.column_key === columnKey)
        .sort((a, b) => a.position - b.position);
      return acc;
    },
    {},
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const cardId = Number(active.id);
    const overId = String(over.id);

    const draggedCard = cards.find((card) => card.id === cardId);
    if (!draggedCard) return;

    let toColumn: string;
    if (COLUMNS.includes(overId)) {
      toColumn = overId;
    } else {
      const overCard = cards.find((card) => card.id === Number(overId));
      if (!overCard) return;
      toColumn = overCard.column_key;
    }

    if (draggedCard.column_key === toColumn) return;

    const targetColumnCards = columns[toColumn] ?? [];
    const maxPosition =
      targetColumnCards.length > 0
        ? Math.max(...targetColumnCards.map((c) => c.position))
        : 0;
    const toPosition = maxPosition + 1;

    onMoveCard(cardId, toColumn, toPosition, draggedCard.version);
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMN_DEFS.map(({ key, label, accent }) => (
          <Column
            key={key}
            columnKey={key}
            label={label}
            accent={accent}
            cards={columns[key]}
            workspaceId={workspaceId}
            userId={userId}
            onCardChanged={onCardChanged}
            conflictCardId={conflictCardId}
          />
        ))}
      </div>
    </DndContext>
  );
}
