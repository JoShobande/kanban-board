import { useState, useEffect } from "react";

interface Member {
  user_id: string;
  role: "owner" | "collaborator";
  created_at: string;
}

export function useMembers(workspaceId: string, userId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/members`,
        {
          headers: { "x-user-id": userId },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    fetchMembers();
  }, [workspaceId, userId]);

  return { members, loading, error, refetch: fetchMembers };
}
