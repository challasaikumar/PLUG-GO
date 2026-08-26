import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function IconBase({ title, children, ...props }: IconProps) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.2 2.2 4.8-5.4" />
    </IconBase>
  );
}

export function IconClock(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </IconBase>
  );
}

export function IconWarningDiamond(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3.5 8.5 8.5-8.5 8.5-8.5-8.5Z" />
      <path d="M12 8.5v4" />
      <path d="M12 16h.01" />
    </IconBase>
  );
}

export function IconMinusCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </IconBase>
  );
}

export function IconQuestionCircle(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1-1.4 1.9" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

export function IconStale(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      <path d="M12 7.5V12l2.5 1.5" />
    </IconBase>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function IconClose(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </IconBase>
  );
}

export function IconSupport(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 14v-2a5 5 0 0 1 10 0v2" />
      <path d="M6 14h2v4H6zM16 14h2v4h-2z" />
      <path d="M12 19v1" />
    </IconBase>
  );
}

export function IconPin(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </IconBase>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function IconBolt(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </IconBase>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14.5" r="1" />
    </IconBase>
  );
}

export function IconList(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17" />
    </IconBase>
  );
}

export function IconBan(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m6.2 6.2 11.6 11.6" />
    </IconBase>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h10v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4V3.5Z" />
      <path d="M9.5 8h5M9.5 12h5M9.5 16h3" />
    </IconBase>
  );
}

export function IconParking(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M9 8h4.2a2.8 2.8 0 0 1 0 5.6H9V8Z" />
      <path d="M9 8v11" />
    </IconBase>
  );
}

export function IconBookmark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 4h10v16l-5-3.2L7 20V4Z" />
    </IconBase>
  );
}

export function IconPercent(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m7 17 10-10" />
      <circle cx="8.5" cy="8.5" r="2" />
      <circle cx="15.5" cy="15.5" r="2" />
    </IconBase>
  );
}

export function IconTag(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12.5V5h7.5L20 13.5 13.5 20 4 12.5Z" />
      <circle cx="8.2" cy="8.2" r="1.2" />
    </IconBase>
  );
}

export function IconFile(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h7l5 5V20.5H7V3.5Z" />
      <path d="M14 3.5V9h5.5M9.5 13h5M9.5 16.5h3.5" />
    </IconBase>
  );
}
