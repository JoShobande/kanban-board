import { useState, useEffect } from "react";
import { io } from "socket.io-client";

interface ActivityEntry {
  id?: number;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
}

export function useActivity(workspaceId: string, userId: string) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchActivity() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:4000/api/workspaces/${workspaceId}/activity`,
          {
            headers: { "x-user-id": userId },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch activity");
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [workspaceId, userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = io("http://localhost:4000", { query: { workspaceId } });

    socket.on("activity:new", (entry: Omit<ActivityEntry, "id">) => {
      const withId: ActivityEntry = { ...entry, id: Date.now() };
      setEntries((prev) => [withId, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [workspaceId, userId]);

  return { entries, loading, error };
}
