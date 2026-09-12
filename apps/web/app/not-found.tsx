import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return <main className="product-page grid min-h-[70svh] place-items-center"><section className="surface-card w-full max-w-2xl p-8 text-center sm:p-12"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Compass className="size-7" /></span><p className="page-kicker mt-6">404 · FoodBite</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">This page took a wrong turn.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6">The page you’re looking for isn’t available here. Let’s get you back to good food.</p><Link className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--foreground)] px-5 text-sm font-black text-[var(--background)]" href="/"><ArrowLeft className="size-4" />Back home</Link></section></main>;
}
