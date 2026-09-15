import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../config/constants";

/**
 * Guards a route behind authentication. While the initial "is there a
 * valid stored token" check is in flight, renders nothing rather than
 * flashing a redirect for a user who turns out to be logged in.
 * Otherwise, sends logged-out users to /login and remembers where
 * they were headed so Login can send them back afterward.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  return children;
}
