"use client";

import { useActivity } from "@/hooks/useActivity";

interface ActivityFeedProps {
  workspaceId: string;
  userId: string;
}

export function ActivityFeed({ workspaceId, userId }: ActivityFeedProps) {
  const { entries, loading, error } = useActivity(workspaceId, userId);

  if (loading)
    return (
      <p className="font-body text-xs text-[var(--text-muted)]">Loading…</p>
    );
  if (error)
    return (
      <p className="font-body text-xs text-[var(--accent-rust)]">{error}</p>
    );

  return (
    <div>
      <h2 className="font-display italic text-lg text-[var(--panel)] mb-3">
        Activity
      </h2>
      <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto">
        {entries.length === 0 && (
          <li className="font-body text-xs text-[var(--text-muted)]">
            Nothing yet.
          </li>
        )}
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="font-body text-xs text-[var(--text-muted)] leading-relaxed"
          >
            <span className="text-[var(--panel)]">{entry.actor}</span>{" "}
            {entry.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
