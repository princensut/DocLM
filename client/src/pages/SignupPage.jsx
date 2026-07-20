import SignupForm from "../features/auth/SignupForm";
import ThemeToggle from "../components/ThemeToggle";
import { FileText } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="signature-bg pointer-events-none absolute inset-0 h-full w-full" />
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <FileText size={22} className="text-accent" />
          DocuChat
        </div>
        <div className="w-full rounded-lg border border-border bg-bg-elevated p-8 shadow-card">
          <h1 className="mb-6 font-display text-lg font-semibold">Create your account</h1>
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
