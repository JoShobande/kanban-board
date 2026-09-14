"use client";

import { useState, useEffect } from "react";

import { getCurrentUserId, setCurrentUserId } from "@/lib/user";
import { useBoard } from "@/hooks/useBoard";
import { WorkspaceSwitcher } from "./components/WorkspaceSwitcher";
import { Board } from "./components/Board";
import { ActivityFeed } from "./components/ActivityFeed";
import { MembersPanel } from "./components/MembersPanel";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let existing = getCurrentUserId();
    if (!existing) {
      existing = prompt("Enter your username:") || "alice";
      setCurrentUserId(existing);
    }
    setUserId(existing);
  }, []);

  if (!userId)
    return <p className="font-body text-[var(--panel)] p-6">Loading…</p>;

  return <BoardPage userId={userId} />;
}

function BoardPage({ userId }: { userId: string }) {
  const [workspaceId, setWorkspaceId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("lastWorkspaceId") ?? "";
  });

  function handleSwitch(newId: string) {
    setWorkspaceId(newId);
    localStorage.setItem("lastWorkspaceId", newId);
  }

  const { cards, loading, error, moveCard, presentUsers, refetch } = useBoard(
    workspaceId,
    userId,
  );

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-display italic text-2xl text-[var(--panel)]">
            Kanban
          </h1>
          <WorkspaceSwitcher
            userId={userId}
            activeWorkspaceId={workspaceId}
            onSwitch={handleSwitch}
          />
        </div>
        <div className="flex gap-1.5">
          {presentUsers.map((user) => (
            <span
              key={user}
              title={user}
              className="font-body text-xs bg-[var(--accent)] text-[var(--ink)] rounded-full w-6 h-6 flex items-center justify-center font-medium"
            >
              {user.charAt(0).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      {!workspaceId && (
        <p className="font-body text-xs text-[var(--text-muted)]">
          Select or create a workspace to get started.
        </p>
      )}
      {workspaceId && (
        <div className="flex gap-8">
          <div className="flex-1">
            {loading && (
              <p className="font-body text-xs text-[var(--text-muted)]">
                Loading board…
              </p>
            )}
            {error && (
              <p className="font-body text-xs text-[var(--accent-rust)]">
                {error}
              </p>
            )}
            {!loading && !error && (
              <Board
                cards={cards}
                onMoveCard={moveCard}
                workspaceId={workspaceId}
                userId={userId}
                onCardChanged={refetch}
              />
            )}
          </div>
          <div className="w-64 flex flex-col gap-8">
            <ActivityFeed workspaceId={workspaceId} userId={userId} />
            <MembersPanel workspaceId={workspaceId} userId={userId} />
          </div>
        </div>
      )}
    </div>
  );
}
