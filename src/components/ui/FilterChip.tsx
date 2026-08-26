import { cn } from "@/lib/cn";
import { IconClose } from "./icons";

type FilterChipProps = {
  label: string;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  showClear?: boolean;
};

export function FilterChip({
  label,
  pressed = false,
  onPressedChange,
  disabled,
  showClear,
}: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn("filter-chip")}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange?.(!pressed)}
    >
      {label}
      {pressed && showClear ? (
        <IconClose width={16} height={16} aria-hidden />
      ) : null}
    </button>
  );
}
