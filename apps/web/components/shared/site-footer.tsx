import Link from "next/link";
import { ArrowUpRight, Heart, Leaf, ShieldCheck, Store } from "lucide-react";

const productLinks = [
  ["Explore surplus food", "/explore"],
  ["How FoodBite works", "/"],
  ["Notifications", "/notifications"],
] as const;

const partnerLinks = [
  ["For food businesses", "/seller"],
  ["For NGOs", "/ngo"],
  ["My account", "/account"],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner site-footer-grid">
        <div className="footer-brand-block">
          <Link href="/" className="brand" aria-label="FoodBite home">
            <span className="brand-mark">F</span>
            <span>FoodBite</span>
          </Link>
          <p className="footer-tagline">Good Food. Less Waste.</p>
          <p className="footer-copy">
            A thoughtful marketplace for eligible surplus food — helping people save, businesses recover value, and communities receive more.
          </p>
          <div className="footer-trust">
            <span><Leaf className="size-3.5" /> Surplus-first</span>
            <span><ShieldCheck className="size-3.5" /> Trust by design</span>
          </div>
        </div>

        <div className="footer-column">
          <p className="footer-heading">Product</p>
          {productLinks.map(([label, href]) => <Link key={href} href={href}>{label}<ArrowUpRight className="size-3.5" /></Link>)}
        </div>

        <div className="footer-column">
          <p className="footer-heading">Partners</p>
          {partnerLinks.map(([label, href]) => <Link key={href} href={href}>{label}<ArrowUpRight className="size-3.5" /></Link>)}
        </div>

        <div className="footer-column footer-note">
          <p className="footer-heading">Built for real life</p>
          <div className="footer-mini-card">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Store className="size-4" /></span>
            <div><strong>Pickup-first</strong><span>Clear windows. No made-up ETA.</span></div>
          </div>
          <div className="footer-mini-card">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Heart className="size-4" /></span>
            <div><strong>Less waste</strong><span>Better next chapters for good food.</span></div>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} FoodBite. All rights reserved.</span>
        <span>Made with care for a less-waste food system.</span>
      </div>
    </footer>
  );
}
