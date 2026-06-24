import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

interface NavbarProps {
  unreadCount?: number;
}

export function Navbar({ unreadCount = 0 }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        LocoMarket
      </Link>
      <nav className="navbar-links">
        <NavLink to="/" end>
          Map
        </NavLink>
        {isAuthenticated && (
          <>
            <NavLink to="/items/new">Sell</NavLink>
            <NavLink to="/my-listings">My Listings</NavLink>
            <NavLink to="/chat">
              Chat
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </NavLink>
          </>
        )}
      </nav>
      <div className="navbar-auth">
        {isAuthenticated ? (
          <>
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="avatar" />
            )}
            <span className="user-name">{user?.name || user?.email}</span>
            <button type="button" onClick={logout} className="btn-text">
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-primary">
            Log in with Google
          </Link>
        )}
      </div>
    </header>
  );
}
