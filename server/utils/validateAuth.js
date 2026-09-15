const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN = 1;
const NAME_MAX = 80;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/**
 * Validates a POST /api/auth/register body. Returns an array of
 * human-readable error strings — empty means the payload is
 * acceptable. Mirrors validateResult.js: never trusts the frontend,
 * every field is re-checked here regardless of client-side checks.
 */
export function validateRegisterPayload(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return ["Request body must be a JSON object."];
  }

  const { name, email, password } = body;

  if (typeof name !== "string" || name.trim().length < NAME_MIN) {
    errors.push("Name is required.");
  } else if (name.trim().length > NAME_MAX) {
    errors.push(`Name must be ${NAME_MAX} characters or fewer.`);
  }

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (typeof password !== "string" || password.length < PASSWORD_MIN) {
    errors.push(`Password must be at least ${PASSWORD_MIN} characters.`);
  } else if (password.length > PASSWORD_MAX) {
    errors.push(`Password must be ${PASSWORD_MAX} characters or fewer.`);
  }

  return errors;
}

/**
 * Validates a POST /api/auth/login body. Deliberately lightweight —
 * the real authentication check (does this email/password combination
 * exist) happens against the database, not here.
 */
export function validateLoginPayload(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return ["Request body must be a JSON object."];
  }

  const { email, password } = body;

  if (typeof email !== "string" || email.trim().length === 0) {
    errors.push("Email is required.");
  }

  if (typeof password !== "string" || password.length === 0) {
    errors.push("Password is required.");
  }

  return errors;
}

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}
