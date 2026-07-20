import { X } from "lucide-react";

export default function CitationPanel({ citation, onClose }) {
  if (!citation) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-border bg-bg-elevated shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold">
          Source {citation.marker}
          {citation.pageNumber && <span className="text-text-muted"> · page {citation.pageNumber}</span>}
        </h2>
        <button onClick={onClose} className="text-text-muted hover:text-text" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{citation.text}</p>
      </div>
    </div>
  );
}
