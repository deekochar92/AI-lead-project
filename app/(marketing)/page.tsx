import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <nav className="flex items-center justify-between">
        <p className="text-xl font-bold">LeadPilot</p>
        <Link href="/login" className="button-secondary">
          Log in
        </Link>
      </nav>

      <section className="mt-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Qualify leads while you sleep</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Launch branded intake forms, auto-score every inquiry, and focus on the highest-value opportunities.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login" className="button-primary">
            Start free trial
          </Link>
          <a href="#pricing" className="button-secondary">
            View pricing
          </a>
        </div>
      </section>

      <section id="pricing" className="mt-20 grid gap-6 md:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-semibold">Growth</h2>
          <p className="mt-2 text-slate-600">For solo operators and new agencies.</p>
          <p className="mt-6 text-3xl font-bold">$49/mo</p>
          <p className="text-sm text-slate-500">+ one-time $199 onboarding setup</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Unlimited forms</li>
            <li>500 leads/month</li>
            <li>Email notifications</li>
          </ul>
        </article>
        <article className="card border-brand">
          <h2 className="text-xl font-semibold">Scale</h2>
          <p className="mt-2 text-slate-600">For teams that need volume and collaboration.</p>
          <p className="mt-6 text-3xl font-bold">$149/mo</p>
          <p className="text-sm text-slate-500">+ one-time $399 onboarding setup</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>Unlimited forms and leads</li>
            <li>Workspace seats</li>
            <li>Priority support</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
