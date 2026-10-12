export function Mark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <rect width="32" height="32" rx="8" className="fill-copper" />
      <path
        d="M21.2 10.4c-1.1-1.4-2.8-2.2-5.1-2.2-4.2 0-7 2.8-7 7.8s2.8 7.8 7 7.8c2.3 0 4-0.8 5.1-2.2"
        stroke="#FBF7EE"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
