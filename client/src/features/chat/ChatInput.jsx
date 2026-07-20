import { useState } from "react";
import { Send } from "lucide-react";
import { Spinner } from "../../components/ui/Primitives";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-4">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Ask a question about this document…"
        className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-contrast hover:bg-accent-hover transition-colors disabled:opacity-50"
        aria-label="Send question"
      >
        {disabled ? <Spinner className="h-4 w-4" /> : <Send size={16} />}
      </button>
    </form>
  );
}
