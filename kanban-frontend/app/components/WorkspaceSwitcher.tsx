"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { CreateWorkspaceModal } from "./CreateWorkSpaceModal";

interface WorkspaceSwitcherProps {
  userId: string;
  activeWorkspaceId: string;
  onSwitch: (workspaceId: string) => void;
}

export function WorkspaceSwitcher({
  userId,
  activeWorkspaceId,
  onSwitch,
}: WorkspaceSwitcherProps) {
  const { workspaces, loading, createWorkspace } = useWorkspaces(userId);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find(
    (ws) => String(ws.id) === activeWorkspaceId,
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreate(name: string) {
    const newId = await createWorkspace(name);
    if (newId !== null) {
      onSwitch(String(newId));
    }
  }

  if (loading) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="font-body text-sm text-[var(--panel)] border border-[var(--text-muted)] rounded px-3 py-1.5 flex items-center gap-2"
      >
        {activeWorkspace?.name ?? "Select workspace"}
        <span className="text-[var(--text-muted)] text-xs">
          {dropdownOpen ? "▲" : "▼"}
        </span>
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--panel)] rounded shadow-lg min-w-full z-40 overflow-hidden">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                onSwitch(String(ws.id));
                setDropdownOpen(false);
              }}
              className={`block w-full text-left font-body text-sm px-3 py-2 hover:bg-black/5 ${
                String(ws.id) === activeWorkspaceId
                  ? "text-[var(--accent)] font-medium"
                  : "text-[var(--text-ink)]"
              }`}
            >
              {ws.name}
            </button>
          ))}
          <button
            onClick={() => {
              setDropdownOpen(false);
              setModalOpen(true);
            }}
            className="block w-full text-left font-body text-sm text-[var(--accent-teal)] px-3 py-2 hover:bg-black/5 border-t border-black/10"
          >
            + New workspace
          </button>
        </div>
      )}

      <CreateWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
