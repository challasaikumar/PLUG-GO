import { redirect } from "next/navigation";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { requireDriverPage } from "@/lib/auth/driver";
import { driverBookingView, getDriverBooking } from "@/lib/booking/queries";
import { markPaymentProcessing } from "@/lib/booking/service";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Payment processing",
  description: "Waiting for a verified payment webhook.",
  path: "/payments/return",
  index: false,
});

type PageProps = { searchParams: Promise<{ ref?: string }> };

export default async function PaymentReturnPage({ searchParams }: PageProps) {
  const driver = await requireDriverPage("/payments");
  const { ref } = await searchParams;
  if (!ref) redirect("/payments");
  await markPaymentProcessing(driver.id, ref);
  const booking = driverBookingView(await getDriverBooking(driver.id, ref));

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 640 }}>
      <h1 className="type-h1">Payment processing</h1>
      <ViewTracker event={ANALYTICS_EVENTS.payment_processing} />
      <Alert variant="warning" title="Not confirmed yet">
        Returning from checkout is not proof of payment. Plug and Go confirms a booking only after a signed server-side
        webhook. Current status: {booking.status.replaceAll("_", " ")}.
      </Alert>
      <p style={{ marginTop: 24 }}>
        <Button href={`/bookings/${booking.publicRef}`}>View booking</Button>
      </p>
    </div>
  );
}
