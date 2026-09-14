import { useState, useEffect } from "react";

export interface Workspace {
  id: number;
  name: string;
  created_at: string;
}

export function useWorkspaces(userId: string) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchWorkspaces() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/workspaces", {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    fetchWorkspaces();
  }, [userId]);

  async function createWorkspace(name: string): Promise<number | null> {
    const res = await fetch("http://localhost:4000/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return null;

    const workspace = await res.json();
    await fetchWorkspaces();
    return workspace.id;
  }

  return { workspaces, loading, error, createWorkspace };
}
