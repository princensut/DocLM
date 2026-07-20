import axiosInstance from "./axiosInstance";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function askQuestion({ documentId, question }) {
  const { data } = await axiosInstance.post("/api/chat/ask", { documentId, question });
  return data; // { answer, notFound, citations }
}

/**
 * Streams tokens from /api/chat/ask/stream via SSE, invoking callbacks
 * as they arrive. Uses fetch directly (not axios) since axios doesn't
 * expose a readable byte stream in browsers as cleanly.
 */
export async function askQuestionStream({ documentId, question }, { onToken, onDone, onError }) {
  const response = await fetch(`${BASE_URL}/api/chat/ask/stream`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "rag-chat-app",
    },
    body: JSON.stringify({ documentId, question }),
  });

  if (!response.ok || !response.body) {
    onError?.(new Error("Failed to start the answer stream"));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop(); // keep the last, possibly incomplete, event in the buffer

    for (const rawEvent of events) {
      const lines = rawEvent.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event: "));
      const dataLine = lines.find((l) => l.startsWith("data: "));
      if (!eventLine || !dataLine) continue;

      const eventName = eventLine.replace("event: ", "").trim();
      const payload = JSON.parse(dataLine.replace("data: ", ""));

      if (eventName === "token") onToken?.(payload.text);
      else if (eventName === "done") onDone?.(payload);
      else if (eventName === "error") onError?.(new Error(payload.message));
    }
  }
}
