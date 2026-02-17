/**
 * Client-side environment access helpers.
 * Next.js static export requires API calls to be done client-side with a public base URL.
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl(): string {
  /** Returns the API base URL from NEXT_PUBLIC_NOTES_API_BASE_URL. */
  const baseUrl = process.env.NEXT_PUBLIC_NOTES_API_BASE_URL;
  if (!baseUrl) {
    // Keep the error actionable; UI will surface it.
    return "";
  }
  return baseUrl.replace(/\/+$/, "");
}
