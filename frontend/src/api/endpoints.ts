import { api } from "./client";
import type { AuthResponse, ChatRoom, Item, Message, User } from "../types";

/** DRF may return a bare array or a paginated `{ results: T[] }` payload. */
function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export const authApi = {
  googleLogin: (credential: string) =>
    api.post<AuthResponse>("/auth/google/", { credential }),
  currentUser: () => api.get<User>("/auth/user/"),
};

export const itemsApi = {
  list: (params: Record<string, string | number | undefined>) =>
    api.get<Item[]>("/items/", { params }),
  get: (id: string) => api.get<Item>(`/items/${id}/`),
  create: (formData: FormData) =>
    api.post<Item>("/items/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, formData: FormData) =>
    api.patch<Item>(`/items/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id: string) => api.delete(`/items/${id}/`),
  mine: (status: "active" | "sold" = "active") =>
    api.get<Item[]>("/items/mine/", { params: { status } }),
  markSold: (id: string) => api.post<Item>(`/items/${id}/mark-sold/`),
  geocode: (address: string) =>
    api.post<{ lat: number; lng: number; display_name: string }>(
      "/items/geocode/",
      { address }
    ),
};

export const chatApi = {
  rooms: async () => {
    const res = await api.get<ChatRoom[] | { results: ChatRoom[] }>("/chat/rooms/");
    return { ...res, data: unwrapList(res.data) };
  },
  createRoom: (item_id: string) =>
    api.post<ChatRoom>("/chat/rooms/", { item_id }),
  messages: async (roomId: string) => {
    const res = await api.get<Message[] | { results: Message[] }>(
      `/chat/rooms/${roomId}/messages/`
    );
    return { ...res, data: unwrapList(res.data) };
  },
};
