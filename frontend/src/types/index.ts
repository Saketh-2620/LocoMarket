export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar_url: string;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  price: string;
  category: string;
  listing_type: "rent" | "sale";
  lat: number;
  lng: number;
  thumbnail: string | null;
  distance_km: number | null;
  address: string;
  seller_name: string;
  seller_id?: number;
  is_active: boolean;
  images?: { id: number; image: string; order: number }[];
  sold_at?: string | null;
  created_at?: string;
}

export interface Message {
  id: string;
  room: string;
  sender: User;
  text: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  item: Item;
  buyer: User;
  seller: User;
  created_at: string;
  last_message: Message | null;
  unread_count: number;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}
