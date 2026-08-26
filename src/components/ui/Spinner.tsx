import { cn } from "@/lib/cn";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span className={cn("spinner", className)} role="status" aria-label={label} />
  );
}
