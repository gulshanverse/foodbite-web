import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

const moduleLinks = [
  ["Explore marketplace", "/explore", "Discover eligible surplus food nearby.", Sparkles],
  ["Your account", "/account", "Profile, role and account controls.", UsersRound],
  ["Seller workspace", "/seller", "Listings, inventory and operations.", Store],
  ["NGO workspace", "/ngo", "Donation recovery and collections.", HeartHandshake],
] as const;

function cleanDescription(title: string, description: string) {
  if (/reserved for|introduced in a later phase/i.test(description)) {
    return `A focused FoodBite workspace for ${title.toLowerCase()}, designed to keep important information, states and next actions easy to scan.`;
  }
  return description;
}

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  const copy = cleanDescription(title, description);
  return (
    <main className="product-page workspace-page">
      <section className="workspace-hero">
        <div className="workspace-hero-glow" />
        <div className="workspace-hero-content">
          <div className="workspace-breadcrumb"><LayoutDashboard className="size-3.5" /> FoodBite workspace <span>/</span> {title}</div>
          <div className="workspace-title-row">
            <div>
              <div className="workspace-status-row">
                <span className="status-chip" data-tone="accent"><Sparkles className="size-3.5" /> Product surface</span>
                <span className="status-chip"><CheckCircle2 className="size-3.5" /> Responsive</span>
              </div>
              <h1 className="workspace-title">{title}</h1>
              <p className="workspace-description">{copy}</p>
            </div>
            <div className="workspace-mark" aria-hidden="true"><Settings2 className="size-7" /></div>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <article className="workspace-feature">
          <div className="workspace-feature-icon"><BarChart3 className="size-5" /></div>
          <div>
            <p className="page-kicker">Designed for clarity</p>
            <h2>One calm place for the work that matters.</h2>
            <p>FoodBite keeps operational information close to its next action, with clear states and responsive layouts across laptop, tablet and phone.</p>
          </div>
        </article>
        <article className="workspace-feature">
          <div className="workspace-feature-icon"><ShieldCheck className="size-5" /></div>
          <div>
            <p className="page-kicker">Trust by design</p>
            <h2>Real data. Clear boundaries.</h2>
            <p>Account access, ownership and transaction controls remain enforced by the server rather than relying on the interface alone.</p>
          </div>
        </article>
      </section>

      <section className="workspace-links surface-card">
        <div className="workspace-section-heading">
          <div><p className="page-kicker">FoodBite suite</p><h2>Continue your journey</h2></div>
          <p>Move between the surfaces you use most without losing context.</p>
        </div>
        <div className="workspace-link-grid">
          {moduleLinks.map(([label, href, text, Icon]) => (
            <Link key={href} href={href} className="workspace-link-card">
              <span className="workspace-link-icon"><Icon className="size-4" /></span>
              <span className="workspace-link-copy"><strong>{label}</strong><small>{text}</small></span>
              <ArrowRight className="workspace-link-arrow size-4" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
