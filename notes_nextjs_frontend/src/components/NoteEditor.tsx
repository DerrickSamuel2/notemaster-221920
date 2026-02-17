"use client";

import React, { useMemo, useState } from "react";
import type { Note, NoteCreate } from "@/lib/apiClient";

type NoteEditorProps = {
  initial?: Partial<Pick<Note, "title" | "content" | "tags">>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (payload: NoteCreate) => Promise<void> | void;
};

function normalizeTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/\s+/g, " "));
}

// PUBLIC_INTERFACE
export function NoteEditor(props: NoteEditorProps) {
  /** Controlled note editor form used for create/edit. */
  const [title, setTitle] = useState(props.initial?.title ?? "");
  const [content, setContent] = useState(props.initial?.content ?? "");
  const [tagsText, setTagsText] = useState(
    (props.initial?.tags ?? []).join(", ")
  );
  const tags = useMemo(() => normalizeTags(tagsText), [tagsText]);

  const [localError, setLocalError] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!title.trim()) {
      setLocalError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setLocalError("Content is required.");
      return;
    }

    await props.onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags,
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {localError ? (
        <div className="card p-3 border-[var(--danger)]">
          <p className="text-sm font-bold" style={{ color: "var(--danger)" }}>
            {localError}
          </p>
        </div>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">Title</span>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Buy milk"
          maxLength={120}
          disabled={props.busy}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">Content</span>
        <textarea
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          disabled={props.busy}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold">
          Tags{" "}
          <span className="text-xs font-normal text-[var(--muted)]">
            (comma-separated)
          </span>
        </span>
        <input
          className="input"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="work, personal, ideas"
          disabled={props.busy}
        />
      </label>

      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="badge">
              #{t}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Tip: add tags to filter notes quickly.
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <button type="submit" className="btn btnPrimary" disabled={props.busy}>
          {props.busy ? "Saving..." : props.submitLabel}
        </button>
      </div>
    </form>
  );
}
