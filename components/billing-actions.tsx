"use client";

async function createCheckout(path: string) {
  const res = await fetch(path, { method: "POST" });
  const json = await res.json();
  if (json.url) window.location.href = json.url;
}

export function BillingActions() {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <button className="button-primary" onClick={() => createCheckout("/api/stripe/checkout")}>
        Start subscription
      </button>
      <button className="button-secondary" onClick={() => createCheckout("/api/stripe/setup")}>
        Pay one-time setup
      </button>
    </div>
  );
}
