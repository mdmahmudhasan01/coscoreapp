import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { AnnouncementBar, SiteHeader, SiteFooter } from "@/components/site/chrome";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/result")({
  component: PaymentResult,
});

function PaymentResult() {
  const search = useSearch({ from: "/checkout/result" });
  const status = (search as any).status ?? "failure";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main className="container-luxe py-20 md:py-28">
        <div className="max-w-xl mx-auto text-center">
          <div
            className={`h-16 w-16 mx-auto rounded-full grid place-items-center ${
              isSuccess ? "bg-emerald/15 text-emerald" : "bg-destructive/15 text-destructive"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
          </div>
          <h1 className="text-serif text-4xl md:text-5xl mt-6">
            {isSuccess ? "Payment successful" : "Payment failed"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isSuccess
              ? "Your order has been placed successfully."
              : "There was an issue processing your payment. Please try again or contact support."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-8 bg-burgundy text-primary-foreground rounded-full px-7 py-4 text-sm font-semibold hover:shadow-luxury transition-all"
          >
            Continue shopping
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
