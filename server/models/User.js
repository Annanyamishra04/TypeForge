import mongoose from "mongoose";

// A conservative, widely-used pattern — good enough to catch obvious
// typos without trying to be a full RFC 5322 validator (which would
// reject plenty of legitimate addresses and accept plenty of garbage
// anyway).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [1, "Name cannot be empty."],
      maxlength: [80, "Name is too long."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, "Email is too long."],
      match: [EMAIL_PATTERN, "Email is not a valid address."],
      index: true,
    },
    // Never the plaintext password — only ever a bcrypt hash. Excluded
    // from query results by default (`select: false`) so a stray
    // `.find()`/`.lean()` elsewhere in the codebase can't accidentally
    // leak it; routes that genuinely need it (login) opt back in with
    // `.select("+passwordHash")`.
    passwordHash: {
      type: String,
      required: [true, "passwordHash is required."],
      select: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Defense in depth: even if a document ever gets serialized without
// going through a controller's explicit safe-shape mapping (e.g. a
// future console.log(user) or an unguarded res.json(user)), the hash
// still never appears in JSON output.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
