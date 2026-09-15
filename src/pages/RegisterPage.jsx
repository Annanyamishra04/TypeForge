import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/auth/FormField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { ROUTES } from "../config/constants";

const PASSWORD_MIN_LENGTH = 8;

/** Client-side checks are for UX only — the server re-validates everything. */
function validate({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  if (!email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const errors = validate({ name, email, password, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(ROUTES.profile, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.data?.errors) && err.data.errors.length > 0) {
        setFormError(err.data.errors.join(" "));
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AuthCard
        title="Create your account"
        description="Save your typing history and track your progress over time."
        footer={
          <>
            Already have an account?{" "}
            <Link to={ROUTES.login} className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            error={fieldErrors.name}
          />

          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            error={fieldErrors.email}
          />

          <FormField
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            error={fieldErrors.password}
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

          <FormField
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            error={fieldErrors.confirmPassword}
          />

          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthCard>
    </PageContainer>
  );
}
