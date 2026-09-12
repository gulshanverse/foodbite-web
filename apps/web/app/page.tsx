"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, HeartHandshake, MapPin, Sparkles, Store } from "lucide-react";

const slides = [
  { eyebrow: "Discover nearby", title: "Good food, right when it matters.", copy: "Find eligible surplus food from nearby businesses with clear pickup windows and straightforward pricing.", icon: MapPin, tone: "coral" },
  { eyebrow: "For businesses", title: "Turn surplus into value.", copy: "Publish what is available, manage inventory, and keep every transaction tied to a real pickup or delivery workflow.", icon: Store, tone: "green" },
  { eyebrow: "For communities", title: "Share more. Waste less.", copy: "When eligible surplus cannot be sold, verified recovery partners can help move it toward a useful next chapter.", icon: HeartHandshake, tone: "sand" },
] as const;

const pillars = [
  { icon: Clock3, title: "Clear pickup windows", text: "Know when an offer is available instead of guessing about an ETA." },
  { icon: Store, title: "Seller-led supply", text: "Listings come from food businesses that control their own inventory and availability." },
  { icon: HeartHandshake, title: "Recovery by design", text: "Eligible surplus can move through sale or verified donation workflows." },
];

export default function Home() {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6000); return () => window.clearInterval(timer); }, []);
  const slide = slides[active];
  const Icon = slide.icon;

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="status-chip" data-tone="accent"><Sparkles className="size-3.5" /> India-first surplus food marketplace</span>
          <p className="home-overline">Good food deserves a better next chapter.</p>
          <h1>Good Food.<br /><span>Less Waste.</span></h1>
          <p className="home-intro">FoodBite helps food businesses turn eligible surplus food into value — while people discover good food nearby at a better price.</p>
          <div className="home-actions"><Link href="/explore" className="home-primary">Find food near me <ArrowRight className="size-4" /></Link><Link href="/seller" className="home-secondary">For food businesses</Link></div>
          <div className="home-trust-row"><span><MapPin className="size-4" /> Nearby first</span><span><Clock3 className="size-4" /> Live pickup windows</span><span><HeartHandshake className="size-4" /> Trust by design</span></div>
        </div>
        <div className="home-story" aria-label="FoodBite product story">
          <div className={`home-story-stage home-story-${slide.tone}`}>
            <div className="home-story-top"><span>FOODBITE / PRODUCT STORY</span><span>{String(active + 1).padStart(2, "0")} / 03</span></div>
            <div className="home-story-card">
              <div className="home-story-card-head"><span className="status-chip" data-tone="accent">{slide.eyebrow}</span><span className="home-story-icon"><Icon className="size-5" /></span></div>
              <h2>{slide.title}</h2><p>{slide.copy}</p>
              <div className="home-story-detail"><div><small>DESIGNED AROUND</small><strong>Nearby discovery · clear availability · accountable transactions</strong></div><div className="home-story-line" /><div><small>GOOD FOOD</small><strong>Less waste, more value, better next chapters.</strong></div></div>
            </div>
            <div className="home-story-controls"><button type="button" onClick={() => setActive((active - 1 + slides.length) % slides.length)} aria-label="Previous story"><ChevronLeft className="size-4" /></button><div className="home-story-dots">{slides.map((item, index) => <button key={item.eyebrow} type="button" aria-label={`Show story ${index + 1}`} aria-current={index === active} onClick={() => setActive(index)} />)}</div><button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="Next story"><ChevronRight className="size-4" /></button></div>
          </div>
        </div>
      </section>
      <section className="home-section home-section-bordered">
        <div className="home-section-heading"><div><p className="page-kicker">The FoodBite difference</p><h2>A calmer way to move good food.</h2></div><p>Premium on the surface. Practical underneath. Every important action stays close to the information you need.</p></div>
        <div className="home-pillars">{pillars.map(({ icon: PillarIcon, title, text }) => <article key={title} className="home-pillar"><span><PillarIcon className="size-5" /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="home-section home-cta"><div><p className="page-kicker">Start where you are</p><h2>Find your next good meal — or give your surplus a better path.</h2></div><div className="home-cta-actions"><Link href="/explore" className="home-primary">Explore food <ArrowRight className="size-4" /></Link><Link href="/signup" className="home-secondary">Create an account</Link></div></section>
    </main>
  );
}
