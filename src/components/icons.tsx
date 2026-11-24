// Hand-drawn line icon set. One visual language: 24px grid, 1.7 stroke,
// rounded joins. Emoji are avoided in navigation and controls.
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'home' | 'book' | 'layers' | 'repeat' | 'timer' | 'pen' | 'chart'
  | 'calendar' | 'database' | 'help' | 'more' | 'install' | 'download'
  | 'upload' | 'sun' | 'moon' | 'monitor' | 'check' | 'x' | 'chevron-left'
  | 'chevron-right' | 'chevron-down' | 'wifi-off' | 'sparkles' | 'bookmark'
  | 'flame' | 'target' | 'plus' | 'trash' | 'refresh' | 'alert' | 'check-circle'
  | 'clock' | 'palette' | 'search' | 'play' | 'pause' | 'square' | 'star'
  | 'shield' | 'arrow-up-right' | 'menu' | 'leaf' | 'list' | 'devices' | 'share'
  | 'eye' | 'bell' | 'copy';

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M3.5 10.6 12 3.5l8.5 7.1" /><path d="M5.5 9.5v10h13v-10" /><path d="M9.5 19.5v-5.5h5v5.5" /></>,
  book: <><path d="M12 6.3C10.3 4.9 8.2 4.2 5 4.2c-.6 0-1 .4-1 1v12.6c0 .6.4 1 1 1 3.2 0 5.3.7 7 2.1 1.7-1.4 3.8-2.1 7-2.1.6 0 1-.4 1-1V5.2c0-.6-.4-1-1-1-3.2 0-5.3.7-7 2.1Z" /><path d="M12 6.3v14.6" /></>,
  layers: <><path d="m12 3.6 8.4 4.6L12 12.8 3.6 8.2 12 3.6Z" /><path d="m3.6 12.3 8.4 4.6 8.4-4.6" /><path d="m3.6 16.3 8.4 4.6 8.4-4.6" /></>,
  repeat: <><path d="M4 7.5h12.5a3 3 0 0 1 3 3v1" /><path d="m7 4.5-3 3 3 3" /><path d="M20 16.5H7.5a3 3 0 0 1-3-3v-1" /><path d="m17 13.5 3 3-3 3" /></>,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9.5V13l2.4 1.6" /><path d="M9.5 2.5h5" /><path d="M19 5.5 20.5 7" /></>,
  pen: <><path d="M4 20h4l10.4-10.4a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14.5 6.5 3 3" /><path d="M4 20h16" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16.5v-4.8" /><path d="M12 16.5V7.5" /><path d="M16 16.5v-7" /><path d="M20 16.5V9.5" /></>,
  calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17" /><path d="M8 3.5v4M16 3.5v4" /><path d="m8.5 15 2 2 4-4" /></>,
  database: <><ellipse cx="12" cy="6" rx="7.5" ry="3" /><path d="M4.5 6v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6" /><path d="M4.5 12v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.7v.4" /><path d="M12 17.3h.01" /></>,
  more: <><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></>,
  install: <><rect x="4" y="3.5" width="16" height="12" rx="2" /><path d="M8.5 19.5h7" /><path d="M12 15.5v4" /><path d="M12 12.5V7" /><path d="m9.5 9.5 2.5-2.5 2.5 2.5" /></>,
  download: <><path d="M12 4v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4.5 20h15" /></>,
  upload: <><path d="M12 20V9" /><path d="m7.5 13.5 4.5-4.5 4.5 4.5" /><path d="M4.5 4h15" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>,
  moon: <><path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12.5" rx="2" /><path d="M8.5 20h7M12 16.5V20" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 6.5" /></>,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  'chevron-left': <><path d="m14.5 5-6.5 7 6.5 7" /></>,
  'chevron-right': <><path d="m9.5 5 6.5 7-6.5 7" /></>,
  'chevron-down': <><path d="m5 9.5 7 6.5 7-6.5" /></>,
  'wifi-off': <><path d="M3 4.5 20.5 22" /><path d="M8.5 15.5a5 5 0 0 1 7 0" /><path d="M5 12a10.5 10.5 0 0 1 4-2.4" /><path d="M15.8 9.8A10.5 10.5 0 0 1 19 12" /><path d="M2 8.5A15 15 0 0 1 6.6 6.2" /><path d="M17.6 6.6A15 15 0 0 1 22 8.5" /><path d="M12 18.8h.01" /></>,
  sparkles: <><path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.6l-1.6-5.4L5 10.6 10.4 9 12 3.5Z" /><path d="M18.5 16.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" /></>,
  bookmark: <><path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.4 6.5 21V4.5Z" /></>,
  flame: <><path d="M12 21c3.9 0 6.5-2.5 6.5-6.2 0-3-1.8-5-3.3-6.6-.9-1-1.6-2-1.9-3.2-2.4 1.7-3.4 4-3.2 6.1-1.1-.5-1.9-1.2-2.4-2.2-1.4 1.6-2.2 3.6-2.2 5.9C5.5 18.5 8.1 21 12 21Z" /><path d="M10 17.5c0-2 2-2.6 2-4.5 1.4 1.2 2 2.7 2 4.5 0 1.1-.9 2-2 2s-2-.9-2-2Z" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="0.8" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l.8 12.2c0 .7.6 1.3 1.3 1.3h6.8c.7 0 1.3-.6 1.3-1.3L17.5 7" /><path d="M10 11v6M14 11v6" /></>,
  refresh: <><path d="M20 5.5v5h-5" /><path d="M19.2 10.5A8 8 0 1 0 20 14" /></>,
  alert: <><path d="M12 3.5 21 20H3L12 3.5Z" /><path d="M12 9.5v4.5" /><path d="M12 17.3h.01" /></>,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="m8 12.2 2.6 2.6L16 9.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.9 2-2 0-1.6 1-2.2 2.3-2.2h1.2c1.7 0 3-1.4 3-3.1A9.7 9.7 0 0 0 12 3.5Z" /><path d="M7.5 11h.01M9.5 7.8h.01M13.5 7.5h.01M17 10h.01" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></>,
  play: <><path d="M8 5.5 18.5 12 8 18.5v-13Z" /></>,
  pause: <><path d="M8.5 5.5v13M15.5 5.5v13" /></>,
  square: <><rect x="6" y="6" width="12" height="12" rx="2" /></>,
  star: <><path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.8Z" /></>,
  shield: <><path d="M12 3 19 5.6v5.2c0 4.4-2.8 7.8-7 10.2-4.2-2.4-7-5.8-7-10.2V5.6L12 3Z" /><path d="m9 11.8 2.2 2.2 4-4" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M9 7h8v8" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  leaf: <><path d="M20 4c-8.5-.5-15 3.5-15 9.5A6.5 6.5 0 0 0 11.5 20C17.5 20 20.5 13.5 20 4Z" /><path d="M4 21c2.5-6 6.5-9.5 12-12" /></>,
  list: <><path d="M9 6.5h11M9 12h11M9 17.5h11" /><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" /></>,
  devices: <><rect x="2.5" y="5" width="13" height="10" rx="2" /><path d="M7 19h5M9.5 15v4" /><rect x="17" y="9" width="4.5" height="9" rx="1.5" /></>,
  share: <><path d="M12 15V4" /><path d="m8 8 4-4 4 4" /><path d="M5 13v6.5h14V13" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></>,
};

export function Icon({
  name, size = 18, className, strokeWidth = 1.7, ...rest
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
