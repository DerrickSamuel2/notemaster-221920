"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
  type Note,
} from "@/lib/apiClient";
import { getApiBaseUrl } from "@/lib/env";
import { Modal } from "@/components/Modal";
import { NoteEditor } from "@/components/NoteEditor";
import { NoteCard } from "@/components/NoteCard";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready" };

function uniqueTagsFromNotes(notes: Note[]): string[] {
  const set = new Set<string>();
  for (const n of notes) for (const t of n.tags ?? []) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function HomePage() {
  const apiBaseUrl = getApiBaseUrl();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const [mutating, setMutating] = useState(false);
  const [toast, setToast] = useState<string>("");

  const tags = useMemo(() => uniqueTagsFromNotes(notes), [notes]);

  const filteredNotes = notes;

  async function refresh() {
    try {
      setLoadState({ kind: "loading" });
      const result = await listNotes({ q: query, tag: activeTag });
      setNotes(result);
      setLoadState({ kind: "ready" });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to load notes";
      setLoadState({ kind: "error", message });
    }
  }

  useEffect(() => {
    // Client-side fetching only (static export compatible)
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced refresh when query/tag changes
  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTag]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const emptyState =
    loadState.kind === "ready" && filteredNotes && filteredNotes.length === 0;

  const missingEnv = !apiBaseUrl;

  return (
    <div className="appShell">
      <header className="border-b-2 border-[var(--border)] bg-[var(--surface)]">
        <div className="container py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-extrabold">NoteMaster</h1>
            <span className="badge" title="Retro mode enabled">
              Retro UI
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="flex flex-col gap-1 sm:w-[320px]">
              <span className="srOnly">Search notes</span>
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search... (title/content)"
              />
            </label>

            <button className="btn btnPrimary" onClick={() => setCreateOpen(true)}>
              + New Note
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6 flex-1">
        {missingEnv ? (
          <section className="card">
            <div className="cardHeader">
              <h2 className="text-lg font-extrabold">Configuration needed</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                This frontend needs a public API base URL to call the FastAPI backend.
              </p>
            </div>
            <div className="cardBody flex flex-col gap-3">
              <p className="text-sm">
                Set{" "}
                <span className="kbdHint">NEXT_PUBLIC_NOTES_API_BASE_URL</span>{" "}
                in the frontend environment (e.g.{" "}
                <span className="kbdHint">http://localhost:3001</span>).
              </p>
              <p className="text-sm text-[var(--muted)]">
                Once set, refresh the page.
              </p>
            </div>
          </section>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <aside className="card w-full lg:w-[260px]">
              <div className="cardHeader">
                <h2 className="text-base font-extrabold">Tags</h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Click to filter. Notes drive tags.
                </p>
              </div>
              <div className="cardBody flex flex-col gap-2">
                <button
                  type="button"
                  className={`badge ${activeTag === "" ? "badgeActive" : ""}`}
                  onClick={() => setActiveTag("")}
                >
                  All
                </button>
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`badge ${activeTag === t ? "badgeActive" : ""}`}
                        onClick={() => setActiveTag(t)}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    No tags yet. Add some in a note.
                  </p>
                )}

                <hr className="hrDashed mt-2" />

                <button type="button" className="btn" onClick={() => void refresh()}>
                  Refresh
                </button>
              </div>
            </aside>

            <section className="w-full flex-1 flex flex-col gap-4">
              {loadState.kind === "loading" ? (
                <div className="card">
                  <div className="cardBody">
                    <p className="text-sm font-bold">Loading notes...</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Talking to the backend.
                    </p>
                  </div>
                </div>
              ) : null}

              {loadState.kind === "error" ? (
                <div className="card">
                  <div className="cardHeader">
                    <h2 className="text-base font-extrabold">Couldn’t load notes</h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {loadState.message}
                    </p>
                  </div>
                  <div className="cardBody flex flex-col gap-2">
                    <button type="button" className="btn" onClick={() => void refresh()}>
                      Try again
                    </button>
                    <p className="text-xs text-[var(--muted)]">
                      Check that the backend is running and CORS allows this origin.
                    </p>
                  </div>
                </div>
              ) : null}

              {emptyState ? (
                <div className="card">
                  <div className="cardHeader">
                    <h2 className="text-base font-extrabold">No notes found</h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Try clearing search / tag filters, or create your first note.
                    </p>
                  </div>
                  <div className="cardBody flex gap-2">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setQuery("");
                        setActiveTag("");
                      }}
                    >
                      Clear filters
                    </button>
                    <button
                      type="button"
                      className="btn btnPrimary"
                      onClick={() => setCreateOpen(true)}
                    >
                      + New Note
                    </button>
                  </div>
                </div>
              ) : null}

              {loadState.kind === "ready" && filteredNotes.length ? (
                <div className="gridNotes">
                  {filteredNotes.map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      onEdit={(note) => setEditTarget(note)}
                      onDelete={(note) => setDeleteTarget(note)}
                      onClickTag={(t) => setActiveTag(t)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        )}
      </main>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 card px-4 py-2">
          <p className="text-sm font-bold">{toast}</p>
        </div>
      ) : null}

      <Modal
        open={createOpen}
        title="Create Note"
        description="Write something rad. Add tags to make it searchable."
        onClose={() => (mutating ? null : setCreateOpen(false))}
        secondaryAction={
          <button
            type="button"
            className="btn"
            onClick={() => setCreateOpen(false)}
            disabled={mutating}
          >
            Cancel
          </button>
        }
      >
        <NoteEditor
          submitLabel="Create"
          busy={mutating}
          onSubmit={async (payload) => {
            try {
              setMutating(true);
              await createNote(payload);
              setToast("Note created.");
              setCreateOpen(false);
              await refresh();
            } finally {
              setMutating(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={!!editTarget}
        title="Edit Note"
        description="Tweak it until it’s perfect."
        onClose={() => (mutating ? null : setEditTarget(null))}
        secondaryAction={
          <button
            type="button"
            className="btn"
            onClick={() => setEditTarget(null)}
            disabled={mutating}
          >
            Cancel
          </button>
        }
      >
        {editTarget ? (
          <NoteEditor
            initial={editTarget}
            submitLabel="Save"
            busy={mutating}
            onSubmit={async (payload) => {
              try {
                setMutating(true);
                await updateNote(editTarget.id, {
                  title: payload.title,
                  content: payload.content,
                  tags: payload.tags,
                });
                setToast("Note saved.");
                setEditTarget(null);
                await refresh();
              } finally {
                setMutating(false);
              }
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={!!deleteTarget}
        title="Delete note?"
        description="This can’t be undone."
        onClose={() => (mutating ? null : setDeleteTarget(null))}
        secondaryAction={
          <button
            type="button"
            className="btn"
            onClick={() => setDeleteTarget(null)}
            disabled={mutating}
          >
            Cancel
          </button>
        }
        primaryAction={
          <button
            type="button"
            className="btn btnDanger"
            onClick={async () => {
              if (!deleteTarget) return;
              try {
                setMutating(true);
                await deleteNote(deleteTarget.id);
                setToast("Note deleted.");
                setDeleteTarget(null);
                await refresh();
              } finally {
                setMutating(false);
              }
            }}
            disabled={mutating}
          >
            {mutating ? "Deleting..." : "Delete"}
          </button>
        }
      >
        {deleteTarget ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              You’re about to delete:{" "}
              <span className="kbdHint">{deleteTarget.title}</span>
            </p>
          </div>
        ) : null}
      </Modal>

      <footer className="border-t-2 border-[var(--border)] bg-[var(--surface)]">
        <div className="container py-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <p className="text-xs text-[var(--muted)]">
            Client-side fetching (static export compatible). API:{" "}
            <span className="kbdHint">
              {apiBaseUrl || "NOT SET"}
            </span>
          </p>
          <p className="text-xs text-[var(--muted)]">
            Tips: Search text + click tags to filter.
          </p>
        </div>
      </footer>
    </div>
  );
}
