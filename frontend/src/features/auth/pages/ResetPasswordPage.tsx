import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";
import { useResetPassword } from "../hooks/useAuth";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const [complete, setComplete] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirmation"))) {
      toast.error("Passwords do not match.");
      return;
    }
    resetPassword.mutate(
      { token: token!, password },
      {
        onSuccess: () => setComplete(true),
        onError: (error) =>
          toast.error(
            getApiErrorMessage(error, "This reset link is invalid or expired."),
          ),
      },
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{complete ? "Password reset" : "Choose a new password"}</h1>
        {complete ? (
          <>
            <p>Your password has been updated.</p>
            <button
              className="button button-primary"
              onClick={() => navigate("/login")}
            >
              Go to sign in
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label>
              New password
              <input name="password" type="password" minLength={8} required />
            </label>
            <label>
              Confirm password
              <input
                name="confirmation"
                type="password"
                minLength={8}
                required
              />
            </label>
            <button
              className="button button-primary"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
