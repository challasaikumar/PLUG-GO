import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MockCheckoutForm } from "@/components/booking/MockCheckoutForm";
import { requireDriverPage } from "@/lib/auth/driver";
import { isPaymentMockEnabled } from "@/lib/payments/config";
import { pageMeta } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Mock checkout",
  description: "Development payment checkout.",
  path: "/payments/mock-checkout",
  index: false,
});

export default async function MockCheckoutPage() {
  await requireDriverPage("/payments");
  if (!isPaymentMockEnabled()) redirect("/payments");
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 640 }}>
      <h1 className="type-h1">Hosted mock checkout</h1>
      <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
        This is not Razorpay. It posts a signed mock webhook into the same verification path used in production.
      </p>
      <Suspense>
        <MockCheckoutForm />
      </Suspense>
    </div>
  );
}
