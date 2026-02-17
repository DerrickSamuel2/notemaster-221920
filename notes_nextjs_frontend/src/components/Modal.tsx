"use client";

import React, { useEffect, useId, useRef } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  onClose: () => void;
};

// PUBLIC_INTERFACE
export function Modal(props: ModalProps) {
  /** Accessible modal dialog used for note create/edit flows. */
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!props.open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  useEffect(() => {
    if (!props.open) return;
    // Focus the panel for basic focus management.
    panelRef.current?.focus();
  }, [props.open]);

  if (!props.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={props.description ? descriptionId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-black/30"
        onClick={props.onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl card outline-none"
      >
        <div className="cardHeader">
          <h2 id={titleId} className="text-lg font-bold">
            {props.title}
          </h2>
          {props.description ? (
            <p id={descriptionId} className="text-sm text-[var(--muted)] mt-1">
              {props.description}
            </p>
          ) : null}
        </div>

        <div className="cardBody">{props.children}</div>

        {(props.primaryAction || props.secondaryAction) && (
          <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2 justify-end">
            {props.secondaryAction}
            {props.primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
