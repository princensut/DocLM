import { Spinner } from "../../components/ui/Primitives";

/**
 * Splits the message text on [n] markers and renders each marker as
 * a clickable button that opens the corresponding citation, per
 * PRD §4.9 / FRONTEND.md §4.3.
 */
function renderContentWithCitations(content, citations, onCitationClick) {
  const parts = content.split(/(\[\d+\])/g);

  return parts.map((part, i) => {
    const match = /^\[(\d+)\]$/.exec(part);
    if (!match) return <span key={i}>{part}</span>;

    const marker = parseInt(match[1], 10);
    const citation = citations.find((c) => c.marker === marker);
    if (!citation) return <span key={i}>{part}</span>;

    return (
      <button
        key={i}
        onClick={() => onCitationClick(citation)}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/15 px-1 text-xs font-medium text-accent hover:bg-accent/25 transition-colors"
      >
        {marker}
      </button>
    );
  });
}

export default function MessageBubble({ message, onCitationClick }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-contrast">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[80%] rounded-lg border px-4 py-2.5 text-sm ${
          message.notFound
            ? "border-border bg-surface text-text-muted italic"
            : message.isError
            ? "border-danger/30 bg-danger/5 text-danger"
            : "border-border bg-bg-elevated text-text"
        }`}
      >
        {message.content ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            {renderContentWithCitations(message.content, message.citations || [], onCitationClick)}
          </p>
        ) : (
          message.isStreaming && <Spinner className="h-4 w-4 text-text-muted" />
        )}
        {message.isStreaming && message.content && (
          <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-current align-middle" />
        )}
      </div>
    </div>
  );
}
