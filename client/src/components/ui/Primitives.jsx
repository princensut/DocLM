export function Input({ label, error, className = "", id, ...rest }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent outline-none transition-colors ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const TOAST_STYLES = {
  error: "border-danger/40 text-danger",
  success: "border-success/40 text-success",
  info: "border-border text-text",
};

export function Toast({ message, type = "info", onDismiss }) {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-md border bg-bg-elevated px-4 py-3 text-sm shadow-card ${TOAST_STYLES[type]}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button onClick={onDismiss} className="text-text-muted hover:text-text" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
