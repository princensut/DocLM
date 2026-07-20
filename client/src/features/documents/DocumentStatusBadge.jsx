const STYLES = {
  uploading: "text-text-muted border-border",
  processing: "text-accent border-accent/40",
  ready: "text-success border-success/40",
  failed: "text-danger border-danger/40",
};

const LABELS = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export default function DocumentStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {(status === "processing" || status === "uploading") && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {LABELS[status] || status}
    </span>
  );
}
