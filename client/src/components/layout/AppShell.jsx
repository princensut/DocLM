import { Link, useNavigate } from "react-router-dom";
import { FileText, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ThemeToggle";
import Button from "../ui/Button";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg text-text font-body">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText size={20} className="text-accent" />
            DocuChat
          </Link>
          <div className="flex items-center gap-3">
            {user && <span className="hidden text-sm text-text-muted sm:inline">{user.email}</span>}
            <ThemeToggle />
            {user && (
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
