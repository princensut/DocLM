import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Primitives";

export default function SignupForm() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
        placeholder="At least 8 characters"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? <Spinner className="h-4 w-4" /> : "Create account"}
      </Button>
      <p className="text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
