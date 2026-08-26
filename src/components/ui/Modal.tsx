"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconClose } from "./icons";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: "modal" | "sheet";
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  title,
  onClose,
  children,
  variant = "modal",
}: ModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const sheetClass = variant === "sheet" ? "sheet sheet--bottom" : "sheet sheet--modal";

  return (
    <>
      <button
        type="button"
        className="overlay"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={sheetClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: 16,
            borderBottom: "1px solid var(--color-border-default)",
          }}
        >
          <h2 id={titleId} className="type-h3" style={{ margin: 0 }}>
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="png-btn png-btn--outline png-btn--sm"
            style={{ width: 44, padding: 0 }}
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </>
  );
}
