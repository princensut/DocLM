import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, onCitationClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-text-muted">
        <p>Ask anything about this document — answers are grounded in its content, with citations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onCitationClick={onCitationClick} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
