import axiosInstance from "./axiosInstance";

export async function fetchDocuments() {
  const { data } = await axiosInstance.get("/api/documents");
  return data.documents;
}

export async function uploadDocuments(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await axiosInstance.post("/api/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.documents;
}

export async function fetchDocumentStatus(documentId) {
  const { data } = await axiosInstance.get(`/api/documents/${documentId}/status`);
  return data.document;
}

export async function deleteDocument(documentId) {
  await axiosInstance.delete(`/api/documents/${documentId}`);
}
