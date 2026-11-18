import { useEffect, useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { PanelSkeleton } from "@/components/shared/LoadingSkeletons";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import type { BusinessSettings } from "../types/businessSettings";

export default function SettingsPage() {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const currentUser = useCurrentUser();
  const [formKey, setFormKey] = useState(0);
  const canManage = currentUser.data?.tenantRole === "manager";

  useEffect(() => {
    if (settings.data) setFormKey((key) => key + 1);
  }, [settings.data]);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings.data) return;
    const form = new FormData(event.currentTarget);
    const changes: Partial<BusinessSettings> = {};
    const textFields = [
      "businessName",
      "address",
      "phone",
      "email",
      "receiptFooter",
    ] as const;
    for (const fieldName of textFields) {
      const nextValue = String(form.get(fieldName) ?? "");
      if (nextValue !== settings.data[fieldName])
        changes[fieldName] = nextValue;
    }
    const completionHours = Number(form.get("defaultCompletionHours"));
    if (completionHours !== settings.data.defaultCompletionHours) {
      changes.defaultCompletionHours = completionHours;
    }
    for (const fieldName of [
      "showContactOnReceipt",
      "smsEnabled",
      "emailEnabled",
    ] as const) {
      const nextValue = form.get(fieldName) === "on";
      if (nextValue !== settings.data[fieldName])
        changes[fieldName] = nextValue;
    }
    if (!Object.keys(changes).length) {
      toast.info("There are no settings changes to save.");
      return;
    }
    updateSettings.mutate(changes, {
      onSuccess: () => toast.success("Settings saved."),
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Could not save settings.")),
    });
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Settings"
        description={
          canManage
            ? "Manage business details, receipts, and customer update channels."
            : "View receipt and customer update settings configured by your manager."
        }
      />
      {settings.isPending ? (
        <section className="panel">
          <PanelSkeleton label="Loading settings" />
        </section>
      ) : settings.isError ? (
        <section className="panel empty-state">
          <b>Settings could not be loaded</b>
          <button onClick={() => void settings.refetch()}>Retry</button>
        </section>
      ) : (
        settings.data &&
        (canManage ? (
          <form key={formKey} className="settings-form" onSubmit={submit}>
            <section className="panel">
              <h2>Business details</h2>
              <label>
                Business name
                <input
                  name="businessName"
                  defaultValue={settings.data.businessName}
                />
              </label>
              <label>
                Address
                <input name="address" defaultValue={settings.data.address} />
              </label>
              <label>
                Phone
                <input name="phone" defaultValue={settings.data.phone} />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  defaultValue={settings.data.email}
                />
              </label>
            </section>
            <section className="panel">
              <h2>Orders and receipts</h2>
              <label>
                Default completion time (hours)
                <input
                  name="defaultCompletionHours"
                  type="number"
                  min="1"
                  defaultValue={settings.data.defaultCompletionHours}
                />
              </label>
              <label>
                Receipt footer
                <textarea
                  name="receiptFooter"
                  defaultValue={settings.data.receiptFooter}
                />
              </label>
              <label>
                <input
                  name="showContactOnReceipt"
                  type="checkbox"
                  defaultChecked={settings.data.showContactOnReceipt}
                />{" "}
                Show contact details on receipts
              </label>
            </section>
            <section className="panel">
              <h2>Customer updates</h2>
              <label>
                <input
                  name="smsEnabled"
                  type="checkbox"
                  defaultChecked={settings.data.smsEnabled}
                />{" "}
                Enable SMS
              </label>
              <label>
                <input
                  name="emailEnabled"
                  type="checkbox"
                  defaultChecked={settings.data.emailEnabled}
                />{" "}
                Enable email
              </label>
            </section>
            <button
              className="button button-primary"
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? "Saving…" : "Save settings"}
            </button>
          </form>
        ) : (
          <div className="settings-readonly">
            <section className="panel">
              <h2>Orders and receipts</h2>
              <dl className="settings-summary">
                <div>
                  <dt>Default completion time</dt>
                  <dd>{settings.data.defaultCompletionHours} hours</dd>
                </div>
                <div>
                  <dt>Receipt footer</dt>
                  <dd>{settings.data.receiptFooter || "No footer set"}</dd>
                </div>
                <div>
                  <dt>Contact details on receipts</dt>
                  <dd>
                    {settings.data.showContactOnReceipt ? "Shown" : "Hidden"}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="panel">
              <h2>Customer updates</h2>
              <dl className="settings-summary">
                <div>
                  <dt>SMS updates</dt>
                  <dd>{settings.data.smsEnabled ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt>Email updates</dt>
                  <dd>{settings.data.emailEnabled ? "Enabled" : "Disabled"}</dd>
                </div>
              </dl>
            </section>
          </div>
        ))
      )}
    </div>
  );
}
