import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { chatApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import "./ChatPage.css";

export function ChatListPage() {
  const { isAuthenticated } = useAuth();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: async () => {
      const { data } = await chatApi.rooms();
      return data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="chat-page">
      <h1>Messages</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="empty">No conversations yet. Chat with a seller from an item page.</p>
      ) : (
        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link to={`/chat/${room.id}`} className="room-link">
                <div className="room-info">
                  <strong>{room.item.title}</strong>
                  <span className="participants">
                    {room.buyer.id === room.seller.id
                      ? room.seller.name
                      : `${room.buyer.name} · ${room.seller.name}`}
                  </span>
                  {room.last_message && (
                    <p className="preview">{room.last_message.text}</p>
                  )}
                </div>
                {room.unread_count > 0 && (
                  <span className="unread">{room.unread_count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
