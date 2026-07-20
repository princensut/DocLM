import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as documentsApi from "../../api/documentsApi";

const DOCUMENTS_KEY = ["documents"];

export function useDocuments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: documentsApi.fetchDocuments,
    // Poll while anything is still processing/uploading; stop once
    // everything has settled into ready/failed. Idiomatic React Query
    // pattern per FRONTEND.md §4.2.
    refetchInterval: (query) => {
      const docs = query.state.data;
      const stillWorking = docs?.some((d) => d.status === "processing" || d.status === "uploading");
      return stillWorking ? 2000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: documentsApi.uploadDocuments,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  });

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    remove: deleteMutation.mutateAsync,
  };
}
