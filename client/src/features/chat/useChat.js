import { useState, useCallback, useRef } from "react";
import { askQuestionStream } from "../../api/chatApi";

let idCounter = 0;
const nextId = () => `msg-${++idCounter}-${Date.now()}`;

/**
 * Manages the current chat session's messages in local state only -
 * chat history is intentionally NOT persisted server-side for v1.
 * See PRD §4.7.
 */
export function useChat(documentId) {
  const [messages, setMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const streamingIdRef = useRef(null);

  const ask = useCallback(
    async (question) => {
      const userMessage = { id: nextId(), role: "user", content: question };
      const assistantId = nextId();
      streamingIdRef.current = assistantId;

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "", citations: [], notFound: false, isStreaming: true },
      ]);
      setIsAsking(true);

      const updateAssistant = (patch) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m))
        );
      };

      try {
        await askQuestionStream(
          { documentId, question },
          {
            onToken: (text) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m))
              );
            },
            onDone: ({ notFound, citations }) => {
              updateAssistant({ notFound, citations, isStreaming: false });
            },
            onError: (err) => {
              updateAssistant({
                content: "Sorry, the AI service is temporarily unavailable. Please try again shortly.",
                isStreaming: false,
                isError: true,
              });
              // eslint-disable-next-line no-console
              console.error(err);
            },
          }
        );
      } finally {
        setIsAsking(false);
      }
    },
    [documentId]
  );

  return { messages, ask, isAsking };
}
