import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import ChatWindow from "../features/chat/ChatWindow";
import ChatInput from "../features/chat/ChatInput";
import CitationPanel from "../features/chat/CitationPanel";
import DocumentUploader from "../features/documents/DocumentUploader";
import DocumentStatusBadge from "../features/documents/DocumentStatusBadge";
import { useChat } from "../features/chat/useChat";
import { useDocuments } from "../features/documents/useDocuments";
import Button from "../components/ui/Button";
import { Toast } from "../components/ui/Primitives";

export default function ChatPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { documents, upload, isUploading } = useDocuments();
  const { messages, ask, isAsking } = useChat(documentId);
  const [activeCitation, setActiveCitation] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [toast, setToast] = useState(null);

  const document = documents.find((d) => d._id === documentId);

  const handleMidChatUpload = async (files) => {
    try {
      const uploaded = await upload(files);
      setShowUploader(false);
      setToast({
        message: `${uploaded.length} document(s) uploaded. Find them on your dashboard once processed.`,
        type: "success",
      });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Upload failed.", type: "error" });
    }
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-160px)] flex-col rounded-lg border border-border bg-bg-elevated">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} aria-label="Back to documents">
              <ArrowLeft size={16} />
            </Button>
            <div>
              <p className="font-medium">{document?.originalFileName || "Document"}</p>
              {document && <DocumentStatusBadge status={document.status} />}
            </div>
          </div>
          <Button variant="secondary" onClick={() => setShowUploader((v) => !v)}>
            <Plus size={16} />
            Upload document
          </Button>
        </div>

        {showUploader && (
          <div className="border-b border-border p-4">
            <DocumentUploader onUpload={handleMidChatUpload} isUploading={isUploading} />
          </div>
        )}

        <ChatWindow messages={messages} onCitationClick={setActiveCitation} />
        <ChatInput onSend={ask} disabled={isAsking} />
      </div>

      <CitationPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </AppShell>
  );
}
