import type { ReactNode } from "react";

type IconProps = {
  title?: string;
  className?: string;
};

function Svg({ title, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconFooterPlug(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M8.4 3.2a1 1 0 0 1 1 1V7h5.2V4.2a1 1 0 1 1 2 0V7h.4A2.8 2.8 0 0 1 19.8 9.8v3.2a6.8 6.8 0 0 1-5.8 6.72V21.2a1 1 0 1 1-2 0v-1.48A6.8 6.8 0 0 1 6.2 13V9.8A2.8 2.8 0 0 1 9 7h.4V4.2a1 1 0 0 1 1-1Z"
      />
    </Svg>
  );
}

export function IconFooterMail(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.2" y="5.5" width="17.6" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.2 7.4 7.1 5.2c.4.3 1 .3 1.4 0l7.1-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconFooterPhone(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M7.4 3.4c.5-.5 1.3-.5 1.8 0l1.7 1.7c.5.5.5 1.3 0 1.8l-.9.9a1.3 1.3 0 0 0-.2 1.5 11 11 0 0 0 5 5c.5.3 1.1.2 1.5-.2l.9-.9c.5-.5 1.3-.5 1.8 0l1.7 1.7c.5.5.5 1.3 0 1.8l-1.1 1.1c-.7.7-1.7 1.1-2.7 1-4.3-.4-8.3-2.6-11.2-5.5S3.8 9.2 3.4 4.9c-.1-1 .3-2 1-2.7z"
      />
    </Svg>
  );
}

export function IconFacebook(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M14.3 21v-7.1h2.4l.36-2.8h-2.76V9.3c0-.8.22-1.35 1.4-1.35h1.48V5.45A19 19 0 0 0 14.7 5c-2.17 0-3.66 1.3-3.66 3.74v2.36H8.6v2.8h2.44V21h3.26Z"
      />
    </Svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" />
    </Svg>
  );
}

export function IconYouTube(props: IconProps) {
  return (
    <Svg {...props}>
      <path fill="currentColor" d="M9.2 8.2v7.6L16.4 12 9.2 8.2Z" />
    </Svg>
  );
}

export function IconLinkedIn(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M6.4 9.2H3.7V20h2.7V9.2ZM5.05 4A1.6 1.6 0 1 0 5 7.2 1.6 1.6 0 0 0 5.05 4ZM20.3 20h-2.7v-5.6c0-1.55-.55-2.6-1.92-2.6-1.05 0-1.67.7-1.95 1.38-.1.24-.12.58-.12.92V20h-2.7s.04-8.55 0-9.44h2.7v1.34c.36-.55 1-1.34 2.44-1.34 1.78 0 3.12 1.16 3.12 3.66V20Z"
      />
    </Svg>
  );
}
