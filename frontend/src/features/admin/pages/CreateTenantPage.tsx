import { type FormEvent } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCreateTenant } from "../hooks/useAdmin";

export default function CreateTenantPage() {
  const createTenant = useCreateTenant();
  const navigate = useNavigate();

  function normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createTenant.mutate(
      {
        name: String(form.get("name")),
        slug: normalizeSlug(String(form.get("slug"))),
        managerEmail: String(form.get("managerEmail")),
      },
      {
        onSuccess: (tenant) => {
          toast.success("Laundry onboarded and manager invited.");
          navigate(`/admin/laundries/${tenant.id}`);
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not onboard laundry.")),
      },
    );
  }
  return (
    <div className="page-content admin-onboarding-page">
      <PageHeader
        title="Onboard laundry"
        description="Set up a laundry workspace and invite the person who will manage it."
        action={
          <button
            type="button"
            className="button button-secondary"
            onClick={() => navigate("/admin/laundries")}
          >
            <ArrowLeft size={16} />
            Back to laundries
          </button>
        }
      />
      <div className="admin-onboarding-layout">
        <form className="panel admin-form" onSubmit={submit}>
          <div className="admin-form-heading">
            <span className="admin-form-icon" aria-hidden="true">
              <Building2 size={20} />
            </span>
            <div>
              <h2>Laundry details</h2>
              <p>
                These details create the workspace and its first manager
                invitation.
              </p>
            </div>
          </div>
          <div className="admin-form-fields">
            <label>
              Laundry name
              <input
                name="name"
                required
                minLength={2}
                placeholder="Fresh & Fold Laundry"
                autoFocus
              />
              <span>The business name shown throughout the workspace.</span>
            </label>
            <label>
              Workspace slug
              <div className="slug-input">
                <span>neatwave.app/</span>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="fresh-and-fold"
                  aria-describedby="slug-help"
                  onBlur={(event) => {
                    event.currentTarget.value = normalizeSlug(
                      event.currentTarget.value,
                    );
                  }}
                />
              </div>
              <span id="slug-help">
                Use lowercase letters, numbers, and hyphens only.
              </span>
            </label>
            <label>
              Manager email
              <input
                name="managerEmail"
                type="email"
                required
                placeholder="manager@example.com"
              />
              <span>
                We’ll email this person an invitation to manage the laundry.
              </span>
            </label>
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/admin/laundries")}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              disabled={createTenant.isPending}
            >
              {createTenant.isPending ? "Creating laundry…" : "Create laundry"}
            </button>
          </div>
        </form>
        <aside className="admin-onboarding-note" aria-label="What happens next">
          <h2>What happens next?</h2>
          <ol>
            <li>The laundry workspace is created.</li>
            <li>The manager receives a secure invitation.</li>
            <li>They configure services, pricing, staff, and notifications.</li>
          </ol>
          <p>No customer or order data is created during onboarding.</p>
        </aside>
      </div>
    </div>
  );
}
