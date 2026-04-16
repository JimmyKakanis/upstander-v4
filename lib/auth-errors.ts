/**
 * Maps Firebase Auth errors to short, user-facing copy.
 * Firebase sometimes puts the code only inside `message` (e.g. "Firebase: Error (auth/...).")
 * or uses non-standard code strings for API key issues — we normalize those too.
 */

const API_KEY_MSG =
  "Sign-in can’t reach the service (configuration or API key). Refresh the page, confirm environment variables on the server, or contact support.";

const GENERIC_AUTH_MSG = "Sign-in failed. Check your email and password, or contact support.";

const BY_CODE: Record<string, string> = {
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled":
    "This account has been disabled. Contact your school or support.",
  "auth/user-not-found":
    "No account found with this email. Check the spelling or create an account.",
  "auth/wrong-password":
    "Incorrect password. Try again or use “Forgot password?”.",
  "auth/invalid-credential":
    "Email or password is incorrect. If you recently changed your password, try the new one.",
  "auth/email-already-in-use":
    "An account already exists with this email. Try logging in instead.",
  "auth/weak-password": "Password is too weak. Use at least 8 characters.",
  "auth/too-many-requests":
    "Too many attempts. Wait a few minutes and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/requires-recent-login":
    "For security, sign out and sign in again, then retry.",
  "auth/operation-not-allowed":
    "This sign-in method isn’t enabled. Contact support.",
};

function extractCodeFromMessage(message: string): string {
  const paren = message.match(/\((auth\/[^)]+)\)/);
  if (paren?.[1]) return normalizeCode(paren[1]);
  const loose = message.match(/\b(auth\/[a-z0-9_.-]+)\b/i);
  return loose?.[1] ? normalizeCode(loose[1]) : "";
}

function normalizeCode(code: string): string {
  return code.replace(/\.+$/g, "").trim();
}

function getAuthCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const c = normalizeCode((error as { code: string }).code);
    if (c) return c;
  }
  if (error instanceof Error && error.message) {
    return extractCodeFromMessage(error.message);
  }
  return "";
}

export function getAuthErrorMessage(error: unknown): string {
  const code = getAuthCode(error);
  const msg =
    error instanceof Error ? error.message : String(error ?? "");

  if (code && BY_CODE[code]) return BY_CODE[code];

  const codeOrMsg = `${code} ${msg}`;
  if (/api-key|apikey/i.test(codeOrMsg)) {
    return API_KEY_MSG;
  }

  if (code.startsWith("auth/")) {
    return GENERIC_AUTH_MSG;
  }

  if (/^Firebase:\s*Error/i.test(msg) || /\((auth\/[^)]+)\)/.test(msg)) {
    return GENERIC_AUTH_MSG;
  }

  if (/api-key|api key/i.test(msg)) {
    return API_KEY_MSG;
  }

  return msg || "Something went wrong. Please try again.";
}
