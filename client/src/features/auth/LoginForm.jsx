import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Input, Spinner } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        id="email"
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="you@example.com"
      />
      <Input
        id="password"
        label="Password"
        type="password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="Your password"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? <Spinner className="h-4 w-4" /> : "Log in"}
      </Button>
      <p className="text-center text-sm text-text-muted">
        Don't have an account?{" "}
        <Link to="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
