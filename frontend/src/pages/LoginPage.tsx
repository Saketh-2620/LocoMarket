import { GoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="login-page">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome to LocoMarket</h1>
        <p>Sign in with your Google account to list items and chat with neighbors.</p>
        <GoogleLogin
          onSuccess={(res) => {
            if (res.credential) login(res.credential);
          }}
          onError={() => alert("Google login failed")}
          theme="filled_black"
          size="large"
          text="signin_with"
        />
      </div>
    </div>
  );
}
