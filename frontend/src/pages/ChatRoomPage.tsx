import { type FormEvent, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { chatApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import "./ChatPage.css";

export function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { isAuthenticated, user } = useAuth();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: async () => {
      const { data } = await chatApi.messages(roomId!);
      return data;
    },
    enabled: !!roomId && isAuthenticated,
  });

  const { messages, sendMessage, connected, setInitialMessages } = useChat(roomId, user);

  useEffect(() => {
    if (history) {
      setInitialMessages(history);
    }
  }, [history, setInitialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
  };

  return (
    <div className="chat-room-page">
      <Link to="/chat" className="back-link">
        &larr; All chats
      </Link>
      <div className="chat-status">{connected ? "Connected" : "Connecting..."}</div>
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender.id === user?.id ? "mine" : "theirs"}`}
          >
            <span className="sender">{msg.sender.name}</span>
            <p>{msg.text}</p>
            <time>{new Date(msg.created_at).toLocaleTimeString()}</time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="composer" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
