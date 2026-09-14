"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "./Card";
import { CardModal } from "./CardModal";

interface CardProp {
  id: number;
  workspace_id: number;
  column_key: string;
  position: number;
  title: string;
  description: string | null;
  version: number;
}

interface ColumnProps {
  columnKey: string;
  label: string;
  accent: string;
  cards: CardProp[];
  workspaceId: string;
  userId: string;
  onCardChanged: () => void;
}

export function Column({
  columnKey,
  label,
  accent,
  cards,
  workspaceId,
  userId,
  onCardChanged,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnKey });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardProp | null>(null);

  async function handleCreate(title: string, description: string) {
    await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ columnKey, title, description }),
    });
    onCardChanged();
  }

  async function handleEdit(title: string, description: string) {
    if (!editingCard) return;
    await fetch(`http://localhost:4000/api/cards/${editingCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        title,
        description,
        expectedVersion: editingCard.version,
      }),
    });
    onCardChanged();
  }

  async function handleDelete() {
    if (!editingCard) return;
    await fetch(`http://localhost:4000/api/cards/${editingCard.id}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
    onCardChanged();
  }

  return (
    <div className="flex flex-col min-h-[300px]">
      <div
        className="h-[3px] rounded-full mb-3"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display italic text-lg text-[var(--panel)]">
          {label}
        </h2>
        <span className="font-body text-xs text-[var(--text-muted)]">
          {cards.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <div key={card.id} onClick={() => setEditingCard(card)}>
              <Card
                key={card.id}
                card={card}
                onEdit={() => setEditingCard(card)}
              />
            </div>
          ))}
        </SortableContext>
      </div>
      <button
        onClick={() => setModalOpen(true)}
        className="font-body text-xs text-[var(--text-muted)] mt-2 text-left hover:text-[var(--panel)]"
      >
        + Add card
      </button>

      <CardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="create"
        onSubmit={handleCreate}
      />
      <CardModal
        open={editingCard !== null}
        onClose={() => setEditingCard(null)}
        mode="edit"
        initialTitle={editingCard?.title}
        initialDescription={editingCard?.description ?? ""}
        onSubmit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
