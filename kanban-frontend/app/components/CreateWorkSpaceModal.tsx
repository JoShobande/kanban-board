"use client";

import { useState } from "react";

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateWorkspaceModal({
  open,
  onClose,
  onCreate,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--panel)] rounded p-6 w-80 flex flex-col gap-3"
      >
        <h2 className="font-display italic text-lg text-[var(--text-ink)]">
          New workspace
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name"
          className="font-body text-sm bg-white/60 rounded px-3 py-2 text-[var(--text-ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <div className="flex justify-end gap-2 mt-1">
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
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
