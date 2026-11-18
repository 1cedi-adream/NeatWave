import { useState } from "react";
import type { SubmitEvent } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCurrentUser, useUpdateProfile } from "../hooks/useAuth";
import { getApiErrorMessage } from "@/lib/apiError";

export default function ProfilePage() {
  const { data: user } = useCurrentUser();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    update.mutate(
      { name, email },
      {
        onSuccess: () => toast.success("Profile updated."),
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not update profile.")),
      },
    );
  }

  return (
    <div className="page-content">
      <PageHeader title="Profile" description="Your account details." />
      <section className="panel settings-panel max-w-2xl">
        <form className="settings-fields" onSubmit={submit}>
          <label>
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <div className="settings-readonly">
            <span>Role</span>
            <b>{user?.tenantRole === "manager" ? "Manager" : "Staff"}</b>
          </div>
          <button
            className="button button-primary w-fit"
            disabled={update.isPending}
          >
            <Save size={16} />
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>
    </div>
  );
}
