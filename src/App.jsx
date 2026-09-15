import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import TestPage from "./pages/TestPage";
import StatsPage from "./pages/StatsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CoachPage from "./pages/CoachPage";
import CertificatePage from "./pages/CertificatePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ROUTES } from "./config/constants";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.test} element={<TestPage />} />
        <Route
          path={ROUTES.stats}
          element={
            <ProtectedRoute>
              <StatsPage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.leaderboard} element={<LeaderboardPage />} />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route
          path={ROUTES.coach}
          element={
            <ProtectedRoute>
              <CoachPage />
            </ProtectedRoute>
          }
        />
        {/* Public verification page — viewable without login, per Phase 10. */}
        <Route path={ROUTES.certificate} element={<CertificatePage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
