import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  WashingMachine,
} from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAcceptInvitation } from "../hooks/useAuth";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const acceptInvitation = useAcceptInvitation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirmation"))) {
      toast.error("Passwords do not match.");
      return;
    }

    acceptInvitation.mutate(
      {
        token: token!,
        fullName: String(form.get("fullName")).trim(),
        phone: String(form.get("phone")).trim() || undefined,
        password,
      },
      {
        onSuccess: () => {
          toast.success(
            "Invitation accepted. Welcome to your laundry workspace.",
          );
          navigate("/", { replace: true });
        },
        onError: (error) =>
          toast.error(
            getApiErrorMessage(
              error,
              "This invitation is invalid or expired. Ask your administrator to send a new one.",
            ),
          ),
      },
    );
  }

  return (
    <main className="invite-page">
      <section className="invite-card" aria-labelledby="invite-title">
        <header className="invite-brand">
          <span className="invite-brand-mark">
            <WashingMachine size={20} />
          </span>
          <span>NeatWave</span>
        </header>

        <div className="invite-heading">
          <span className="invite-heading-mark">
            <CheckCircle2 size={22} />
          </span>
          <p className="invite-eyebrow">Team invitation</p>
          <h1 id="invite-title">Set up your account</h1>
          <p className="invite-description">
            Create your manager profile to join the laundry team and start
            setting up your workspace.
          </p>
        </div>

        <form className="invite-form" onSubmit={submit}>
          <label>
            Full name
            <input
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              minLength={2}
              required
            />
          </label>

          <label>
            Phone number <span className="invite-optional">Optional</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. +233 24 000 0000"
            />
          </label>

          <label>
            Create password
            <span className="invite-password-field">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <button
                className="invite-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            <span className="invite-field-help">
              Use at least 8 characters.
            </span>
          </label>

          <label>
            Confirm password
            <span className="invite-password-field">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                name="confirmation"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your password again"
                minLength={8}
                required
              />
              <button
                className="invite-password-toggle"
                type="button"
                aria-label={
                  showConfirmation ? "Hide confirmation" : "Show confirmation"
                }
                onClick={() => setShowConfirmation((visible) => !visible)}
              >
                {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <button
            className="invite-submit"
            type="submit"
            disabled={acceptInvitation.isPending}
            aria-busy={acceptInvitation.isPending}
          >
            {acceptInvitation.isPending
              ? "Setting up your account…"
              : "Accept invitation"}
            {!acceptInvitation.isPending && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="invite-footer">
          By accepting, you’ll join the laundry workspace as a manager.
        </p>
      </section>
    </main>
  );
}
