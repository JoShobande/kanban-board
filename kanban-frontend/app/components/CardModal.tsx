"use client";

import { useState, useEffect } from "react";

interface CardModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (title: string, description: string) => void;
  onDelete?: () => void;
}

export function CardModal({
  open,
  onClose,
  mode,
  initialTitle = "",
  initialDescription = "",
  onSubmit,
  onDelete,
}: CardModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
  }, [initialTitle, initialDescription, open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), description.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--panel)] rounded p-6 w-96 flex flex-col gap-3"
      >
        <h2 className="font-display italic text-lg text-[var(--text-ink)]">
          {mode === "create" ? "New card" : "Edit card"}
        </h2>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="font-body text-sm bg-white/60 rounded px-3 py-2 text-[var(--text-ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="font-body text-sm bg-white/60 rounded px-3 py-2 text-[var(--text-ink)] outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="font-body text-xs text-[var(--accent-rust)]"
            >
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-xs text-[var(--text-muted)] px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-body text-xs bg-[var(--accent)] text-[var(--ink)] rounded px-3 py-1.5 font-medium"
            >
              {mode === "create" ? "Add card" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
