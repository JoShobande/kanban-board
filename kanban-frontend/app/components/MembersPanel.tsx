"use client";

import { useState } from "react";
import { InviteModal } from "./InviteModal";
import { useMembers } from "@/hooks/useMembers";

interface MembersPanelProps {
  workspaceId: string;
  userId: string;
}

export function MembersPanel({ workspaceId, userId }: MembersPanelProps) {
  const { members, loading, error, refetch } = useMembers(workspaceId, userId);
  const [modalOpen, setModalOpen] = useState(false);

  const currentMember = members.find((m) => m.user_id === userId);
  const isOwner = currentMember?.role === "owner";

  async function handleRemove(targetUserId: string) {
    const res = await fetch(
      `http://localhost:4000/api/workspaces/${workspaceId}/members/${targetUserId}`,
      { method: "DELETE", headers: { "x-user-id": userId } },
    );
    if (res.ok) refetch();
  }

  async function handleInvite(newUserId: string) {
    const res = await fetch(
      `http://localhost:4000/api/workspaces/${workspaceId}/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ userId: newUserId, role: "collaborator" }),
      },
    );
    if (res.ok) refetch();
  }

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
        Members
      </h2>
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li
            key={member.user_id}
            className="font-body text-xs flex justify-between items-center"
          >
            <span className="text-[var(--panel)]">
              {member.user_id}{" "}
              <span className="text-[var(--text-muted)]">— {member.role}</span>
            </span>
            {isOwner && member.role !== "owner" && (
              <button
                onClick={() => handleRemove(member.user_id)}
                className="text-[var(--accent-rust)] hover:underline"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <button
          onClick={() => setModalOpen(true)}
          className="font-body text-xs text-[var(--accent)] mt-3 hover:underline"
        >
          + Invite member
        </button>
      )}
      <InviteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
