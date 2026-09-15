import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { ROUTES } from "../config/constants";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // If the user was redirected here by a protected route, send them
  // back to where they were trying to go; otherwise land on Profile.
  const redirectTo = location.state?.from?.pathname || ROUTES.profile;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AuthCard
        title="Welcome back"
        description="Log in to see your typing history and stats."
        footer={
          <>
            Don't have an account?{" "}
            <Link to={ROUTES.register} className="font-medium text-accent hover:underline">
              Create one
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <FormField
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-text-tertiary transition-colors hover:text-text-secondary"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </AuthCard>
    </PageContainer>
  );
}
