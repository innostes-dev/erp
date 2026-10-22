import type { SVGProps } from 'react';

/** Placeholder mark for innostes. Replace with the real logo. */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="8" className="fill-blue-600" />
      <path d="M11 9h4v14h-4z" fill="white" />
      <path d="M17 9h4l-4 7 4 7h-4l-4-7z" fill="white" opacity="0.7" />
    </svg>
  );
}
