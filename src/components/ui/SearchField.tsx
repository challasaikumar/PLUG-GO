"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconSearch } from "./icons";
import { Spinner } from "./Spinner";
import { TextInput } from "./TextInput";

export type SearchSuggestion = {
  id: string;
  label: string;
};

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  error?: string;
  empty?: boolean;
  offline?: boolean;
  disabled?: boolean;
  onRetry?: () => void;
  label?: string;
  name?: string;
  placeholder?: string;
  id?: string;
  help?: string;
  maxLength?: number;
};

export function SearchField({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  loading = false,
  error,
  empty = false,
  offline = false,
  disabled = false,
  onRetry,
  label = "Location",
  name = "location",
  placeholder = "City, pincode, or landmark",
  id,
  help,
  maxLength,
}: SearchFieldProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const visibleSuggestions = useMemo(
    () => (value.trim().length >= 1 ? suggestions : []),
    [suggestions, value],
  );

  function select(label: string) {
    onChange(label);
    setOpen(false);
    onSubmit?.(label);
  }

  return (
    <div style={{ position: "relative" }}>
      <TextInput
        id={id}
        label={label}
        name={name}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        aria-busy={loading || undefined}
        role="combobox"
        aria-expanded={open && visibleSuggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        error={error}
        help={
          help ??
          (offline
            ? "Search needs a connection. Type a city if you already know it."
            : "Used to sort nearby stations. You can type a city instead.")
        }
        leading={<IconSearch />}
        trailing={loading ? <Spinner /> : null}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, visibleSuggestions.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (activeIndex >= 0 && visibleSuggestions[activeIndex]) {
              select(visibleSuggestions[activeIndex].label);
            } else {
              onSubmit?.(value);
              setOpen(false);
            }
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && visibleSuggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="paper-card"
          style={{
            position: "absolute",
            zIndex: "var(--z-dropdown)",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 280,
            overflow: "auto",
            boxShadow: "var(--shadow-md)",
            padding: 0,
            listStyle: "none",
          }}
        >
          {visibleSuggestions.map((item, index) => (
            <li key={item.id} role="presentation">
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn("png-btn png-btn--outline png-btn--block")}
                style={{
                  border: 0,
                  borderRadius: 0,
                  justifyContent: "flex-start",
                  background:
                    index === activeIndex ? "var(--color-surface-inset)" : "transparent",
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(item.label)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {empty && !loading && value.trim() ? (
        <p className="field-help">No matching places. Try a pincode or city.</p>
      ) : null}
      {error && onRetry ? (
        <div style={{ marginTop: 8 }}>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
