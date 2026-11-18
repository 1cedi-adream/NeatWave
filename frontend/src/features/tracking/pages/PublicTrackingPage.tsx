import { Check, Clock3, WashingMachine } from "lucide-react";
import { useParams } from "react-router-dom";
import { useTracking } from "../hooks/useTracking";
import { formatDateTime } from "@/lib/formatDate";
import { RealtimeConnectionBadge } from "@/features/realtime/components/RealtimeConnectionBadge";

const stages = ["Received", "Washing", "Ready for Pickup"] as const;

export default function PublicTrackingPage() {
  const { token = "" } = useParams();
  const tracking = useTracking(token);

  if (tracking.isPending)
    return (
      <main className="tracking-page">
        <section className="tracking-card">Loading order progress…</section>
      </main>
    );

  if (tracking.isError || !tracking.data)
    return (
      <main className="tracking-page">
        <section className="tracking-card">
          <Clock3 size={28} />
          <h1>Tracking link unavailable</h1>
          <p>
            This link is invalid or has expired. Contact the laundry for help.
          </p>
        </section>
      </main>
    );

  const currentStage = stages.indexOf(tracking.data.status);

  return (
    <main className="tracking-page">
      <section className="tracking-card">
        <WashingMachine size={28} />
        <RealtimeConnectionBadge />
        <p>Order progress</p>
        <h1>{tracking.data.orderNumber}</h1>
        <ol className="tracking-steps">
          {stages.map((stage, index) => (
            <li
              key={stage}
              className={index <= currentStage ? "is-complete" : ""}
            >
              <span>
                {index < currentStage ? <Check size={16} /> : index + 1}
              </span>
              <div>
                <b>{stage}</b>
                {index === currentStage && <small>Current status</small>}
              </div>
            </li>
          ))}
        </ol>
        <p>Expected by {formatDateTime(tracking.data.dueAt)}</p>
      </section>
    </main>
  );
}
