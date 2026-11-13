import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, Clock3, Search, WashingMachine } from "lucide-react";
import { orderStatuses } from "../../../constants/orderStatuses";
import { useOrderStore } from "../../../store/orderStore";
import type { Order } from "../../orders/types/order";
import { toast } from "sonner";

const progressStatuses = orderStatuses.filter((status) => status !== "Cancelled");

const statusDescriptions: Record<(typeof progressStatuses)[number], string> = {
  Received: "Your laundry has been checked in at the shop.",
  Washing: "Your items are being washed.",
  Drying: "Your laundry is in the drying stage.",
  Ironing: "Your items are being pressed and finished.",
  "Ready for Pickup": "Your order is ready to collect from the shop.",
  "Out for Delivery": "Your order is on its way to you.",
  Completed: "This order has been completed.",
};

export default function PublicTrackingPage() {
  const orders = useOrderStore((state) => state.orders);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  function trackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedNumber = trackingNumber.trim().toUpperCase();
    if (!normalizedNumber) {
      toast.error("Enter the tracking number from your receipt.");
      return;
    }

    const match = orders.find((order) => order.id.toUpperCase() === normalizedNumber);
    if (!match) {
      setTrackedOrder(null);
      toast.error("We couldn't find that tracking number. Check it and try again.");
      return;
    }

    setTrackedOrder(match);
  }

  const currentStep = trackedOrder ? progressStatuses.indexOf(trackedOrder.status as (typeof progressStatuses)[number]) : -1;
  const isCancelled = trackedOrder?.status === "Cancelled";

  return (
    <main className="min-h-screen bg-page px-4 py-6 sm:px-8 sm:py-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-emerald-900 no-underline" to="/login">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50"><WashingMachine size={20}/></span>
          Fresh &amp; Fold
        </Link>
      </header>

      <section className="mx-auto mt-10 w-full max-w-2xl sm:mt-16">
        <div className="mb-7 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Track your laundry</h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-gray-600">Enter the tracking number on your receipt to see the latest order status.</p>
        </div>

        <form className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:p-5" onSubmit={trackOrder} noValidate>
          <label className="sr-only" htmlFor="tracking-number">Tracking number</label>
          <input
            id="tracking-number"
            className="h-12 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none placeholder:text-gray-500 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            placeholder="e.g. WD-2481"
            value={trackingNumber}
            onChange={(event) => { setTrackingNumber(event.target.value); setTrackedOrder(null); }}
          />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800" type="submit">
            <Search size={17}/> Track order
          </button>
        </form>

        <p className="mt-3 text-center text-sm text-gray-600">Demo tracking number: <span className="font-semibold text-gray-800">WD-2481</span></p>

        {trackedOrder && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white" aria-live="polite" aria-labelledby="tracking-result-title">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-sm font-medium text-gray-600">Tracking number</p>
                <h2 id="tracking-result-title" className="mt-1 font-display text-2xl font-bold text-gray-900">{trackedOrder.id}</h2>
              </div>
              <span className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-sm font-semibold ${isCancelled ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"}`}>
                {trackedOrder.status}
              </span>
            </div>

            <div className="grid gap-4 border-b border-gray-200 px-5 py-5 sm:grid-cols-2 sm:px-7">
              <div><p className="text-sm text-gray-600">Items</p><p className="mt-1 text-base font-semibold text-gray-900">{trackedOrder.items}</p></div>
              <div><p className="text-sm text-gray-600">Expected completion</p><p className="mt-1 text-base font-semibold text-gray-900">{trackedOrder.due}</p></div>
            </div>

            {isCancelled ? (
              <div className="px-5 py-6 text-sm leading-6 text-rose-900 sm:px-7">This order was cancelled. Please contact Fresh &amp; Fold if you need help with it.</div>
            ) : (
              <div className="px-5 py-6 sm:px-7">
                <h3 className="font-display text-lg font-bold text-gray-900">Order progress</h3>
                <ol className="relative mt-5 grid gap-5 before:absolute before:bottom-5 before:left-[15px] before:top-4 before:w-px before:bg-gray-200">
                  {progressStatuses.map((status, index) => {
                    const complete = index < currentStep || trackedOrder.status === "Completed";
                    const current = index === currentStep;
                    return (
                      <li className="relative flex gap-4" key={status} aria-current={current ? "step" : undefined}>
                        <span className={`z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${complete || current ? "border-emerald-800 bg-emerald-800 text-white" : "border-gray-300 bg-white text-gray-600"}`}>
                          {complete ? <Check size={16}/> : current ? <Clock3 size={15}/> : <span className="text-xs font-semibold">{index + 1}</span>}
                        </span>
                        <span className="pt-0.5">
                          <span className={`block text-base font-semibold ${complete || current ? "text-gray-900" : "text-gray-600"}`}>{status}</span>
                          {(current || (trackedOrder.status === "Completed" && status === "Completed")) && <span className="mt-1 block text-sm leading-6 text-gray-600">{statusDescriptions[status]}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            <p className="border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-600 sm:px-7">Demo order status · sample data for this preview</p>
          </section>
        )}

      </section>

    </main>
  );
}
