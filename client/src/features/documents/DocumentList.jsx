import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, MessageSquare } from "lucide-react";
import DocumentStatusBadge from "./DocumentStatusBadge";
import Button from "../../components/ui/Button";

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentList({ documents, onDelete }) {
  const navigate = useNavigate();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-text-muted">
        <p>No documents yet. Upload one above to start asking questions.</p>
      </div>
    );
  }

  const confirmDelete = async (id) => {
    await onDelete(id);
    setPendingDeleteId(null);
  };

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-bg-elevated">
      {documents.map((doc) => (
        <div key={doc._id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText size={18} className="shrink-0 text-text-muted" />
            <div className="min-w-0">
              <p className="truncate font-medium">{doc.originalFileName}</p>
              <p className="text-xs text-text-muted">
                {formatSize(doc.sizeBytes)} · {formatDate(doc.createdAt)}
                {doc.status === "failed" && doc.errorMessage && (
                  <span className="text-danger"> · {doc.errorMessage}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DocumentStatusBadge status={doc.status} />
            <Button
              variant="ghost"
              disabled={doc.status !== "ready"}
              onClick={() => navigate(`/chat/${doc._id}`)}
              aria-label="Chat with this document"
            >
              <MessageSquare size={16} />
            </Button>

            {pendingDeleteId === doc._id ? (
              <div className="flex items-center gap-1">
                <Button variant="danger" onClick={() => confirmDelete(doc._id)}>
                  Confirm
                </Button>
                <Button variant="ghost" onClick={() => setPendingDeleteId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => setPendingDeleteId(doc._id)} aria-label="Delete document">
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
