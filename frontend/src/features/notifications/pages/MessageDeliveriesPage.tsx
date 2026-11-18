import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCurrentUser } from "@/features/auth/hooks/useAuth";
import { DeliveryStatusPanel } from "../components/DeliveryStatusPanel";

export default function MessageDeliveriesPage() {
  const currentUser = useCurrentUser();

  if (currentUser.data?.tenantRole !== "manager")
    return <Navigate to="/notifications" replace />;

  return (
    <div className="page-content">
      <PageHeader
        title="Customer messages"
        description="Review SMS and email messages sent for orders and invitations."
        action={
          <Link className="button button-secondary" to="/notifications">
            <ArrowLeft size={16} />
            Back to notifications
          </Link>
        }
      />
      <DeliveryStatusPanel />
    </div>
  );
}
