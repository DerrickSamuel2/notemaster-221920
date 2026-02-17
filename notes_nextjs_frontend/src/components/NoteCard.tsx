"use client";

import React from "react";
import type { Note } from "@/lib/apiClient";

type NoteCardProps = {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onClickTag: (tag: string) => void;
};

// PUBLIC_INTERFACE
export function NoteCard(props: NoteCardProps) {
  /** Retro card rendering for a note with actions. */
  return (
    <article className="card overflow-hidden">
      <div className="cardHeader flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold truncate">{props.note.title}</h3>
          <p className="text-xs text-[var(--muted)] mt-1">
            {props.note.tags?.length ? "Tagged" : "No tags"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btnGhost"
            onClick={() => props.onEdit(props.note)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btnGhost"
            onClick={() => props.onDelete(props.note)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="cardBody flex flex-col gap-3">
        <p className="text-sm leading-6 whitespace-pre-wrap break-words">
          {props.note.content}
        </p>

        {props.note.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {props.note.tags.map((t) => (
              <button
                key={t}
                type="button"
                className="badge"
                onClick={() => props.onClickTag(t)}
                title={`Filter by #${t}`}
              >
                #{t}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
