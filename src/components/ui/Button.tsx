import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "destructive";

type CommonProps = {
  variant?: ButtonVariant;
  loading?: boolean;
  block?: boolean;
  size?: "md" | "sm";
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  disabled?: boolean;
  external?: boolean;
  onClick?: () => void;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    loading = false,
    block = false,
    size = "md",
    className,
    children,
  } = props;

  const classes = cn(
    "png-btn",
    `png-btn--${variant}`,
    size === "sm" && "png-btn--sm",
    block && "png-btn--block",
    className,
  );

  if ("href" in props && props.href) {
    const disabled = Boolean(props.disabled || loading);
    if (disabled) {
      return (
        <span className={classes} aria-disabled="true">
          {loading ? <Spinner label="Loading" /> : null}
          {children}
        </span>
      );
    }
    const href = props.href;
    if (href.startsWith("tel:") || href.startsWith("mailto:")) {
      return (
        <a href={href} className={classes} onClick={props.onClick}>
          {loading ? <Spinner label="Loading" /> : null}
          {children}
        </a>
      );
    }
    if (props.external || /^(https?:)?\/\//.test(href)) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" onClick={props.onClick}>
          {loading ? <Spinner label="Loading" /> : null}
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} onClick={props.onClick}>
        {loading ? <Spinner label="Loading" /> : null}
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const disabled = Boolean(buttonProps.disabled || loading);

  return (
    <button
      type={buttonProps.type ?? "button"}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={buttonProps.onClick}
      name={buttonProps.name}
    >
      {loading ? <Spinner label="Loading" /> : null}
      {children}
    </button>
  );
}
