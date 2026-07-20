const VARIANTS = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary: "bg-surface text-text hover:bg-surface-hover border border-border",
  ghost: "bg-transparent text-text hover:bg-surface",
  danger: "bg-danger text-white hover:opacity-90",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
