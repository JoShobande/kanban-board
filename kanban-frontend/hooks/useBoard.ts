import { useState, useEffect, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

export interface CardProp {
  id: number;
  workspace_id: number;
  column_key: string;
  position: number;
  title: string;
  description: string | null;
  version: number;
}

export function useBoard(workspaceId: string, userId: string) {
  const [cards, setCards] = useState<CardProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [presentUsers, setPresentUsers] = useState<string[]>([]);

  async function fetchBoard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/board`,
        {
          headers: { "x-user-id": userId },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch board");
      const data = await res.json();
      setCards(data.cards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    fetchBoard();
  }, [workspaceId, userId]);

  useEffect(() => {
    if (!userId) return;

    const socket: Socket = io("http://localhost:4000", {
      query: { workspaceId, userId },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence:update", (users: string[]) => {
      setPresentUsers(users);
    });

    socket.on("card:created", (card: CardProp) => {
      setCards((prev) => [...prev, card]);
    });

    socket.on("card:moved", (card: CardProp) => {
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    });

    socket.on("card:edited", (card: CardProp) => {
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    });

    socket.on("card:deleted", ({ id }: { id: number }) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [workspaceId, userId]);

  const moveCard = useCallback(
    async (
      cardId: number,
      toColumn: string,
      toPosition: number,
      expectedVersion: number,
    ) => {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId
            ? { ...card, column_key: toColumn, position: toPosition }
            : card,
        ),
      );

      const res = await fetch(
        `http://localhost:4000/api/cards/${cardId}/move`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-user-id": userId },
          body: JSON.stringify({ toColumn, toPosition, expectedVersion }),
        },
      );

      if (res.status === 409) {
        const { current } = await res.json();
        setCards((prevCards) =>
          prevCards.map((card) => (card.id === current.id ? current : card)),
        );
        return;
      }

      const updatedCard = await res.json();
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card,
        ),
      );
    },
    [userId, cards],
  );

  return {
    cards,
    loading,
    error,
    moveCard,
    connected,
    presentUsers,
    refetch: fetchBoard,
  };
}
