import { useCallback, useEffect, useRef, useState } from "react";
import { getWsUrl } from "../api/client";
import type { Message, User } from "../types";

function upsertMessage(prev: Message[], incoming: Message): Message[] {
  if (prev.some((m) => m.id === incoming.id)) return prev;
  const withoutPending = prev.filter(
    (m) =>
      !(
        m.id.startsWith("pending-") &&
        m.text === incoming.text &&
        m.sender.id === incoming.sender.id
      )
  );
  return [...withoutPending, incoming];
}

export function useChat(roomId: string | undefined, currentUser: User | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    let active = true;
    const ws = new WebSocket(getWsUrl(`/ws/chat/${roomId}/`));
    wsRef.current = ws;

    ws.onopen = () => {
      if (active) setConnected(true);
    };
    ws.onclose = () => {
      if (active) setConnected(false);
    };
    ws.onerror = () => {
      if (active) setConnected(false);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat.message" && data.message) {
        setMessages((prev) => upsertMessage(prev, data.message));
      }
    };

    return () => {
      active = false;
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    historyLoadedRef.current = false;
    setMessages([]);
  }, [roomId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentUser || !roomId) {
        return;
      }

      const optimistic: Message = {
        id: `pending-${crypto.randomUUID()}`,
        room: roomId,
        sender: currentUser,
        text,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      wsRef.current.send(JSON.stringify({ text }));
    },
    [currentUser, roomId]
  );

  const setInitialMessages = useCallback((msgs: Message[]) => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    setMessages(msgs);
  }, []);

  return { messages, sendMessage, connected, setInitialMessages };
}

export function useNotifications(onNotification: (roomId: string) => void) {
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(getWsUrl("/ws/notifications/"));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat.notification" && data.room_id) {
        onNotification(data.room_id);
      }
    };

    return () => {
      ws.onmessage = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onNotification]);
}
