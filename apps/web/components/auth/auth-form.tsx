"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      if (mode === "signup") {
        if (form.get("password") !== form.get("confirmPassword")) {
          setError("Passwords do not match.");
          return;
        }
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
            role: form.get("role"),
          }),
        });
        if (!response.ok) {
          setError("We couldn't create your account. Please check your details and try again.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (result?.error) {
        setError("We couldn't sign you in with those details.");
        return;
      }
      router.push("/account");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const signup = mode === "signup";

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#173f3b]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-[#173f3b] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="absolute -right-32 -top-32 size-80 rounded-full bg-[#e85d3f]/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-96 rounded-full bg-[#f2c8a7]/15 blur-3xl" />
          <Link href="/" className="relative flex items-center gap-3 text-lg font-bold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-[#173f3b]">F</span>
            FoodBite
          </Link>
          <div className="relative max-w-lg py-16">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
              <span className="size-2 rounded-full bg-[#e85d3f]" />
              Good Food. Less Waste.
            </p>
            <h2 className="text-5xl font-bold leading-[1.04] tracking-[-.045em] xl:text-6xl">
              Give good food a better next chapter.
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-white/65">
              Discover eligible surplus food nearby, or help your food business turn surplus into value.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Benefit title="Nearby" text="Pickup-first discovery" />
              <Benefit title="Simple" text="Built for real workflows" />
              <Benefit title="Responsible" text="Trust by design" />
            </div>
          </div>
          <p className="relative text-xs text-white/40">An India-first surplus food marketplace.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-xl">
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                <span className="grid size-9 place-items-center rounded-xl bg-[#173f3b] text-sm text-white">F</span>
                FoodBite
              </Link>
              <Link href={signup ? "/login" : "/signup"} className="text-sm font-semibold text-[#55706c] hover:text-[#173f3b]">
                {signup ? "Sign in" : "Join us"}
              </Link>
            </div>

            <div className="rounded-[2rem] border border-[#dbe4df] bg-white p-6 shadow-[0_24px_70px_rgba(23,63,59,0.10)] sm:p-9 lg:p-10">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#fdf0e9] text-xl font-black text-[#e85d3f]">F</div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e85d3f]">{signup ? "Create your account" : "Welcome back"}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-.035em] sm:text-4xl">
                  {signup ? "Join FoodBite" : "Welcome back"}
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#55706c]">
                  {signup ? "Start discovering better food days, or bring your surplus food to people nearby." : "Sign in to continue to your FoodBite account."}
                </p>
              </div>

              <form className="space-y-5" onSubmit={submit} noValidate>
                {signup && <Field id="name" label="Full name" placeholder="Your name" autoComplete="name" required />}
                <Field id="email" label="Email address" type="email" placeholder="you@example.com" autoComplete="email" required />
                <PasswordField id="password" label="Password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" autoComplete={signup ? "new-password" : "current-password"} minLength={8} required shown={showPassword} onToggle={() => setShowPassword((value) => !value)} />
                {signup && <PasswordField id="confirmPassword" label="Confirm password" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" autoComplete="new-password" required shown={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} />}

                {signup && (
                  <fieldset>
                    <legend className="mb-2 block text-sm font-semibold">I’m joining as</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RoleOption value="BUYER" title="Buyer" description="Find great surplus food nearby" />
                      <RoleOption value="SELLER" title="Seller" description="Turn eligible surplus into value" />
                    </div>
                  </fieldset>
                )}

                {error && <div role="alert" className="rounded-xl border border-[#f3c8be] bg-[#fff4f1] px-4 py-3 text-sm font-medium leading-5 text-[#a43b2a]">{error}</div>}

                <button type="submit" disabled={pending} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e85d3f] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(232,93,63,0.22)] transition hover:-translate-y-0.5 hover:bg-[#cf4d32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e85d3f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                  {pending ? "Please wait…" : signup ? "Create my account" : "Sign in"}
                  {!pending && <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4 text-xs font-medium text-[#8a9a96]">
                <span className="h-px flex-1 bg-[#e7ece9]" />
                <span>FoodBite</span>
                <span className="h-px flex-1 bg-[#e7ece9]" />
              </div>

              <p className="text-center text-sm text-[#55706c]">
                {signup ? "Already have an account? " : "New to FoodBite? "}
                <Link href={signup ? "/login" : "/signup"} className="font-bold text-[#173f3b] underline decoration-[#e85d3f] decoration-2 underline-offset-4 hover:text-[#e85d3f]">
                  {signup ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-[#8a9a96]">By continuing, you agree to use FoodBite responsibly and provide accurate account details.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-white/50">{text}</p></div>;
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  const { id, label, ...rest } = props;
  return <label htmlFor={id} className="block text-sm font-semibold text-[#173f3b]"><span>{label}</span><input name={id} id={id} className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe4df] bg-[#fbfcfb] px-4 text-[15px] font-medium text-[#173f3b] outline-none transition placeholder:text-[#9aaba6] hover:border-[#b9cbc5] focus:border-[#e85d3f] focus:bg-white focus:ring-4 focus:ring-[#e85d3f]/10" {...rest} /></label>;
}

function PasswordField({ shown, onToggle, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; shown: boolean; onToggle: () => void }) {
  const { id, label, ...rest } = props;
  return <label htmlFor={id} className="block text-sm font-semibold text-[#173f3b]"><span>{label}</span><span className="relative mt-2 block"><input name={id} id={id} className="min-h-12 w-full rounded-xl border border-[#dbe4df] bg-[#fbfcfb] px-4 pr-16 text-[15px] font-medium text-[#173f3b] outline-none transition placeholder:text-[#9aaba6] hover:border-[#b9cbc5] focus:border-[#e85d3f] focus:bg-white focus:ring-4 focus:ring-[#e85d3f]/10" {...rest} /><button type="button" onClick={onToggle} aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute inset-y-0 right-2 my-1 rounded-lg px-3 text-xs font-bold text-[#55706c] hover:bg-[#eef2ef] hover:text-[#173f3b]">{shown ? "Hide" : "Show"}</button></span></label>;
}

function RoleOption({ value, title, description }: { value: "BUYER" | "SELLER"; title: string; description: string }) {
  return <label className="group relative cursor-pointer"><input type="radio" name="role" value={value} defaultChecked={value === "BUYER"} className="peer sr-only" /><span className="block min-h-[92px] rounded-2xl border border-[#dbe4df] bg-[#fbfcfb] p-4 transition group-hover:border-[#b9cbc5] peer-checked:border-[#e85d3f] peer-checked:bg-[#fff8f5] peer-focus-visible:ring-4 peer-focus-visible:ring-[#e85d3f]/10"><span className="flex items-start justify-between gap-3"><span><span className="block text-sm font-bold text-[#173f3b]">{title}</span><span className="mt-1 block text-xs leading-5 text-[#55706c]">{description}</span></span><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-[#b9cbc5] bg-white peer-checked:border-[#e85d3f]"><span className="size-2 rounded-full bg-[#e85d3f] opacity-0 transition peer-checked:opacity-100" /></span></span></span></label>;
}
