import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors - the axios interceptor already
        // handles token refresh; retrying here would just duplicate work.
        if (error?.response?.status === 401 || error?.response?.status === 403) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
