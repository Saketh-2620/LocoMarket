import { useCallback, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { useNotifications } from "./hooks/useChat";
import { MapPage } from "./pages/MapPage";
import { LoginPage } from "./pages/LoginPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { CreateItemPage } from "./pages/CreateItemPage";
import { MyListingsPage } from "./pages/MyListingsPage";
import { ChatListPage } from "./pages/ChatListPage";
import { ChatRoomPage } from "./pages/ChatRoomPage";
import "./App.css";

const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function AppLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  const onNotification = useCallback(() => {
    setUnreadCount((c) => c + 1);
  }, []);

  useNotifications(onNotification);

  return (
    <>
      <Navbar unreadCount={unreadCount} />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/items/new" element={<CreateItemPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:roomId" element={<ChatRoomPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
