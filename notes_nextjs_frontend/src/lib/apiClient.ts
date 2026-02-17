import { getApiBaseUrl } from "@/lib/env";

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
};

export type NoteCreate = {
  title: string;
  content: string;
  tags?: string[];
};

export type NoteUpdate = {
  title?: string;
  content?: string;
  tags?: string[];
};

type ApiErrorShape = {
  detail?: unknown;
};

function asErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Unexpected error";
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const base = getApiBaseUrl();
  if (!base) return "";
  const url = new URL(base + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options: RequestInit & { query?: Record<string, string | undefined> } = {}
): Promise<T> {
  const url = buildUrl(path, options.query);
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_NOTES_API_BASE_URL. Please configure it in the frontend .env."
    );
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as ApiErrorShape | unknown;
    const detail =
      data && typeof data === "object" && "detail" in data
        ? (data as ApiErrorShape).detail
        : data;

    const message =
      typeof detail === "string"
        ? detail
        : `Request failed (${res.status})`;

    throw new Error(message);
  }

  return (await parseJsonSafe(res)) as T;
}

// PUBLIC_INTERFACE
export async function listNotes(params?: {
  q?: string;
  tag?: string;
}): Promise<Note[]> {
  /** Lists notes, optionally filtered by search query and tag. */
  return request<Note[]>("/notes", {
    method: "GET",
    query: { q: params?.q, tag: params?.tag },
    cache: "no-store",
  });
}

// PUBLIC_INTERFACE
export async function getNote(noteId: string): Promise<Note> {
  /** Fetch a single note by id. */
  return request<Note>(`/notes/${encodeURIComponent(noteId)}`, {
    method: "GET",
    cache: "no-store",
  });
}

// PUBLIC_INTERFACE
export async function createNote(payload: NoteCreate): Promise<Note> {
  /** Create a note. */
  return request<Note>("/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateNote(
  noteId: string,
  payload: NoteUpdate
): Promise<Note> {
  /** Update a note by id. */
  return request<Note>(`/notes/${encodeURIComponent(noteId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId: string): Promise<{ ok: true }> {
  /** Delete a note by id. */
  await request<unknown>(`/notes/${encodeURIComponent(noteId)}`, {
    method: "DELETE",
  });
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function listTags(): Promise<string[]> {
  /** List all tags. */
  try {
    return await request<string[]>("/tags", { method: "GET", cache: "no-store" });
  } catch (err) {
    // If backend doesn't support /tags yet, degrade gracefully.
    // UI will still show tags derived from notes.
    throw new Error(asErrorMessage(err));
  }
}
