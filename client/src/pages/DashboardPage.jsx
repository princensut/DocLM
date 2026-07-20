import AppShell from "../components/layout/AppShell";
import DocumentUploader from "../features/documents/DocumentUploader";
import DocumentList from "../features/documents/DocumentList";
import { useDocuments } from "../features/documents/useDocuments";
import { Toast } from "../components/ui/Primitives";
import { useState } from "react";

export default function DashboardPage() {
  const { documents, isLoading, upload, isUploading, remove } = useDocuments();
  const [toast, setToast] = useState(null);

  const handleUpload = async (files) => {
    try {
      await upload(files);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Upload failed.", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Couldn't delete this document.", type: "error" });
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Your documents</h1>
          <p className="mt-1 text-text-muted">
            Upload a document to start asking questions grounded in its content.
          </p>
        </div>

        <DocumentUploader onUpload={handleUpload} isUploading={isUploading} />

        {isLoading ? (
          <p className="text-text-muted">Loading your documents…</p>
        ) : (
          <DocumentList documents={documents} onDelete={handleDelete} />
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </AppShell>
  );
}
